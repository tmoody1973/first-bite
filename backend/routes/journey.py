import asyncio
import json
import base64
import logging
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
from google import genai

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

from config import GOOGLE_API_KEY, STORYTELLER_MODEL
from services.parser import parse_interleaved_response
from services.storage import upload_image_from_base64
from services.firestore import create_journey, update_journey_stops, get_journey

router = APIRouter()

LOADING_QUIPS = [
    "Finding the places the guidebooks forgot...",
    "Walking the streets, following the smoke...",
    "Sketching the scene...",
    "Plating the dish...",
    "Writing the recipe...",
]

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

    # Parse — wrap in [STOP N:] if not already there
    full_text = ""
    for p in response_parts:
        if "text" in p:
            full_text += p["text"]

    # If Gemini didn't use [STOP] markers, inject one
    if not any(f"[STOP {stop_num}" in (p.get("text", "") or "") for p in response_parts):
        response_parts.insert(0, {"text": f"[STOP {stop_num}: {theme_name}]\n"})

    parsed = parse_interleaved_response(response_parts)

    if parsed:
        stop = parsed[0]
        stop.stop_number = stop_num  # Ensure correct number
        return {
            "stop": stop,
            "parts": response_parts,
        }

    # Fallback: create stop from raw text
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

    from services.parser import ParsedStop
    fallback_stop = ParsedStop(
        stop_number=stop_num,
        title=theme_name,
        narrative=full_text[:2000],
        scene_image_data=scene_data,
        dish_image_data=dish_data,
    )
    return {"stop": fallback_stop, "parts": response_parts}


@router.post("/api/journey")
async def create_journey_stream(request: Request):
    body = await request.json()
    prompt = body.get("prompt", "")
    if not prompt:
        return JSONResponse(
            status_code=400, content={"error": "Prompt is required"}
        )

    journey_id = create_journey(prompt)

    async def event_generator():
        try:
            client = genai.Client(api_key=GOOGLE_API_KEY)
            stops_data = []

            # Generate 5 stops, one at a time, streaming each to frontend
            for stop_num in range(1, 6):
                quip_idx = min(stop_num - 1, len(LOADING_QUIPS) - 1)
                yield {
                    "event": "status",
                    "data": json.dumps({"message": LOADING_QUIPS[quip_idx]}),
                }

                # Generate this stop (sync call in executor)
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None, _generate_stop_blocking, client, prompt, stop_num
                )

                stop = result["stop"]

                # Stream stop to frontend
                yield {
                    "event": "stop-start",
                    "data": json.dumps({
                        "stopNumber": stop.stop_number,
                        "title": stop.title,
                    }),
                }

                # Narrative
                yield {
                    "event": "text",
                    "data": json.dumps({"content": stop.narrative}),
                }

                # Scene image
                scene_url = ""
                if stop.scene_image_data:
                    scene_url = upload_image_from_base64(
                        stop.scene_image_data, prefix="scenes"
                    )
                    yield {
                        "event": "image",
                        "data": json.dumps({"type": "scene", "url": scene_url}),
                    }

                # Dish image
                dish_url = ""
                if stop.dish_image_data:
                    dish_url = upload_image_from_base64(
                        stop.dish_image_data, prefix="dishes"
                    )
                    yield {
                        "event": "image",
                        "data": json.dumps({"type": "dish", "url": dish_url}),
                    }

                # Recipe
                if stop.recipe:
                    yield {
                        "event": "recipe",
                        "data": json.dumps(stop.recipe.model_dump()),
                    }

                # Place
                if stop.place:
                    yield {
                        "event": "place",
                        "data": json.dumps(stop.place.model_dump()),
                    }

                yield {
                    "event": "stop-end",
                    "data": json.dumps({"stopNumber": stop.stop_number}),
                }

                stop_dict = {
                    "stop_number": stop.stop_number,
                    "title": stop.title,
                    "narrative": stop.narrative,
                    "scene_image_url": scene_url,
                    "dish_image_url": dish_url,
                    "recipe": stop.recipe.model_dump() if stop.recipe else None,
                    "place": stop.place.model_dump() if stop.place else None,
                    "tts_audio_url": None,
                }
                stops_data.append(stop_dict)

                logger.info(f"Streamed stop {stop.stop_number}: '{stop.title}' scene={bool(scene_url)} dish={bool(dish_url)} recipe={bool(stop.recipe)}")

            # Save all stops to Firestore
            update_journey_stops(journey_id, stops_data)

            yield {
                "event": "journey-complete",
                "data": json.dumps({"journeyId": journey_id}),
            }

        except Exception as e:
            logger.exception(f"Journey generation failed: {e}")
            yield {
                "event": "journey-error",
                "data": json.dumps({
                    "message": f"The kitchen's closed. ({type(e).__name__})",
                    "retryable": True,
                }),
            }

    return EventSourceResponse(event_generator())


def _generate_stop_blocking(client, location: str, stop_num: int) -> dict:
    """Blocking wrapper — runs in thread executor."""
    return generate_single_stop(client, location, stop_num)


@router.get("/api/journey/{journey_id}")
async def get_journey_by_id(journey_id: str):
    journey = get_journey(journey_id)
    if not journey:
        return JSONResponse(
            status_code=404, content={"error": "Journey not found"}
        )
    return journey
