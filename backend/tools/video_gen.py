"""Veo video generation — short ambient clips per stop."""

import base64
import logging
import time
from google import genai
from config import GOOGLE_API_KEY
from services.storage import upload_video

logger = logging.getLogger(__name__)

VEO_MODEL = "veo-3.1-generate-preview"


def generate_stop_video(location: str, stop_title: str, theme: str) -> str:
    """Generate a short ambient video clip for a stop using Veo 3.1.
    Returns Cloud Storage URL of the video, or empty string on failure."""
    try:
        client = genai.Client(api_key=GOOGLE_API_KEY)

        prompt = (
            f"A cinematic 4-second ambient video clip of {location}, "
            f"showing {theme}. "
            f"Handheld documentary style, natural lighting, "
            f"street-level perspective. Think Anthony Bourdain's Parts Unknown "
            f"B-roll footage. No text overlays, no people speaking to camera."
        )

        # Veo uses generate_videos API
        operation = client.models.generate_videos(
            model=VEO_MODEL,
            prompt=prompt,
            config={
                "number_of_videos": 1,
                "duration_seconds": 4,
                "aspect_ratio": "16:9",
            },
        )

        # Poll for completion (Veo is async)
        max_wait = 120  # 2 minutes max
        waited = 0
        while not operation.done and waited < max_wait:
            time.sleep(5)
            waited += 5
            operation = client.operations.get(operation)

        if not operation.done:
            logger.warning(f"Veo timed out for '{stop_title}'")
            return ""

        # Get the generated video
        if operation.response and operation.response.generated_videos:
            video = operation.response.generated_videos[0]
            if hasattr(video, "video") and video.video:
                video_data = video.video
                if isinstance(video_data, bytes):
                    url = upload_video(video_data, prefix="videos")
                    logger.info(f"Veo video generated for '{stop_title}'")
                    return url
                elif hasattr(video_data, "uri"):
                    return video_data.uri

        logger.warning(f"Veo returned no video for '{stop_title}'")
        return ""

    except Exception as e:
        logger.warning(f"Veo generation failed for '{stop_title}': {e}")
        return ""
