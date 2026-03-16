"""ElevenLabs sound effects — ambient environment audio per stop.
Plays under narration at lower volume."""

import logging
import requests
from config import ELEVENLABS_API_KEY
from services.storage import upload_audio

logger = logging.getLogger(__name__)

ELEVENLABS_SFX_URL = "https://api.elevenlabs.io/v1/sound-generation"

# Map stop themes to ambient sound descriptions
AMBIENT_PROMPTS = {
    1: "busy outdoor street market in {location}, vendors calling out, sizzling food, crowd chatter, distant traffic",
    2: "narrow street with a food cart, oil sizzling in a wok, quiet conversation, footsteps on pavement",
    3: "kitchen sounds, knife chopping on cutting board, pot bubbling, flame from gas stove, clanking pans",
    4: "communal dining, clinking glasses, laughter, multiple conversations, plates being set down",
    5: "quiet evening street, distant music, gentle breeze, a single set of footsteps walking away",
}


def generate_ambient_sound(location: str, stop_num: int) -> str:
    """Generate an ambient sound effect for a stop using ElevenLabs.
    Returns Cloud Storage URL of the audio, or empty string on failure."""
    if not ELEVENLABS_API_KEY:
        return ""

    prompt_template = AMBIENT_PROMPTS.get(stop_num, AMBIENT_PROMPTS[1])
    prompt = prompt_template.format(location=location)

    try:
        response = requests.post(
            ELEVENLABS_SFX_URL,
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "text": prompt,
                "duration_seconds": 15,
            },
            timeout=30,
        )

        if response.status_code != 200:
            logger.warning(f"ElevenLabs SFX failed ({response.status_code}): {response.text[:200]}")
            return ""

        audio_bytes = response.content
        if audio_bytes:
            url = upload_audio(audio_bytes, prefix="ambient")
            logger.info(f"Ambient sound generated for stop {stop_num}")
            return url

        return ""

    except Exception as e:
        logger.warning(f"Ambient sound failed for stop {stop_num}: {e}")
        return ""
