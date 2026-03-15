# First Bite Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Bourdain-inspired cultural food journey generator using Gemini's interleaved output, Google ADK agents, and Gemini TTS — deployed on Google Cloud for the Gemini Live Agent Challenge.

**Architecture:** Python/FastAPI backend on Cloud Run with 4 Google ADK agents (orchestrator, storyteller, chef, narrator). Next.js 15 frontend on Vercel consumes SSE streams. Firestore for persistence, Cloud Storage for images/audio.

**Tech Stack:** Python 3.12, FastAPI, Google ADK, Gemini 3.1 Flash Image (Nano Banana 2), Gemini 2.5 Flash TTS, Firestore, Cloud Storage, Next.js 15, Tailwind CSS, Framer Motion

**Spec:** `docs/superpowers/specs/2026-03-15-first-bite-design.md`

**Deadline:** March 16, 2026 @ 5:00 PM PDT (~24 hours)

---

## File Structure

### Backend (`backend/`)

```
backend/
├── Dockerfile
├── requirements.txt
├── main.py                      # FastAPI app, CORS, rate limiter, route mounting
├── config.py                    # Environment variables, GCP project config
├── agents/
│   ├── __init__.py
│   ├── storyteller.py           # Storyteller agent (interleaved text+image)
│   ├── chef.py                  # Chef agent (recipes + dish images)
│   ├── narrator.py              # Narrator agent (TTS)
│   └── orchestrator.py          # Root orchestrator, sub_agents wiring
├── tools/
│   ├── __init__.py
│   ├── image_gen.py             # Nano Banana 2 dish image generation
│   └── tts.py                   # Gemini TTS + WAV→MP3 transcoding
├── services/
│   ├── __init__.py
│   ├── storage.py               # Cloud Storage upload/URL helpers
│   ├── firestore.py             # Firestore CRUD for journeys
│   └── parser.py                # Parse interleaved Gemini response → Stop[]
├── models.py                    # Pydantic models (Journey, Stop, Recipe, Place)
├── routes/
│   ├── __init__.py
│   ├── journey.py               # POST /api/journey (SSE), GET /api/journey/:id
│   └── tts.py                   # POST /api/tts
└── tests/
    ├── __init__.py
    ├── test_parser.py            # Parser unit tests
    ├── test_models.py            # Model validation tests
    └── test_routes.py            # Route integration tests
```

### Frontend (`frontend/`)

```
frontend/
├── package.json
├── tailwind.config.ts
├── next.config.ts
├── app/
│   ├── layout.tsx               # Root layout, fonts, metadata
│   ├── page.tsx                 # Landing page
│   ├── journey/
│   │   └── [id]/
│   │       └── page.tsx         # Journey viewer page
│   └── globals.css              # Tailwind imports, custom styles
├── components/
│   ├── landing/
│   │   ├── Hero.tsx             # Logo, tagline, prompt input
│   │   └── SuggestionPills.tsx  # Prompt suggestion chips
│   ├── journey/
│   │   ├── StoryFlow.tsx        # Main journey renderer
│   │   ├── StopCard.tsx         # Individual stop (text, images, recipe, place)
│   │   ├── RecipeCard.tsx       # Recipe card with download button
│   │   ├── PlaceCard.tsx        # Place name, address, map button
│   │   ├── MapModal.tsx         # Google Maps / Street View modal
│   │   ├── AudioPlayer.tsx      # TTS play button per stop
│   │   └── ProgressDots.tsx     # "Stop 2 of 5" indicator
│   └── ui/
│       └── LoadingQuips.tsx     # Bourdain-style loading messages
├── hooks/
│   └── useJourneyStream.ts      # SSE client hook
├── lib/
│   ├── api.ts                   # Backend API client
│   └── constants.ts             # API URL, colors, suggestion prompts
└── public/
    └── grain.png                # Subtle noise texture overlay
```

---

## Chunk 0: Environment Setup

### Task 0: Prerequisites & Project Setup

- [ ] **Step 1: Create root `.gitignore`**

Create: `/Users/tarikmoody/Documents/Projects/first-bite/.gitignore`

```
.env
.env.local
.venv/
__pycache__/
*.pyc
node_modules/
.next/
.vercel/
```

- [ ] **Step 2: GCP project setup**

```bash
# Create or select GCP project
gcloud projects create first-bite-app --name="First Bite" 2>/dev/null || true
gcloud config set project first-bite-app

# Enable required APIs
gcloud services enable \
  firestore.googleapis.com \
  storage.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  generativelanguage.googleapis.com

# Create Firestore database (Native mode)
gcloud firestore databases create --location=us-central1 2>/dev/null || true

# Set up Application Default Credentials for local dev
gcloud auth application-default login
```

- [ ] **Step 3: Create Python virtual environment**

```bash
cd /Users/tarikmoody/Documents/Projects/first-bite
mkdir backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

- [ ] **Step 4: Create `pyproject.toml` for pytest config**

Create: `backend/pyproject.toml`

```toml
[tool.pytest.ini_options]
pythonpath = ["."]
```

- [ ] **Step 5: Init git repo and commit**

```bash
cd /Users/tarikmoody/Documents/Projects/first-bite
git init
git add .gitignore
git commit -m "chore: init project with gitignore"
```

---

## Chunk 1: Backend Foundation

### Task 1: Scaffold Python Backend

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/config.py`
- Create: `backend/main.py`
- Create: `backend/models.py`

- [ ] **Step 1: Create `requirements.txt`**

```
fastapi==0.115.0
uvicorn[standard]==0.32.0
google-adk==1.5.0
google-genai==1.14.0
google-cloud-firestore==2.19.0
google-cloud-storage==2.18.0
pydub==0.25.1
pydantic==2.9.0
sse-starlette==2.1.0
python-dotenv==1.0.1
pytest==8.3.0
httpx==0.28.0
```

- [ ] **Step 2: Create `config.py`**

```python
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "")
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "first-bite-media")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Gemini model IDs
STORYTELLER_MODEL = "gemini-3.1-flash-image-preview"
CHEF_MODEL = "gemini-3.1-flash-image-preview"
NARRATOR_MODEL = "gemini-2.5-flash-preview-tts"
ORCHESTRATOR_MODEL = "gemini-3.1-pro-preview"
```

- [ ] **Step 3: Create Pydantic models in `models.py`**

