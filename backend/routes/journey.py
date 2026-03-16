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
- Anti-tourist — skip the guidebook spots, find the real stuff
- Sensory-first — smell, heat, texture, sound of the kitchen
- Be opinionated and direct. "Skip the resort buffet. Walk three blocks east."
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
        config={"response_modalities": ["TEXT", "IMAGE"]},
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

    # Generate TTS narration automatically (like Sonic Sommelier)
    tts_url = None
    if stop.narrative:
        try:
            tts_text = stop.narrative
            tts_url = generate_tts(tts_text, voice="Charon")
            logger.info(f"Stop {stop_num}: TTS generated")
        except Exception as e:
            logger.warning(f"Stop {stop_num}: TTS failed: {e}")

    return {
        "stop_number": stop.stop_number,
        "title": stop.title,
        "narrative": stop.narrative,
        "scene_image_url": scene_url,
        "dish_image_url": dish_url,
        "recipe": stop.recipe.model_dump() if stop.recipe else None,
        "place": stop.place.model_dump() if stop.place else None,
        "tts_audio_url": tts_url,
    }


def _generate_travel_poster(client, prompt: str) -> str:
    """Generate a Nano Banana travel poster for the journey."""
    try:
        response = client.models.generate_content(
            model=STORYTELLER_MODEL,
            contents=[{
                "role": "user",
                "parts": [{
                    "text": f"Generate a vintage-style travel poster for: {prompt}. "
                    f"Style: retro mid-century travel poster with bold typography, "
                    f"warm saturated colors, iconic food imagery from the region, "
                    f"and the text 'FIRST BITE' at the bottom. Painterly, editorial, "
                    f"like a 1960s airline poster but for food tourism."
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
    """Generate all 5 stops and save to Firestore. Runs in background."""
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)
        stops = []

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

        # Generate travel poster (like Sonic Sommelier's share image)
        logger.info(f"Journey {journey_id}: generating travel poster...")
        poster_url = _generate_travel_poster(client, prompt)
        if poster_url:
            update_journey_poster(journey_id, poster_url)
            logger.info(f"Journey {journey_id}: poster saved")

        # Mark as ready
        update_journey_status(journey_id, "ready")
        logger.info(f"Journey {journey_id}: COMPLETE — {len(stops)} stops")

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
