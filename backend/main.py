import time
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import FRONTEND_URL

app = FastAPI(title="First Bite API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory rate limiter (resets on instance recycle — fine for hackathon)
_rate_limits: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 5
RATE_WINDOW = 3600  # 1 hour


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.method == "POST" and "/api/journey" in str(request.url):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        _rate_limits[client_ip] = [
            t for t in _rate_limits[client_ip] if now - t < RATE_WINDOW
        ]
        if len(_rate_limits[client_ip]) >= RATE_LIMIT:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Easy — even Bourdain took breaks between meals."
                },
            )
        _rate_limits[client_ip].append(now)
    return await call_next(request)


# Mount routes
from routes.journey import router as journey_router
from routes.tts import router as tts_router

app.include_router(journey_router)
app.include_router(tts_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
