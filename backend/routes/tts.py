from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from tools.tts import generate_tts

router = APIRouter()


class TTSRequest(BaseModel):
    journey_id: str
    stop_number: int
    text: str


@router.post("/api/tts")
async def create_tts(request: TTSRequest):
    url = generate_tts(request.text, voice="Charon")
    if not url:
        return JSONResponse(
            status_code=500, content={"error": "TTS generation failed"}
        )
    return {"audio_url": url}
