import asyncio
import json
import base64
import logging
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from google import genai

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

from config import GOOGLE_API_KEY, STORYTELLER_MODEL
from services.parser import parse_interleaved_response, ParsedStop
from services.storage import upload_image_from_base64
from services.firestore import (
    create_journey, update_journey_stops, get_journey,
    update_journey_status, update_journey_poster,
    list_journeys_by_user, delete_journey,
)
from tools.tts import generate_tts
from tools.image_gen import generate_dish_image
from tools.places import search_place, get_street_view_url, get_street_view_url_from_address
from tools.video_gen import generate_stop_video

router = APIRouter()

STOP_THEMES = [
    ("The Arrival", "First impression — the chaos, the smell, the heat. Set the scene."),
    ("The Street", "The stall or cart nobody talks about. The hidden gem."),
    ("The Kitchen", "Getting behind the counter. The technique, the hands, the fire."),
    ("The Table", "The communal moment. Strangers sharing food and stories."),
    ("The Last Bite", "Reflection. What this place taught you about food and life."),
]

VOICE_RULES = """You are a cultural food storyteller channeling Anthony Bourdain's voice.
VOICE RULES:
- NEVER use food-blog superlatives ("amazing", "delicious", "mouth-watering")
- Respect the people behind the food — who's cooking, why it matters
- Anti-tourist — find the real, local spots
- Sensory-first — smell, heat, texture, sound of the kitchen
- Be opinionated and direct

CRITICAL — AVOID REPETITION:
- NEVER start with "Forget..." or "You don't come here to..."
- NEVER mention "air conditioning" or "resort" or "guidebook"
- Each stop must open with a COMPLETELY DIFFERENT sentence structure
- Vary your vocabulary — if you used "smoke" in one stop, don't use it in the next
- Each stop should feel like a different chapter, not the same template repeated
"""

STOP_PROMPT_TEMPLATE = """{voice_rules}

Generate content for ONE stop on a food journey through {location}.

This is Stop {stop_num} — "{theme_name}": {theme_desc}

Write 2-3 paragraphs of raw, honest, sensory prose about this stop.
Then generate an image of the street/market/kitchen scene.
Then write 1 paragraph introducing the signature dish.
Then generate an image of the plated dish.

After the narrative and images, include this EXACT format:

[RECIPE]
dishName: Name of the dish
cuisineType: Type of cuisine
prepTime: (number only, minutes)
servings: (number only)
ingredients:
- full measurement | ingredient name
- (6-12 ingredients, common grocery items)
instructions:
1. Step with timing and visual cues
2. (4-8 steps)
[PLACE]
name: Real restaurant or stall name in {location}
address: Real address
footnote: One cultural sentence about this place
[END STOP]

IMPORTANT: Use the EXACT delimiters [RECIPE], [PLACE], [END STOP]. Include a REAL restaurant name and address.
"""