```python
from pydantic import BaseModel, Field
from datetime import datetime


class Place(BaseModel):
    name: str
    address: str
    footnote: str


class Ingredient(BaseModel):
    name: str
    amount: str


class Recipe(BaseModel):
    dish_name: str
    cuisine_type: str
    prep_time: int
    servings: int
    ingredients: list[Ingredient]
    instructions: list[str]


class Stop(BaseModel):
    stop_number: int
    title: str
    narrative: str
    scene_image_url: str = ""
    dish_image_url: str = ""
    recipe: Recipe | None = None
    place: Place | None = None
    tts_audio_url: str | None = None


class Journey(BaseModel):
    id: str = ""
    prompt: str
    mode: str = "journey"
    status: str = "streaming"
    created_at: datetime = Field(default_factory=datetime.now)
    stops: list[Stop] = Field(default_factory=list)
```

- [ ] **Step 4: Create `main.py` with FastAPI app, CORS, rate limiter**

```python
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
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# In-memory rate limiter
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


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Verify backend starts**

Run: `cd backend && pip install -r requirements.txt && uvicorn main:app --port 8000`
Expected: Server starts, `GET /health` returns `{"status": "ok"}`

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: scaffold FastAPI backend with models, config, rate limiter"
```

---

### Task 2: Gemini Response Parser

**Files:**
- Create: `backend/services/parser.py`
- Create: `backend/tests/test_parser.py`

- [ ] **Step 1: Write parser tests in `test_parser.py`**

```python
import pytest
from services.parser import parse_interleaved_response, ParsedStop


def test_parse_single_stop_text_only():
    """Parser extracts stop title and narrative from text parts."""
    parts = [
        {"text": "[STOP 1: Mercado de Abastos]\nThe smoke hits you before the market does.\n\n[RECIPE]\ndishName: Mole Negro\ncuisineType: Oaxacan\nprepTime: 45\nservings: 4\ningredients:\n- 2 dried guajillo chiles | guajillo chiles\n- 1 tbsp lard | lard\ninstructions:\n1. Toast the chiles in a dry skillet.\n2. Blend with stock.\n[PLACE]\nname: Comedor La Abuelita\naddress: Mercado de Abastos, Oaxaca, Mexico\nfootnote: Three generations of mole.\n[END STOP]"}
    ]
    stops = parse_interleaved_response(parts)
    assert len(stops) == 1
    assert stops[0].title == "Mercado de Abastos"
    assert "smoke" in stops[0].narrative
    assert stops[0].recipe is not None
    assert stops[0].recipe.dish_name == "Mole Negro"
    assert len(stops[0].recipe.ingredients) == 2
    assert stops[0].place.name == "Comedor La Abuelita"


def test_parse_stop_with_images():
    """Parser assigns images in order: first=scene, second=dish."""
    parts = [
        {"text": "[STOP 1: Night Market]\nLanterns sway above..."},
        {"inline_data": {"mime_type": "image/png", "data": "scene_base64"}},
        {"text": "The pad thai arrives sizzling..."},
        {"inline_data": {"mime_type": "image/png", "data": "dish_base64"}},
        {"text": "[RECIPE]\ndishName: Pad Thai\ncuisineType: Thai\nprepTime: 20\nservings: 2\ningredients:\n- 200g rice noodles | rice noodles\ninstructions:\n1. Soak noodles.\n[PLACE]\nname: Jay Fai\naddress: 327 Maha Chai Rd, Bangkok\nfootnote: Michelin-starred street food.\n[END STOP]"},
    ]
    stops = parse_interleaved_response(parts)
    assert len(stops) == 1
    assert stops[0].scene_image_data == "scene_base64"
    assert stops[0].dish_image_data == "dish_base64"


def test_parse_multiple_stops():
    """Parser handles multiple stops in sequence."""
    parts = [
        {"text": "[STOP 1: Place A]\nNarrative A.\n[RECIPE]\ndishName: Dish A\ncuisineType: Mexican\nprepTime: 10\nservings: 2\ningredients:\n- 1 item | item\ninstructions:\n1. Cook it.\n[PLACE]\nname: Spot A\naddress: Addr A\nfootnote: Note A\n[END STOP]"},
        {"text": "[STOP 2: Place B]\nNarrative B.\n[RECIPE]\ndishName: Dish B\ncuisineType: Thai\nprepTime: 15\nservings: 4\ningredients:\n- 2 items | items\ninstructions:\n1. Prep it.\n[PLACE]\nname: Spot B\naddress: Addr B\nfootnote: Note B\n[END STOP]"},
    ]
    stops = parse_interleaved_response(parts)
    assert len(stops) == 2
    assert stops[0].stop_number == 1
    assert stops[1].stop_number == 2


def test_parse_empty_response():
    """Parser returns empty list for empty response."""
    stops = parse_interleaved_response([])
    assert stops == []


def test_parse_malformed_response():
    """Parser handles response without proper delimiters gracefully."""
    parts = [{"text": "Just some random text without any stops."}]
    stops = parse_interleaved_response(parts)
    assert stops == []
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_parser.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'services.parser'`

- [ ] **Step 3: Implement `parser.py`**

