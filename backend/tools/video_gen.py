"""Veo video generation — short ambient clips per stop."""

import logging
import time
from google import genai
from config import GOOGLE_API_KEY
from services.storage import upload_video

logger = logging.getLogger(__name__)

VEO_MODEL = "veo-3.1-generate-preview"


def generate_stop_video(location: str, stop_title: str, theme: str) -> str:
    """Generate a short ambient video clip for a stop using Veo.
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

        operation = client.models.generate_videos(
            model=VEO_MODEL,
            prompt=prompt,
            config={
                "number_of_videos": 1,
                "duration_seconds": 4,
                "aspect_ratio": "16:9",
                "person_generation": "dont_allow",
            },
        )

        # Poll for completion (Veo is async, takes 1-3 min)
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
            logger.warning(f"Veo timed out for '{stop_title}' after {max_wait}s")
            return ""

        # Download the generated video
        if operation.result and operation.result.generated_videos:
            video = operation.result.generated_videos[0]
            if hasattr(video, "video") and video.video:
                # Download video bytes
                try:
                    video_data = client.files.download(file=video.video)
                    if video_data:
                        url = upload_video(video_data, prefix="videos")
                        logger.info(f"Veo video generated for '{stop_title}'")
                        return url
                except Exception as dl_err:
                    logger.warning(f"Veo download failed: {dl_err}")
                    # Try URI if available
                    if hasattr(video.video, "uri") and video.video.uri:
                        return video.video.uri

        logger.warning(f"Veo returned no video for '{stop_title}'")
        return ""

    except Exception as e:
        logger.warning(f"Veo generation failed for '{stop_title}': {e}")
        return ""