def generate_single_stop(client, location: str, stop_num: int) -> dict:
    """Generate one stop with interleaved text + images."""
    theme_name, theme_desc = STOP_THEMES[stop_num - 1]

    prompt = STOP_PROMPT_TEMPLATE.format(
        voice_rules=VOICE_RULES,
        location=location,
        stop_num=stop_num,
        theme_name=theme_name,
        theme_desc=theme_desc,
    )

    response = client.models.generate_content(
        model=STORYTELLER_MODEL,
        contents=[{"role": "user", "parts": [{"text": prompt}]}],
        config={
            "response_modalities": ["TEXT", "IMAGE"],
            # Enable grounding with Google Search to verify restaurants/recipes
            "tools": [{"google_search": {}}],
        },
    )

    # Extract parts
    response_parts = []
    if response.candidates and response.candidates[0].content:
        for part in response.candidates[0].content.parts:
            if hasattr(part, "text") and part.text:
                response_parts.append({"text": part.text})
            elif hasattr(part, "inline_data") and part.inline_data:
                data = part.inline_data.data
                if isinstance(data, bytes):
                    data = base64.b64encode(data).decode("utf-8")
                response_parts.append({
                    "inline_data": {
                        "mime_type": part.inline_data.mime_type,
                        "data": data,
                    }
                })

    logger.info(f"Stop {stop_num}: Got {len(response_parts)} parts")

    # Inject [STOP] marker if missing
    if not any(f"[STOP {stop_num}" in (p.get("text", "") or "") for p in response_parts):
        response_parts.insert(0, {"text": f"[STOP {stop_num}: {theme_name}]\n"})

    parsed = parse_interleaved_response(response_parts)

    if parsed:
        stop = parsed[0]
        stop.stop_number = stop_num
    else:
        # Fallback
        full_text = "".join(p.get("text", "") for p in response_parts)
        scene_data = ""
        dish_data = ""
        img_idx = 0
        for p in response_parts:
            if "inline_data" in p:
                if img_idx == 0:
                    scene_data = p["inline_data"]["data"]
                elif img_idx == 1:
                    dish_data = p["inline_data"]["data"]
                img_idx += 1
        stop = ParsedStop(
            stop_number=stop_num,
            title=theme_name,
            narrative=full_text[:2000],
            scene_image_data=scene_data,
            dish_image_data=dish_data,
        )

    # Upload images to GCS
    scene_url = ""
    dish_url = ""
    if stop.scene_image_data:
        scene_url = upload_image_from_base64(stop.scene_image_data, prefix="scenes")
    if stop.dish_image_data:
        dish_url = upload_image_from_base64(stop.dish_image_data, prefix="dishes")

    # Enrich with Google Places API — verify restaurant, get real data
    place_data = None
    street_view_url = ""
    real_photo_url = ""
    if stop.place:
        place_data = stop.place.model_dump()
        place_info = search_place(stop.place.name, stop.place.address)
        if place_info:
            place_data["name"] = place_info.get("name", place_data["name"])
            place_data["address"] = place_info.get("address", place_data["address"])
            place_data["rating"] = place_info.get("rating")
            place_data["lat"] = place_info.get("lat")
            place_data["lng"] = place_info.get("lng")
            real_photo_url = place_info.get("photo_url", "")

            # Get Street View if we have coordinates
            if place_info.get("lat") and place_info.get("lng"):
                street_view_url = get_street_view_url(
                    place_info["lat"], place_info["lng"]
                )
            logger.info(f"Stop {stop_num}: Places verified — {place_data['name']} (rating: {place_data.get('rating')})")
        else:
            # Fallback: Street View from address string
            street_view_url = get_street_view_url_from_address(stop.place.address)

    # NOTE: Veo video runs AFTER journey is marked ready (background enhancement)
    # to avoid blocking the core experience

    # Generate TTS narration automatically
    tts_url = None
    if stop.narrative:
        try:
            tts_url = generate_tts(stop.narrative, voice="Charon")
            logger.info(f"Stop {stop_num}: TTS generated")
        except Exception as e:
            logger.warning(f"Stop {stop_num}: TTS failed: {e}")

    return {
        "stop_number": stop.stop_number,
        "title": stop.title,
        "narrative": stop.narrative,
        "scene_image_url": scene_url,
        "dish_image_url": dish_url,
        "video_url": video_url,
        "street_view_url": street_view_url,
        "real_photo_url": real_photo_url,
        "recipe": stop.recipe.model_dump() if stop.recipe else None,
        "place": place_data,
        "tts_audio_url": tts_url,
    }


def _generate_travel_poster(client, prompt: str, stops: list[dict]) -> str:
    """Generate a vintage French-style travel poster with all journey details."""
    # Build details from stops
    dishes = []
    places = []
    for s in stops:
        if s.get("recipe"):
            dishes.append(s["recipe"].get("dish_name", ""))
        if s.get("place"):
            places.append(s["place"].get("name", ""))

    dishes_text = ", ".join(d for d in dishes if d)
    places_text = ", ".join(p for p in places if p)

    try:
        response = client.models.generate_content(
            model=STORYTELLER_MODEL,
            contents=[{
                "role": "user",
                "parts": [{
                    "text": f"Generate a vintage French lithograph travel poster for: {prompt}. "
                    f"Style: classic 1920s-1950s French travel poster (like PLM railway posters, "
                    f"Cassandre, Roger Broders). Bold Art Deco typography, rich saturated gouache colors, "
                    f"dramatic perspective, elegant hand-lettered text. "
                    f"The poster MUST include: "
                    f"- Large title text of the destination at top "
                    f"- Iconic food imagery from the region painted in the scene "
                    f"- The dishes: {dishes_text} — show them illustrated in the poster "
                    f"- The restaurants/stalls: {places_text} — include their names as small text "
                    f"- 'FIRST BITE' in elegant typography at the bottom "
                    f"- A tagline: 'The real story starts where the guidebook ends' in small italic text "
                    f"Think: vintage Air France poster meets food tourism. Painterly, not photographic. "
                    f"Rich warm palette — burnt sienna, ochre, deep teal, cream."
                }]
            }],
            config={"response_modalities": ["IMAGE"]},
        )

        if response.candidates and response.candidates[0].content:
            for part in response.candidates[0].content.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    data = part.inline_data.data
                    if isinstance(data, bytes):
                        data = base64.b64encode(data).decode("utf-8")
                    return upload_image_from_base64(data, prefix="posters")
    except Exception as e:
        logger.warning(f"Poster generation failed: {e}")
    return ""