```python
import re
from dataclasses import dataclass, field
from models import Recipe, Place, Ingredient


@dataclass
class ParsedStop:
    stop_number: int = 0
    title: str = ""
    narrative: str = ""
    scene_image_data: str = ""
    dish_image_data: str = ""
    recipe: Recipe | None = None
    place: Place | None = None


def _parse_recipe(text: str) -> Recipe | None:
    """Extract recipe from delimited text block."""
    try:
        lines = text.strip().split("\n")
        dish_name = ""
        cuisine_type = ""
        prep_time = 0
        servings = 0
        ingredients: list[Ingredient] = []
        instructions: list[str] = []
        section = "fields"

        for line in lines:
            line = line.strip()
            if line.startswith("dishName:"):
                dish_name = line.split(":", 1)[1].strip()
            elif line.startswith("cuisineType:"):
                cuisine_type = line.split(":", 1)[1].strip()
            elif line.startswith("prepTime:"):
                prep_time = int(line.split(":", 1)[1].strip())
            elif line.startswith("servings:"):
                servings = int(line.split(":", 1)[1].strip())
            elif line.startswith("ingredients:"):
                section = "ingredients"
            elif line.startswith("instructions:"):
                section = "instructions"
            elif section == "ingredients" and line.startswith("- "):
                parts = line[2:].split("|")
                amount = parts[0].strip()
                name = parts[1].strip() if len(parts) > 1 else amount
                ingredients.append(Ingredient(name=name, amount=amount))
            elif section == "instructions" and re.match(r"^\d+\.", line):
                instructions.append(re.sub(r"^\d+\.\s*", "", line))

        if not dish_name:
            return None

        return Recipe(
            dish_name=dish_name,
            cuisine_type=cuisine_type,
            prep_time=prep_time,
            servings=servings,
            ingredients=ingredients,
            instructions=instructions,
        )
    except Exception:
        return None


def _parse_place(text: str) -> Place | None:
    """Extract place from delimited text block."""
    try:
        name = ""
        address = ""
        footnote = ""
        for line in text.strip().split("\n"):
            line = line.strip()
            if line.startswith("name:"):
                name = line.split(":", 1)[1].strip()
            elif line.startswith("address:"):
                address = line.split(":", 1)[1].strip()
            elif line.startswith("footnote:"):
                footnote = line.split(":", 1)[1].strip()
        if not name:
            return None
        return Place(name=name, address=address, footnote=footnote)
    except Exception:
        return None


def parse_interleaved_response(parts: list[dict]) -> list[ParsedStop]:
    """Parse Gemini interleaved response parts into structured stops."""
    stops: list[ParsedStop] = []
    current_stop: ParsedStop | None = None
    image_count = 0

    # Concatenate all text and re-split by stop delimiters
    full_text_parts: list[dict] = []
    for part in parts:
        if "text" in part:
            full_text_parts.append(part)
        elif "inline_data" in part:
            full_text_parts.append(part)

    for part in full_text_parts:
        if "inline_data" in part:
            if current_stop is not None:
                data = part["inline_data"].get("data", "")
                if image_count % 2 == 0:
                    current_stop.scene_image_data = data
                else:
                    current_stop.dish_image_data = data
                image_count += 1
            continue

        text = part.get("text", "")

        # Check for stop starts
        stop_matches = list(re.finditer(r"\[STOP\s+(\d+):\s*(.+?)\]", text))

        if not stop_matches and current_stop is None:
            continue

        # Process text that may contain multiple stops
        segments = re.split(r"\[STOP\s+\d+:\s*.+?\]", text)

        for i, match in enumerate(stop_matches):
            # Save previous stop
            if current_stop is not None:
                stops.append(current_stop)

            current_stop = ParsedStop(
                stop_number=int(match.group(1)),
                title=match.group(2).strip(),
            )
            image_count = 0

            # Get the text after this stop marker
            segment = segments[i + 1] if i + 1 < len(segments) else ""
            _process_stop_text(current_stop, segment)

        # If no new stop markers but we have a current stop, append text
        if not stop_matches and current_stop is not None:
            _process_stop_text(current_stop, text)

    # Don't forget last stop
    if current_stop is not None:
        stops.append(current_stop)

    return stops


def _process_stop_text(stop: ParsedStop, text: str) -> None:
    """Extract narrative, recipe, and place from a stop's text."""
    # Split by sections
    recipe_match = re.search(r"\[RECIPE\](.*?)(?:\[PLACE\]|\[END STOP\]|$)", text, re.DOTALL)
    place_match = re.search(r"\[PLACE\](.*?)(?:\[END STOP\]|$)", text, re.DOTALL)

    # Narrative is everything before [RECIPE]
    narrative_end = text.find("[RECIPE]")
    if narrative_end == -1:
        narrative_end = text.find("[END STOP]")
    if narrative_end == -1:
        narrative_end = len(text)

    narrative = text[:narrative_end].strip()
    if narrative:
        stop.narrative = (stop.narrative + "\n" + narrative).strip() if stop.narrative else narrative

    if recipe_match:
        stop.recipe = _parse_recipe(recipe_match.group(1))

    if place_match:
        stop.place = _parse_place(place_match.group(1))
```

- [ ] **Step 4: Add `__init__.py` files**

Create empty `__init__.py` in: `backend/services/`, `backend/agents/`, `backend/tools/`, `backend/routes/`, `backend/tests/`

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_parser.py -v`
Expected: All 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/services/ backend/tests/
git commit -m "feat: add Gemini interleaved response parser with tests"
```

---

### Task 3: Cloud Storage & Firestore Services

**Files:**
- Create: `backend/services/storage.py`
- Create: `backend/services/firestore.py`

- [ ] **Step 1: Create `storage.py`**

```python
import base64
import uuid
from google.cloud import storage as gcs

from config import GCS_BUCKET_NAME


def _get_bucket():
    client = gcs.Client()
    return client.bucket(GCS_BUCKET_NAME)


def upload_image_from_base64(data: str, prefix: str = "images") -> str:
    """Upload base64-encoded image to GCS, return public URL."""
    bucket = _get_bucket()
    filename = f"{prefix}/{uuid.uuid4()}.png"
    blob = bucket.blob(filename)
    blob.upload_from_string(base64.b64decode(data), content_type="image/png")
    # Public URL via bucket-level IAM (allUsers:objectViewer), not object ACLs
    return f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{filename}"


def upload_audio(audio_bytes: bytes, prefix: str = "audio") -> str:
    """Upload audio bytes to GCS, return public URL."""
    bucket = _get_bucket()
    filename = f"{prefix}/{uuid.uuid4()}.mp3"
    blob = bucket.blob(filename)
    blob.upload_from_string(audio_bytes, content_type="audio/mpeg")
    return f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{filename}"
```

- [ ] **Step 2: Create `firestore.py`**

```python
import uuid
from datetime import datetime
from google.cloud import firestore

from models import Journey, Stop


def _get_db():
    return firestore.Client()


def create_journey(prompt: str, mode: str = "journey") -> str:
    """Create a new journey document, return its ID."""
    db = _get_db()
    journey_id = str(uuid.uuid4())[:8]
    doc_ref = db.collection("journeys").document(journey_id)
    doc_ref.set({
        "prompt": prompt,
        "mode": mode,
        "status": "streaming",
        "created_at": datetime.now(),
        "stops": [],
    })
    return journey_id


def update_journey_stops(journey_id: str, stops: list[dict]) -> None:
    """Update the stops array for a journey."""
    db = _get_db()
    doc_ref = db.collection("journeys").document(journey_id)
    doc_ref.update({"stops": stops, "status": "ready"})


def get_journey(journey_id: str) -> dict | None:
    """Fetch a journey by ID."""
    db = _get_db()
    doc = db.collection("journeys").document(journey_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return data
```

- [ ] **Step 3: Commit**

```bash
git add backend/services/
git commit -m "feat: add Cloud Storage and Firestore service layers"
```

---

### Task 4: ADK Agent Definitions

**Files:**
- Create: `backend/agents/storyteller.py`
- Create: `backend/agents/chef.py`
- Create: `backend/agents/narrator.py`
- Create: `backend/agents/orchestrator.py`
- Create: `backend/tools/image_gen.py`
- Create: `backend/tools/tts.py`

