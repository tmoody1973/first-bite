import os
import subprocess
import tempfile
from google import genai
from config import GOOGLE_API_KEY, NARRATOR_MODEL
from services.storage import upload_audio


def generate_tts(text: str, voice: str = "Charon") -> str:
    """Generate TTS narration audio, transcode to MP3, upload to GCS.
    Returns Cloud Storage URL of the MP3 file."""
    client = genai.Client(api_key=GOOGLE_API_KEY)

    response = client.models.generate_content(
        model=NARRATOR_MODEL,
        contents=text,
        config={
            "response_modalities": ["AUDIO"],
            "speech_config": {
                "voice_config": {
                    "prebuilt_voice_config": {"voice_name": voice}
                }
            },
        },
    )

    for part in response.candidates[0].content.parts:
        if hasattr(part, "inline_data") and part.inline_data:
            wav_bytes = part.inline_data.data
            mp3_bytes = _transcode_to_mp3(wav_bytes)
            url = upload_audio(mp3_bytes, prefix="tts")
            return url

    return ""


def _transcode_to_mp3(wav_bytes: bytes) -> bytes:
    """Transcode WAV/PCM bytes to MP3 using ffmpeg."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as wav_file:
        wav_file.write(wav_bytes)
        wav_path = wav_file.name

    mp3_path = wav_path.replace(".wav", ".mp3")

    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", wav_path, "-codec:a", "libmp3lame",
             "-qscale:a", "2", mp3_path],
            capture_output=True,
            check=True,
        )

        with open(mp3_path, "rb") as f:
            return f.read()
    finally:
        os.unlink(wav_path)
        if os.path.exists(mp3_path):
            os.unlink(mp3_path)
