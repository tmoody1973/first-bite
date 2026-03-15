import asyncio
import json
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
from google import genai
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

from config import GOOGLE_API_KEY
from agents.orchestrator import orchestrator
from services.parser import parse_interleaved_response
from services.storage import upload_image_from_base64
from services.firestore import create_journey, update_journey_stops, get_journey

router = APIRouter()

LOADING_QUIPS = [
    "Finding the places the guidebooks forgot...",
    "Talking to the woman at the third stall on the left...",
    "Following the smoke to something worth eating...",
    "Ignoring the tourist traps...",
    "Waiting for the rice to finish — you can't rush this...",
]


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
        # Send loading quips while we wait
        for quip in LOADING_QUIPS[:2]:
            yield {"event": "status", "data": json.dumps({"message": quip})}
            await asyncio.sleep(1)

        try:
            # Run the ADK pipeline
            client = genai.Client(api_key=GOOGLE_API_KEY)
            session_service = InMemorySessionService()
            runner = Runner(
                agent=orchestrator,
                app_name="first_bite",
                session_service=session_service,
            )

            session = await session_service.create_session(
                app_name="first_bite",
                user_id="anonymous",
            )

            # Send more quips
            yield {
                "event": "status",
                "data": json.dumps({"message": LOADING_QUIPS[2]}),
            }

            # Execute the agent
            response_parts = []
            async for event in runner.run_async(
                user_id="anonymous",
                session_id=session.id,
                new_message=genai.types.Content(
                    role="user",
                    parts=[genai.types.Part(text=prompt)],
                ),
            ):
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if hasattr(part, "text") and part.text:
                            response_parts.append({"text": part.text})
                        elif hasattr(part, "inline_data") and part.inline_data:
                            response_parts.append({
                                "inline_data": {
                                    "mime_type": part.inline_data.mime_type,
                                    "data": part.inline_data.data,
                                }
                            })

            # Parse the interleaved response
            parsed_stops = parse_interleaved_response(response_parts)

            if not parsed_stops:
                yield {
                    "event": "journey-error",
                    "data": json.dumps({
                        "message": "The kitchen's closed. Try another destination.",
                        "retryable": True,
                    }),
                }
                return

            # Stream each stop to the frontend
            stops_data = []
            for stop in parsed_stops:
                yield {
                    "event": "stop-start",
                    "data": json.dumps({
                        "stopNumber": stop.stop_number,
                        "title": stop.title,
                    }),
                }
                await asyncio.sleep(0.3)

                # Stream narrative text
                yield {
                    "event": "text",
                    "data": json.dumps({"content": stop.narrative}),
                }
                await asyncio.sleep(0.2)

                # Upload and stream scene image
                scene_url = ""
                if stop.scene_image_data:
                    scene_url = upload_image_from_base64(
                        stop.scene_image_data, prefix="scenes"
                    )
                    yield {
                        "event": "image",
                        "data": json.dumps({"type": "scene", "url": scene_url}),
                    }
                    await asyncio.sleep(0.2)

                # Upload and stream dish image
                dish_url = ""
                if stop.dish_image_data:
                    dish_url = upload_image_from_base64(
                        stop.dish_image_data, prefix="dishes"
                    )
                    yield {
                        "event": "image",
                        "data": json.dumps({"type": "dish", "url": dish_url}),
                    }
                    await asyncio.sleep(0.2)

                # Stream recipe
                if stop.recipe:
                    yield {
                        "event": "recipe",
                        "data": json.dumps(stop.recipe.model_dump()),
                    }
                    await asyncio.sleep(0.1)

                # Stream place
                if stop.place:
                    yield {
                        "event": "place",
                        "data": json.dumps(stop.place.model_dump()),
                    }
                    await asyncio.sleep(0.1)

                yield {
                    "event": "stop-end",
                    "data": json.dumps({"stopNumber": stop.stop_number}),
                }

                # Build stop data for Firestore
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

            # Save to Firestore
            update_journey_stops(journey_id, stops_data)

            yield {
                "event": "journey-complete",
                "data": json.dumps({"journeyId": journey_id}),
            }

        except Exception as e:
            yield {
                "event": "journey-error",
                "data": json.dumps({
                    "message": "The kitchen's closed. Try another destination.",
                    "retryable": True,
                }),
            }

    return EventSourceResponse(event_generator())


@router.get("/api/journey/{journey_id}")
async def get_journey_by_id(journey_id: str):
    journey = get_journey(journey_id)
    if not journey:
        return JSONResponse(
            status_code=404, content={"error": "Journey not found"}
        )
    return journey