- [ ] **Step 1: Create `tools/image_gen.py`**

```python
from google import genai
from config import GOOGLE_API_KEY, STORYTELLER_MODEL
from services.storage import upload_image_from_base64


def generate_dish_image(dish_name: str, cuisine_type: str) -> str:
    """Generate a styled photo of a plated dish using Nano Banana 2.
    Returns Cloud Storage URL of the generated image."""
    client = genai.Client(api_key=GOOGLE_API_KEY)

    response = client.models.generate_content(
        model=STORYTELLER_MODEL,
        contents=f"Generate a beautifully plated photo of {dish_name}, "
        f"{cuisine_type} cuisine, shot from above on a worn wooden table "
        f"with natural light. Rustic, editorial food photography style.",
        config={"response_modalities": ["IMAGE"]},
    )

    for part in response.candidates[0].content.parts:
        if hasattr(part, "inline_data") and part.inline_data:
            url = upload_image_from_base64(
                part.inline_data.data, prefix="dish-images"
            )
            return url

    return ""
```

- [ ] **Step 2: Create `tools/tts.py`**

```python
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
            # Transcode WAV/PCM to MP3
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
        # Clean up temp files
        os.unlink(wav_path)
        if os.path.exists(mp3_path):
            os.unlink(mp3_path)
```

- [ ] **Step 3: Create `agents/storyteller.py`**

```python
from google.adk.agents import Agent
from config import STORYTELLER_MODEL

STORYTELLER_INSTRUCTION = """You are a cultural food storyteller channeling Anthony Bourdain's voice.
You write raw, honest, sensory-rich prose about food cultures around the world.

VOICE RULES:
- NEVER use food-blog superlatives ("amazing", "delicious", "mouth-watering")
- Respect the people behind the food — who's cooking, why it matters
- Anti-tourist — skip the guidebook spots, find the real stuff
- Sensory-first — smell, heat, texture, sound of the kitchen
- Weave cultural context and history into every stop
- Be opinionated and direct. "Skip the resort buffet. Walk three blocks east."

When given a location or food culture, generate an interleaved narrative with text AND images
woven together — street scenes, market chaos, plated dishes.

Generate exactly 5 stops following this narrative arc:

[STOP 1: Place Title]
2-3 paragraphs about The Arrival — first impression, the chaos, the smell.
Generate an image of the street/market scene here.
1 paragraph introducing the signature dish of this stop.
Generate an image of the plated dish here.
[RECIPE]
dishName: Name of the dish
cuisineType: Type of cuisine
prepTime: Minutes to prepare
servings: Number of servings
ingredients:
- full measurement with prep notes | ingredient name
- (6-12 ingredients, common grocery items)
instructions:
1. Step one with timing and visual cues
2. (4-8 steps total)
[PLACE]
name: Real restaurant or stall name
address: Real address
footnote: One cultural sentence about this place
[END STOP]

(Repeat for all 5 stops)

STOP THEMES:
1. The Arrival — first impression, chaos, the smell
2. The Street — the stall or cart nobody talks about
3. The Kitchen — getting behind the counter, the technique
4. The Table — communal moment, strangers sharing food
5. The Last Bite — reflection, what this place taught you about food

IMPORTANT:
- Include REAL restaurant/stall names and addresses (AI-suggested, users verify)
- Use the exact delimiter format: [STOP N: Title], [RECIPE], [PLACE], [END STOP]
- Generate images inline between text — the response should interleave text and images
- Recipes must be HOME-COOKABLE with common ingredients
- Simple honest dish names, not restaurant pretension"""

storyteller_agent = Agent(
    name="storyteller",
    model=STORYTELLER_MODEL,
    instruction=STORYTELLER_INSTRUCTION,
    generate_content_config={
        "response_modalities": ["TEXT", "IMAGE"],
    },
)
```

- [ ] **Step 4: Create `agents/chef.py`**

```python
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
from config import CHEF_MODEL
from tools.image_gen import generate_dish_image

CHEF_INSTRUCTION = """You are a home-cooking expert. When asked to generate a recipe
and dish image for a specific dish, use your tools to:
1. Call generate_dish_image to create a styled photo of the plated dish
2. Return the recipe details and image URL

Return structured JSON with: dish_name, cuisine_type, prep_time, servings,
ingredients (list of {name, amount}), instructions (list of strings),
and dish_image_url."""

chef_agent = Agent(
    name="chef",
    model=CHEF_MODEL,
    instruction=CHEF_INSTRUCTION,
    tools=[FunctionTool(generate_dish_image)],
)
```

- [ ] **Step 5: Create `agents/narrator.py`**

```python
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
from config import NARRATOR_MODEL
from tools.tts import generate_tts

NARRATOR_INSTRUCTION = """You narrate cultural food journeys with a deep, gravelly,
world-weary voice. Think late-night storytelling over whiskey.

When given narrative text for a stop, use the generate_tts tool to create
audio narration. Read the text exactly as written — don't add commentary
or change wording. Return the audio URL."""

narrator_agent = Agent(
    name="narrator",
    model=NARRATOR_MODEL,
    instruction=NARRATOR_INSTRUCTION,
    tools=[FunctionTool(generate_tts)],
)
```

- [ ] **Step 6: Create `agents/orchestrator.py`**

```python
from google.adk.agents import Agent
from config import ORCHESTRATOR_MODEL
from agents.storyteller import storyteller_agent
from agents.chef import chef_agent
from agents.narrator import narrator_agent

ORCHESTRATOR_INSTRUCTION = """You are the First Bite orchestrator. When a user names a
place or food culture, coordinate the journey creation:

1. Send the user's prompt to the Storyteller to generate a complete interleaved
   journey with text, images, recipes, and places for 5 stops.
2. The Storyteller's response IS the journey — it contains everything needed.
3. Return the Storyteller's complete response to the user.

The Storyteller handles narrative, images, recipes, and places in one interleaved response.
Your job is simply to route the request and return the result."""

orchestrator = Agent(
    name="first_bite_guide",
    model=ORCHESTRATOR_MODEL,
    instruction=ORCHESTRATOR_INSTRUCTION,
    sub_agents=[storyteller_agent, chef_agent, narrator_agent],
)
```

- [ ] **Step 7: Commit**

```bash
git add backend/agents/ backend/tools/
git commit -m "feat: add ADK agent definitions and Gemini tools"
```

---

### Task 5: API Routes (Journey SSE + TTS)

**Files:**
- Create: `backend/routes/journey.py`
- Create: `backend/routes/tts.py`
- Modify: `backend/main.py` — mount routes

