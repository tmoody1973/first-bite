import os
import base64
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
            audio_data = part.inline_data.data
            mime_type = part.inline_data.mime_type or "audio/wav"

            # Data may be bytes or base64 string
            if isinstance(audio_data, str):
                audio_bytes = base64.b64decode(audio_data)
            else:
                audio_bytes = audio_data

            # Try to return as-is if it's already a usable format
            # Otherwise transcode with ffmpeg
            mp3_bytes = _transcode_to_mp3(audio_bytes, mime_type)
            url = upload_audio(mp3_bytes, prefix="tts")
            return url

    return ""


def _transcode_to_mp3(audio_bytes: bytes, mime_type: str) -> bytes:
    """Transcode audio bytes to MP3 using ffmpeg."""
    # Determine input format from mime type
    if "pcm" in mime_type or "raw" in mime_type or "L16" in mime_type:
        # Raw PCM: need to specify format, sample rate, channels
        input_args = ["-f", "s16le", "-ar", "24000", "-ac", "1"]
        suffix = ".pcm"
    elif "wav" in mime_type:
        input_args = []
        suffix = ".wav"
    else:
        # Try auto-detect
        input_args = []
        suffix = ".wav"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as in_file:
        in_file.write(audio_bytes)
        in_path = in_file.name

    mp3_path = in_path + ".mp3"

    try:
        cmd = ["ffmpeg", "-y"] + input_args + [
            "-i", in_path,
            "-codec:a", "libmp3lame",
            "-qscale:a", "2",
            mp3_path,
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=30)

        if result.returncode != 0:
            # If ffmpeg fails, try raw PCM with different params
            cmd2 = [
                "ffmpeg", "-y",
                "-f", "s16le", "-ar", "24000", "-ac", "1",
                "-i", in_path,
                "-codec:a", "libmp3lame",
                "-qscale:a", "2",
                mp3_path,
            ]
            subprocess.run(cmd2, capture_output=True, check=True, timeout=30)

        with open(mp3_path, "rb") as f:
            return f.read()
    finally:
        os.unlink(in_path)
        if os.path.exists(mp3_path):
            os.unlink(mp3_path)