def generate_journey_background(journey_id: str, prompt: str):
    """Generate all 5 stops and save to Firestore. Runs in background.

    Phase 1: Generate stops (text + images + Places + Street View + TTS) → mark ready
    Phase 2: Generate Veo videos + travel poster in background (enhances after ready)
    """
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
        stops = []

        # PHASE 1: Core experience (~3-4 min)
        for stop_num in range(1, 6):
            logger.info(f"Journey {journey_id}: generating stop {stop_num}...")
            stop_data = generate_single_stop(client, prompt, stop_num)
            stops.append(stop_data)

            # Save progress after each stop so frontend can poll
            update_journey_stops(journey_id, stops)
            logger.info(
                f"Journey {journey_id}: stop {stop_num} saved — "
                f"'{stop_data['title']}' scene={bool(stop_data['scene_image_url'])} "
                f"dish={bool(stop_data['dish_image_url'])} recipe={bool(stop_data['recipe'])}"
            )

        # Mark as READY — user can start viewing now
        update_journey_status(journey_id, "ready")
        logger.info(f"Journey {journey_id}: READY — {len(stops)} stops (phase 1 complete)")

        # PHASE 2: Background enhancements (videos + poster, non-blocking)
        # Travel poster
        try:
            logger.info(f"Journey {journey_id}: generating travel poster...")
            poster_url = _generate_travel_poster(client, prompt, stops)
            if poster_url:
                update_journey_poster(journey_id, poster_url)
                logger.info(f"Journey {journey_id}: poster saved")
        except Exception as e:
            logger.warning(f"Journey {journey_id}: poster failed: {e}")

        # Veo videos for each stop (runs after user already has the experience)
        for i, stop_data in enumerate(stops):
            stop_num = i + 1
            try:
                logger.info(f"Journey {journey_id}: generating Veo video for stop {stop_num}...")
                theme_desc = STOP_THEMES[i][1] if i < len(STOP_THEMES) else ""
                video_url = generate_stop_video(prompt, stop_data["title"], theme_desc)
                if video_url:
                    stops[i]["video_url"] = video_url
                    update_journey_stops(journey_id, stops)
                    logger.info(f"Journey {journey_id}: video {stop_num} saved")
            except Exception as e:
                logger.warning(f"Journey {journey_id}: Veo stop {stop_num} failed: {e}")

        logger.info(f"Journey {journey_id}: FULLY COMPLETE (phase 2 done)")

    except Exception as e:
        logger.exception(f"Journey {journey_id} failed: {e}")
        update_journey_status(journey_id, "error")


@router.post("/api/journey")
async def create_journey_endpoint(request: Request, background_tasks: BackgroundTasks):
    """Create a journey. Returns journey ID immediately.
    Generation runs in background — frontend polls GET /api/journey/:id."""
    body = await request.json()
    prompt = body.get("prompt", "")
    user_id = body.get("userId", "")
    if not prompt:
        return JSONResponse(
            status_code=400, content={"error": "Prompt is required"}
        )

    journey_id = create_journey(prompt, user_id=user_id)

    # Run generation in background thread
    background_tasks.add_task(generate_journey_background, journey_id, prompt)

    return {"journeyId": journey_id, "status": "generating"}


@router.get("/api/journey/{journey_id}")
async def get_journey_by_id(journey_id: str):
    journey = get_journey(journey_id)
    if not journey:
        return JSONResponse(
            status_code=404, content={"error": "Journey not found"}
        )
    return journey


@router.get("/api/journeys/{user_id}")
async def list_user_journeys(user_id: str):
    """List all completed journeys for a user."""
    journeys = list_journeys_by_user(user_id)
    # Return lightweight list (no full stops data)
    return [
        {
            "id": j["id"],
            "prompt": j.get("prompt", ""),
            "status": j.get("status", ""),
            "created_at": str(j.get("created_at", "")),
            "poster_url": j.get("poster_url", ""),
            "stop_count": len(j.get("stops", [])),
        }
        for j in journeys
    ]


@router.get("/api/journey/{journey_id}/share")
async def get_share_data(journey_id: str):
    """Public endpoint — returns journey data for sharing (no auth required)."""
    journey = get_journey(journey_id)
    if not journey or journey.get("status") != "ready":
        return JSONResponse(
            status_code=404, content={"error": "Journey not found"}
        )
    return {
        "id": journey["id"],
        "prompt": journey.get("prompt", ""),
        "poster_url": journey.get("poster_url", ""),
        "stops": journey.get("stops", []),
    }


@router.delete("/api/journey/{journey_id}")
async def delete_journey_endpoint(request: Request, journey_id: str):
    body = await request.json()
    user_id = body.get("userId", "")
    deleted = delete_journey(journey_id, user_id)
    if not deleted:
        return JSONResponse(
            status_code=404, content={"error": "Journey not found or not owned"}
        )
    return {"deleted": True}