- [ ] **Step 1: Create `routes/journey.py`**

```python
import asyncio
import json
import uuid
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
        return {"error": "Prompt is required"}

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
        return JSONResponse(status_code=404, content={"error": "Journey not found"})
    return journey
```

- [ ] **Step 2: Create `routes/tts.py`**

```python
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from tools.tts import generate_tts
from services.firestore import get_journey

router = APIRouter()


class TTSRequest(BaseModel):
    journey_id: str
    stop_number: int
    text: str


@router.post("/api/tts")
async def create_tts(request: TTSRequest):
    url = generate_tts(request.text, voice="Charon")
    if not url:
        return JSONResponse(status_code=500, content={"error": "TTS generation failed"})
    return {"audio_url": url}
```

- [ ] **Step 3: Mount routes in `main.py`**

Add to `main.py` after the rate limiter middleware:

```python
from routes.journey import router as journey_router
from routes.tts import router as tts_router

app.include_router(journey_router)
app.include_router(tts_router)
```

- [ ] **Step 4: Commit**

```bash
git add backend/routes/ backend/main.py
git commit -m "feat: add journey SSE and TTS API routes"
```

---

### Task 6: Dockerfile & Cloud Run Config

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.env.example`

- [ ] **Step 1: Create `Dockerfile`**

```dockerfile
FROM python:3.12-slim

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

- [ ] **Step 2: Create `.env.example`**

```
GOOGLE_API_KEY=your-gemini-api-key
GCP_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=first-bite-media
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 3: Commit**

```bash
git add backend/Dockerfile backend/.env.example
git commit -m "feat: add Dockerfile with ffmpeg for Cloud Run deployment"
```

---

## Chunk 2: Frontend Foundation

### Task 7: Scaffold Next.js Frontend

**Files:**
- Create: `frontend/` (via create-next-app)
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/app/layout.tsx`
- Create: `frontend/lib/constants.ts`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/tarikmoody/Documents/Projects/first-bite
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

- [ ] **Step 2: Install dependencies**

```bash
cd frontend && npm install framer-motion html2canvas
```

- [ ] **Step 3: Create `lib/constants.ts`**

```typescript
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const COLORS = {
  bg: "#0A0A0A",
  text: "#E8E0D0",
  accent: "#C4652A",
  secondary: "#6B7F5E",
  muted: "#E8E0D066",
} as const;

export const SUGGESTIONS = [
  "Night markets of Bangkok",
  "Tacos in Oaxaca",
  "Street food in Lagos",
  "Ramen alleys of Tokyo",
  "Hawker centres of Singapore",
  "Bistros of Lyon",
] as const;
```

- [ ] **Step 4: Update `tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "fb-bg": "#0A0A0A",
        "fb-text": "#E8E0D0",
        "fb-accent": "#C4652A",
        "fb-sage": "#6B7F5E",
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Update `globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@300;400;500;600&display=swap');

body {
  background-color: #0A0A0A;
  color: #E8E0D0;
  font-family: 'Space Grotesk', system-ui, sans-serif;
}

/* Subtle grain overlay */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url('/grain.png');
  opacity: 0.03;
  pointer-events: none;
  z-index: 100;
}
```

- [ ] **Step 6: Update `layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "First Bite — The real story starts where the guidebook ends",
  description:
    "A Bourdain-inspired cultural food journey generator. Name a place, discover the food.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-fb-bg text-fb-text antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold Next.js frontend with First Bite theme"
```

---

### Task 8: SSE Client Hook

**Files:**
- Create: `frontend/hooks/useJourneyStream.ts`
- Create: `frontend/lib/api.ts`

- [ ] **Step 1: Create `lib/api.ts`**

```typescript
import { API_URL } from "./constants";

export async function fetchJourney(journeyId: string) {
  const res = await fetch(`${API_URL}/api/journey/${journeyId}`);
  if (!res.ok) throw new Error("Failed to fetch journey");
  return res.json();
}

