"""Veo video generation — one cinematic summary video per journey."""

import logging
import time
from google import genai
from config import GOOGLE_API_KEY
from services.storage import upload_video

logger = logging.getLogger(__name__)

VEO_MODEL = "veo-3.1-generate-preview"


def generate_journey_video(location: str, stops: list[dict]) -> str:
    """Generate one cinematic summary video for the entire journey.
    A travel reel capturing all 5 stops in one fluid sequence.
    Returns Cloud Storage URL or empty string."""
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)

        # Build a prompt from all stops
        stop_scenes = []
        for s in stops:
            title = s.get("title", "")
            dish = s.get("recipe", {}).get("dish_name", "") if s.get("recipe") else ""
            place = s.get("place", {}).get("name", "") if s.get("place") else ""
            if title:
                scene = f"{title}"
                if dish:
                    scene += f" — {dish}"
                if place:
                    scene += f" at {place}"
                stop_scenes.append(scene)

        scenes_text = ". Then ".join(stop_scenes)

        prompt = (
            f"A cinematic 8-second travel reel of a food journey through {location}. "
            f"The sequence moves through: {scenes_text}. "
            f"Documentary style like Anthony Bourdain's Parts Unknown — "
            f"handheld camera, natural lighting, warm saturated colors, "
            f"street-level perspectives of markets, kitchens, and street food stalls. "
            f"Atmospheric and immersive. No text overlays."
        )

        logger.info(f"Starting Veo journey video for '{location}'...")

        operation = client.models.generate_videos(
            model=VEO_MODEL,
            prompt=prompt,
            config={
                "number_of_videos": 1,
                "duration_seconds": 8,
                "aspect_ratio": "16:9",
            },
        )

        # Poll for completion
        max_wait = 180
        waited = 0
        while not operation.done and waited < max_wait:
            time.sleep(10)
            waited += 10
            try:
                operation = client.operations.get(operation)
            except Exception:
                pass

        if not operation.done:
            logger.warning(f"Veo timed out for journey video after {max_wait}s")
            return ""

        if operation.result and operation.result.generated_videos:
            video = operation.result.generated_videos[0]
            if hasattr(video, "video") and video.video:
                try:
                    video_data = client.files.download(file=video.video)
                    if video_data:
                        url = upload_video(video_data, prefix="journey-videos")
                        logger.info(f"Veo journey video ready ({waited}s)")
                        return url
                except Exception as dl_err:
                    logger.warning(f"Veo download failed: {dl_err}")
                    if hasattr(video.video, "uri") and video.video.uri:
                        return video.video.uri

        return ""

    except Exception as e:
        logger.warning(f"Veo journey video failed: {e}")
        return ""