export async function generateTTS(
  journeyId: string,
  stopNumber: number,
  text: string
): Promise<string> {
  const res = await fetch(`${API_URL}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      journey_id: journeyId,
      stop_number: stopNumber,
      text,
    }),
  });
  if (!res.ok) throw new Error("TTS generation failed");
  const data = await res.json();
  return data.audio_url;
}
```

- [ ] **Step 2: Create `hooks/useJourneyStream.ts`**

```typescript
"use client";

import { useState, useCallback, useRef } from "react";
import { API_URL } from "@/lib/constants";

export interface StopData {
  stopNumber: number;
  title: string;
  narrative: string;
  sceneImageUrl: string;
  dishImageUrl: string;
  recipe: {
    dish_name: string;
    cuisine_type: string;
    prep_time: number;
    servings: number;
    ingredients: { name: string; amount: string }[];
    instructions: string[];
  } | null;
  place: {
    name: string;
    address: string;
    footnote: string;
  } | null;
  ttsAudioUrl: string | null;
}

type StreamStatus = "idle" | "loading" | "streaming" | "complete" | "error";

export function useJourneyStream() {
  const [stops, setStops] = useState<StopData[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentStopRef = useRef<Partial<StopData>>({});

  const startJourney = useCallback(async (prompt: string) => {
    setStops([]);
    setStatus("loading");
    setError(null);
    setJourneyId(null);
    currentStopRef.current = {};

    try {
      const response = await fetch(`${API_URL}/api/journey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        setStatus("error");
        setError("Failed to start journey");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";
      let currentEventType = "message";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              handleEvent(currentEventType, data);
            } catch {
              // Skip malformed JSON
            }
            currentEventType = "message";
          }
        }
      }
    } catch (err) {
      setStatus("error");
      setError("Connection lost. Please try again.");
    }

    function handleEvent(eventType: string, data: Record<string, unknown>) {
      switch (eventType) {
        case "status":
          setStatus("loading");
          setStatusMessage(data.message as string);
          break;

        case "stop-start":
          setStatus("streaming");
          currentStopRef.current = {
            stopNumber: data.stopNumber as number,
            title: data.title as string,
            narrative: "",
            sceneImageUrl: "",
            dishImageUrl: "",
            recipe: null,
            place: null,
            ttsAudioUrl: null,
          };
          break;

        case "text":
          currentStopRef.current.narrative =
            (currentStopRef.current.narrative || "") + (data.content as string);
          break;

        case "image":
          if (data.type === "scene") {
            currentStopRef.current.sceneImageUrl = data.url as string;
          } else {
            currentStopRef.current.dishImageUrl = data.url as string;
          }
          break;

        case "recipe":
          currentStopRef.current.recipe = data as StopData["recipe"];
          break;

        case "place":
          currentStopRef.current.place = data as StopData["place"];
          break;

        case "stop-end":
          setStops((prev) => [
            ...prev,
            currentStopRef.current as StopData,
          ]);
          currentStopRef.current = {};
          break;

        case "journey-complete":
          setStatus("complete");
          setJourneyId(data.journeyId as string);
          break;

        case "journey-error":
          setStatus("error");
          setError(data.message as string);
          break;
      }
    }
  }, []);

  return { stops, status, statusMessage, journeyId, error, startJourney };
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/hooks/ frontend/lib/
git commit -m "feat: add SSE client hook and API helpers"
```

---

### Task 9: Landing Page

**Files:**
- Create: `frontend/components/landing/Hero.tsx`
- Create: `frontend/components/landing/SuggestionPills.tsx`
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Create `Hero.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface HeroProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export function Hero({ onSubmit, isLoading }: HeroProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-serif text-6xl md:text-8xl font-bold tracking-tight mb-4"
      >
        First Bite
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-serif italic text-fb-text/60 text-lg md:text-xl mb-12"
      >
        The real story starts where the guidebook ends.
      </motion.p>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onSubmit={handleSubmit}
        className="w-full max-w-xl"
      >
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Name a place. I'll find the food."
            disabled={isLoading}
            className="w-full bg-white/5 border border-fb-text/10 rounded-full px-6 py-4 text-fb-text placeholder:text-fb-text/30 font-sans text-lg focus:outline-none focus:border-fb-accent/50 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-fb-accent text-white rounded-full px-6 py-2 font-sans text-sm font-medium hover:bg-fb-accent/80 transition-colors disabled:opacity-30"
          >
            {isLoading ? "Finding..." : "Go"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
```

- [ ] **Step 2: Create `SuggestionPills.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import { SUGGESTIONS } from "@/lib/constants";

interface SuggestionPillsProps {
  onSelect: (suggestion: string) => void;
  disabled: boolean;
}

export function SuggestionPills({ onSelect, disabled }: SuggestionPillsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="flex flex-wrap justify-center gap-2 mt-6 max-w-xl mx-auto px-6"
    >
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className="text-xs font-sans px-4 py-2 rounded-full border border-fb-text/10 text-fb-text/50 hover:border-fb-accent/30 hover:text-fb-accent transition-colors disabled:opacity-30"
        >
          {suggestion}
        </button>
      ))}
    </motion.div>
  );
}
```

- [ ] **Step 3: Update `app/page.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Hero } from "@/components/landing/Hero";
import { SuggestionPills } from "@/components/landing/SuggestionPills";
import { useJourneyStream } from "@/hooks/useJourneyStream";

export default function Home() {
  const { status, startJourney } = useJourneyStream();
  const router = useRouter();
  const isLoading = status === "loading" || status === "streaming";

  const handleSubmit = (prompt: string) => {
    startJourney(prompt);
    // Navigation to journey page happens after journeyId is assigned
    // For now, we'll render the journey inline or redirect
  };

  return (
    <main>
      <Hero onSubmit={handleSubmit} isLoading={isLoading} />
      <SuggestionPills onSelect={handleSubmit} disabled={isLoading} />
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/components/landing/ frontend/app/page.tsx
git commit -m "feat: add landing page with hero, prompt input, suggestion pills"
```

---

### Task 10: Journey Story Flow UI

**Files:**
- Create: `frontend/components/journey/StoryFlow.tsx`
- Create: `frontend/components/journey/StopCard.tsx`
- Create: `frontend/components/journey/RecipeCard.tsx`
- Create: `frontend/components/journey/PlaceCard.tsx`
- Create: `frontend/components/journey/ProgressDots.tsx`
- Create: `frontend/components/ui/LoadingQuips.tsx`

- [ ] **Step 1: Create `LoadingQuips.tsx`**

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LoadingQuipsProps {
  message: string;
}

export function LoadingQuips({ message }: LoadingQuipsProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-fb-accent/30 border-t-fb-accent rounded-full mb-8"
      />
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="font-serif italic text-fb-text/50 text-lg text-center"
        >
          {message}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Create `ProgressDots.tsx`**

```tsx
interface ProgressDotsProps {
  current: number;
  total: number;
}

export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
      <span className="font-sans text-xs text-fb-text/40">
        Stop {current} of {total}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < current ? "bg-fb-accent" : "bg-fb-text/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `RecipeCard.tsx`**

```tsx
"use client";

import { useRef } from "react";
import type { StopData } from "@/hooks/useJourneyStream";

interface RecipeCardProps {
  recipe: NonNullable<StopData["recipe"]>;
  dishImageUrl: string;
}

export function RecipeCard({ recipe, dishImageUrl }: RecipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#0A0A0A",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `first-bite-${recipe.dish_name.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div ref={cardRef} className="bg-white/5 rounded-2xl overflow-hidden border border-fb-text/10">
      {dishImageUrl && (
        <img
          src={dishImageUrl}
          alt={recipe.dish_name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-serif text-xl font-bold">{recipe.dish_name}</h4>
            <p className="font-sans text-xs text-fb-text/40 mt-1">
              {recipe.cuisine_type} &middot; {recipe.prep_time} min &middot; Serves {recipe.servings}
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="text-xs font-sans px-3 py-1.5 rounded-full border border-fb-text/10 text-fb-text/50 hover:border-fb-accent/30 hover:text-fb-accent transition-colors"
          >
            Download
          </button>
        </div>

        <div className="mb-4">
          <h5 className="font-sans text-xs uppercase tracking-wider text-fb-accent mb-2">
            Ingredients
          </h5>
          <ul className="space-y-1">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="font-sans text-sm text-fb-text/70">
                {ing.amount}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="font-sans text-xs uppercase tracking-wider text-fb-accent mb-2">
            Instructions
          </h5>
          <ol className="space-y-2">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="font-sans text-sm text-fb-text/70">
                <span className="text-fb-accent font-medium mr-2">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-4 font-sans text-[10px] text-fb-text/20 text-center">
          First Bite
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `PlaceCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { StopData } from "@/hooks/useJourneyStream";

interface PlaceCardProps {
  place: NonNullable<StopData["place"]>;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const [showMap, setShowMap] = useState(false);

  const mapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${encodeURIComponent(place.address)}&maptype=roadmap`;

  return (
    <>
      <div className="flex items-center gap-3 py-3">
        <div className="text-fb-accent text-lg">📍</div>
        <div className="flex-1">
          <p className="font-sans text-sm font-medium">{place.name}</p>
          <p className="font-sans text-xs text-fb-text/40">{place.address}</p>
          <p className="font-serif italic text-xs text-fb-text/30 mt-1">
            {place.footnote}
          </p>
        </div>
        <button
          onClick={() => setShowMap(true)}
          className="text-xs font-sans px-3 py-1.5 rounded-full border border-fb-text/10 text-fb-text/50 hover:border-fb-accent/30 hover:text-fb-accent transition-colors"
        >
          View on Map
        </button>
      </div>

      {/* Map Modal */}
      {showMap && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowMap(false)}
        >
          <div
            className="w-full max-w-2xl bg-fb-bg rounded-2xl overflow-hidden border border-fb-text/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-fb-text/10">
              <div>
                <h3 className="font-sans text-sm font-medium">{place.name}</h3>
                <p className="font-sans text-xs text-fb-text/40">{place.address}</p>
              </div>
              <button
                onClick={() => setShowMap(false)}
                className="text-fb-text/40 hover:text-fb-text transition-colors text-xl"
              >
                &times;
              </button>
            </div>
            <iframe
              src={mapsEmbedUrl}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <p className="p-3 font-sans text-[10px] text-fb-text/20 text-center">
              Place is AI-suggested. Verify details before visiting.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 5: Create `StopCard.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import { RecipeCard } from "./RecipeCard";
import { PlaceCard } from "./PlaceCard";
import { AudioPlayer } from "./AudioPlayer";
import type { StopData } from "@/hooks/useJourneyStream";

const STOP_THEMES = [
  "The Arrival",
  "The Street",
  "The Kitchen",
  "The Table",
  "The Last Bite",
];

interface StopCardProps {
  stop: StopData;
  journeyId: string | null;
}

export function StopCard({ stop, journeyId }: StopCardProps) {
  const theme = STOP_THEMES[stop.stopNumber - 1] || "";

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl mx-auto px-6 py-16"
    >
      {/* Stop header */}
      <div className="mb-8">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-fb-accent mb-2">
          Stop {stop.stopNumber} &mdash; {theme}
        </p>
        <h2 className="font-serif text-3xl md:text-4xl font-bold">
          {stop.title}
        </h2>
      </div>

      {/* Narrative */}
      <div className="font-sans text-base md:text-lg leading-relaxed text-fb-text/80 whitespace-pre-line mb-8">
        {stop.narrative}
      </div>

      {/* Scene image */}
      {stop.sceneImageUrl && (
        <motion.img
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          src={stop.sceneImageUrl}
          alt={`Scene at ${stop.title}`}
          className="w-full rounded-xl mb-8 shadow-2xl"
        />
      )}

      {/* Recipe card */}
      {stop.recipe && (
        <div className="mb-8">
          <RecipeCard recipe={stop.recipe} dishImageUrl={stop.dishImageUrl} />
        </div>
      )}

      {/* Place */}
      {stop.place && (
        <div className="mb-8">
          <PlaceCard place={stop.place} />
        </div>
      )}

      {/* Audio player */}
      <AudioPlayer
        stopNumber={stop.stopNumber}
        narrative={stop.narrative}
        journeyId={journeyId}
        ttsAudioUrl={stop.ttsAudioUrl}
      />
    </motion.section>
  );
}
```

- [ ] **Step 6: Create `AudioPlayer.tsx`**

Create: `frontend/components/journey/AudioPlayer.tsx`

```tsx
"use client";

import { useState, useRef } from "react";
import { generateTTS } from "@/lib/api";

interface AudioPlayerProps {
  stopNumber: number;
  narrative: string;
  journeyId: string | null;
  ttsAudioUrl: string | null;
}

export function AudioPlayer({
  stopNumber,
  narrative,
  journeyId,
  ttsAudioUrl,
}: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState(ttsAudioUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = async () => {
    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    if (!journeyId) return;
    setIsLoading(true);

    try {
      const url = await generateTTS(journeyId, stopNumber, narrative);
      setAudioUrl(url);
      setTimeout(() => {
        audioRef.current?.play();
        setIsPlaying(true);
      }, 100);
    } catch {
      // Silent fail — narration is enhancement
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePlay}
        disabled={isLoading}
        className="flex items-center gap-2 text-xs font-sans px-4 py-2 rounded-full border border-fb-text/10 text-fb-text/50 hover:border-fb-accent/30 hover:text-fb-accent transition-colors disabled:opacity-30"
      >
        {isLoading ? "Generating..." : isPlaying ? "⏸ Pause" : "▶ Listen"}
      </button>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 7: Create `StoryFlow.tsx`**

```tsx
"use client";

import { StopCard } from "./StopCard";
import { ProgressDots } from "./ProgressDots";
import type { StopData } from "@/hooks/useJourneyStream";

interface StoryFlowProps {
  stops: StopData[];
  journeyId: string | null;
}

export function StoryFlow({ stops, journeyId }: StoryFlowProps) {
  if (stops.length === 0) return null;

  return (
    <div className="relative">
      <ProgressDots current={stops.length} total={5} />

      {stops.map((stop) => (
        <StopCard key={stop.stopNumber} stop={stop} journeyId={journeyId} />
      ))}

      {/* Disclaimer */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <p className="font-sans text-[10px] text-fb-text/20 text-center">
          All places and restaurants are AI-suggested. Verify details before
          visiting.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Update `app/page.tsx` to render journey**

```tsx
"use client";

import { Hero } from "@/components/landing/Hero";
import { SuggestionPills } from "@/components/landing/SuggestionPills";
import { StoryFlow } from "@/components/journey/StoryFlow";
import { LoadingQuips } from "@/components/ui/LoadingQuips";
import { useJourneyStream } from "@/hooks/useJourneyStream";

export default function Home() {
  const { stops, status, statusMessage, journeyId, error, startJourney } =
    useJourneyStream();

  const isLoading = status === "loading";
  const isStreaming = status === "streaming" || status === "complete";

  if (isLoading) {
    return <LoadingQuips message={statusMessage || "Starting your journey..."} />;
  }

  if (error) {
    return (
      <main>
        <Hero onSubmit={startJourney} isLoading={false} />
        <p className="text-center text-fb-accent font-sans text-sm mt-4">
          {error}
        </p>
        <SuggestionPills onSelect={startJourney} disabled={false} />
      </main>
    );
  }

  if (isStreaming) {
    return <StoryFlow stops={stops} journeyId={journeyId} />;
  }

  return (
    <main>
      <Hero onSubmit={startJourney} isLoading={false} />
      <SuggestionPills onSelect={startJourney} disabled={false} />
    </main>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add frontend/components/ frontend/app/page.tsx
git commit -m "feat: add story flow UI with stop cards, recipes, places, audio"
```

---

## Chunk 3: Integration, Deploy & Polish

### Task 11: Journey View Page (Saved Journeys)

**Files:**
- Create: `frontend/app/journey/[id]/page.tsx`

- [ ] **Step 1: Create journey page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StoryFlow } from "@/components/journey/StoryFlow";
import { LoadingQuips } from "@/components/ui/LoadingQuips";
import { fetchJourney } from "@/lib/api";
import type { StopData } from "@/hooks/useJourneyStream";

export default function JourneyPage() {
  const params = useParams();
  const journeyId = params.id as string;
  const [stops, setStops] = useState<StopData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJourney(journeyId)
      .then((data) => {
        const mappedStops: StopData[] = (data.stops || []).map(
          (s: Record<string, unknown>) => ({
            stopNumber: s.stop_number as number,
            title: s.title as string,
            narrative: s.narrative as string,
            sceneImageUrl: (s.scene_image_url as string) || "",
            dishImageUrl: (s.dish_image_url as string) || "",
            recipe: s.recipe as StopData["recipe"],
            place: s.place as StopData["place"],
            ttsAudioUrl: (s.tts_audio_url as string) || null,
          })
        );
        setStops(mappedStops);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [journeyId]);

  if (loading) {
    return <LoadingQuips message="Loading your journey..." />;
  }

  return <StoryFlow stops={stops} journeyId={journeyId} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/journey/
git commit -m "feat: add saved journey view page"
```

---

### Task 12: Local Development & Testing

- [ ] **Step 1: Create backend `.env` with your API key**

```bash
cd backend
cp .env.example .env
# Edit .env with real GOOGLE_API_KEY
```

- [ ] **Step 2: Start backend locally**

```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --port 8000 --reload
```

- [ ] **Step 3: Start frontend locally**

```bash
cd frontend && npm run dev
```

- [ ] **Step 4: Test end-to-end**

Open `http://localhost:3000`, type "Street food in Oaxaca", verify:
- Loading quips appear
- Stops stream in with text and images
- Recipe cards render with download button
- Place cards show with "View on Map"
- TTS play button works

- [ ] **Step 5: Fix any issues found during testing**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix: integration fixes from local testing"
```

---

### Task 13: Deploy Backend to Cloud Run

- [ ] **Step 1: Create GCS bucket**

```bash
gsutil mb -l us-central1 gs://first-bite-media
gsutil iam ch allUsers:objectViewer gs://first-bite-media
```

- [ ] **Step 2: Deploy to Cloud Run**

```bash
cd backend
gcloud run deploy first-bite-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_API_KEY=YOUR_KEY,GCP_PROJECT_ID=YOUR_PROJECT,GCS_BUCKET_NAME=first-bite-media,FRONTEND_URL=https://first-bite.vercel.app" \
  --memory 1Gi \
  --timeout 300
```

- [ ] **Step 3: Note the Cloud Run URL**

Update `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=https://first-bite-api-XXXXX-uc.a.run.app
```

- [ ] **Step 4: Set Vercel env var instead of committing .env.local**

```bash
cd frontend
vercel env add NEXT_PUBLIC_API_URL production
# Value: https://first-bite-api-XXXXX-uc.a.run.app
```

Note: Do NOT commit `.env.local` — it's in `.gitignore`. Use Vercel env vars for production.

---

### Task 14: Deploy Frontend to Vercel

- [ ] **Step 1: Deploy frontend**

```bash
cd frontend
vercel --prod
```

- [ ] **Step 2: Add env vars in Vercel**

```bash
vercel env add NEXT_PUBLIC_API_URL production
# Value: https://first-bite-api-XXXXX-uc.a.run.app
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_KEY production
# Value: your Google Maps API key
```

- [ ] **Step 3: Redeploy with env vars**

```bash
vercel --prod --force
```

- [ ] **Step 4: Test production deployment**

Visit `https://first-bite.vercel.app`, run a full journey, verify everything works.

---

### Task 15: README, Architecture Diagram & Demo

- [ ] **Step 1: Create README.md with architecture diagram, setup instructions, tech stack**

Include:
- Project description
- Architecture diagram (ASCII or Mermaid)
- All Gemini models used with model IDs
- ADK agent descriptions
- Setup instructions (backend + frontend)
- Cloud Run deployment commands
- Environment variables needed
- Screenshot or demo GIF

- [ ] **Step 2: Create architecture diagram image**

Use Mermaid or draw.io for a clean visual diagram showing:
Next.js → Cloud Run → ADK Agents → Gemini Models → GCS/Firestore

- [ ] **Step 3: Record demo video (< 4 minutes)**

Script outline:
1. (0:00-0:30) Hook — show the landing page, explain the concept
2. (0:30-1:30) Live demo — type "Street food in Oaxaca", show journey generating
3. (1:30-2:15) Showcase features — recipe card download, map modal, TTS narration
4. (2:15-3:00) Architecture — show the ADK agents, Gemini models, Cloud Run
5. (3:00-3:30) Tech stack summary, hackathon requirements met

- [ ] **Step 4: Push to GitHub**

```bash
cd /Users/tarikmoody/Documents/Projects/first-bite
git init
git add -A
git commit -m "feat: First Bite — complete hackathon submission"
git remote add origin https://github.com/tmoody1973/first-bite.git
git push -u origin main
```

- [ ] **Step 5: Submit to DevPost**

Include: repo URL, demo video, Vercel URL, Cloud Run proof, architecture diagram

---

## Summary

| Task | Component | Est. Time |
|------|-----------|-----------|
| 1 | Backend scaffold (FastAPI, models, config) | 30 min |
| 2 | Gemini response parser + tests | 45 min |
| 3 | Cloud Storage & Firestore services | 20 min |
| 4 | ADK agent definitions | 45 min |
| 5 | API routes (SSE + TTS) | 45 min |
| 6 | Dockerfile & Cloud Run config | 15 min |
| 7 | Frontend scaffold (Next.js + theme) | 30 min |
| 8 | SSE client hook | 30 min |
| 9 | Landing page | 30 min |
| 10 | Story flow UI (all components) | 60 min |
| 11 | Journey view page | 15 min |
| 12 | Local testing & fixes | 60 min |
| 13 | Deploy backend to Cloud Run | 30 min |
| 14 | Deploy frontend to Vercel | 15 min |
| 15 | README, diagram, demo, submit | 60 min |
| **Total** | | **~9 hours** |
