# First Bite — Design Spec

> A Bourdain-inspired cultural food journey generator using Gemini's interleaved output.
> Built for the Gemini Live Agent Challenge (Creative Storyteller category).

## Overview

**First Bite** transforms a simple prompt like "Street food in Oaxaca" into an immersive, multimedia travelogue. Gemini composes interleaved text and AI-generated images in a single stream, narrated with Gemini TTS in a raw, Bourdain-inspired voice. Each journey visits 5 real-world stops — markets, street stalls, kitchens — with cultural storytelling, AI-generated photography, downloadable recipe cards, and Google Maps Street View links.

**Tagline:** *"The real story starts where the guidebook ends."*

## Hackathon Requirements Satisfied

| Requirement | How We Satisfy It |
|---|---|
| Gemini model | Gemini 3.1 Flash Image (Nano Banana 2) for interleaved output, 2.5 Flash TTS for narration |
| Google ADK | Multi-agent pipeline built with `google-adk` (Python) |
| Backend on Google Cloud | Python/FastAPI on Cloud Run + Firestore + Cloud Storage |
| Interleaved/mixed output | `responseModalities: ["TEXT", "IMAGE"]` — core feature |
| Demo video < 4 min | Scripted demo of full journey generation |
| Architecture diagram | Included in README |
| Public repo | GitHub with spin-up instructions |

## User Modes

### Journey Mode (Primary)
Single prompt produces a complete 5-stop cultural food journey. Content streams in real-time via SSE.

### Guide Mode (Stretch)
Conversational back-and-forth with a Bourdain-voiced local guide. User explores a food culture interactively with interleaved responses.

## User Flow (Journey Mode)

1. User lands on dark, editorial landing page
2. Types a prompt or taps a suggestion pill
3. Cloud Run receives prompt, calls Gemini with interleaved output
4. Frontend receives SSE stream — renders text, images, recipes as they arrive
5. Each stop builds: narrative text → street scene image → dish introduction → dish image → recipe card → place with map link
6. User can play TTS narration per stop, download recipe cards, view Street View

## Agent Design

### Personality: The Bourdain Voice
- Raw, honest prose — no food-blog superlatives
- Respect the people, not just the food
- Anti-tourist — skip guidebook spots, find the real stuff
- Sensory-first — smell, heat, texture, sound of the kitchen
- Cultural context woven into every stop
- Opinionated and direct

### 5-Stop Narrative Arc

| Stop | Theme | Energy |
|---|---|---|
| 1. The Arrival | First impression, chaos, the smell | Setting the scene |
| 2. The Street | The stall nobody talks about | Building curiosity |
| 3. The Kitchen | Behind the counter, the technique | Deepening respect |
| 4. The Table | Communal moment, strangers sharing food | Emotional peak |
| 5. The Last Bite | Reflection, what this place taught you | Resolution |

### Structured Output Per Stop

Each stop contains:
- **Narrative** — 2-3 paragraphs, Bourdain voice
- **Scene image** — AI-generated street/market/kitchen scene (interleaved)
- **Dish introduction** — 1 paragraph about the signature dish
- **Dish image** — AI-generated plated dish (interleaved)
- **Recipe** — name, ingredients with measurements, step-by-step instructions, prep time, servings
- **Place** — real restaurant/stall name, address, cultural footnote
- **Note** — places are AI-suggested, disclaimer to verify before visiting

### Google ADK Agent Architecture

The backend uses **Google ADK (Agent Development Kit)** for multi-agent orchestration. Three specialized agents collaborate via ADK's `sub_agents` pattern, orchestrated by a root agent.

```python
from google.adk.agents import Agent
from google.adk.tools import FunctionTool

# ─── Tool Definitions ────────────────────────────────────────────

def search_places(location: str, food_type: str) -> dict:
    """Search for real restaurants and street food stalls in a location.
    Returns place names, addresses, and cultural context."""
    # Uses Gemini's grounding with Google Search
    ...

def generate_recipe(dish_name: str, cuisine_type: str) -> dict:
    """Generate a complete home-cookable recipe for a dish.
    Returns ingredients with measurements and step-by-step instructions."""
    ...

def generate_dish_image(dish_name: str, cuisine_type: str) -> str:
    """Generate a styled photo of a plated dish using Nano Banana 2.
    Returns Cloud Storage URL of the generated image."""
    # Uses gemini-3.1-flash-image-preview with responseModalities: ["IMAGE"]
    ...

def generate_tts(text: str, voice: str = "Charon") -> str:
    """Generate TTS narration audio for text.
    Returns Cloud Storage URL of the MP3 file."""
    # Uses gemini-2.5-flash-preview-tts, transcodes WAV→MP3
    ...

# ─── Agent Definitions ───────────────────────────────────────────

# The Storyteller — generates the interleaved narrative + images
storyteller = Agent(
    name="storyteller",
    model="gemini-3.1-flash-image-preview",
    instruction="""You are a cultural food storyteller channeling Anthony Bourdain's voice.
    You write raw, honest, sensory-rich prose about food cultures around the world.
    When given a location, you generate an interleaved narrative with text AND images
    woven together — street scenes, market chaos, plated dishes.
    You NEVER use food-blog superlatives. You respect the people, not just the food.
    You are anti-tourist, pro-human. Opinionated and direct.

    Generate exactly 5 stops following this arc:
    1. The Arrival — first impression, chaos, the smell
    2. The Street — the stall nobody talks about
    3. The Kitchen — behind the counter, the technique
    4. The Table — communal moment, strangers sharing food
    5. The Last Bite — reflection, what this place taught you

    For each stop include real restaurant/stall names and addresses.
    Use [STOP N], [RECIPE], [PLACE], [END STOP] delimiters.""",
    generate_content_config={
        "response_modalities": ["TEXT", "IMAGE"],
    },
)

# The Chef — generates structured recipes and dish images
chef = Agent(
    name="chef",
    model="gemini-3.1-flash-image-preview",
    instruction="""You are a home-cooking expert. Given a dish name and cuisine,
    generate a complete, home-cookable recipe with ingredients (6-12),
    measurements, and step-by-step instructions (4-8 steps).
    Simple honest food — no molecular gastronomy, no restaurant techniques.
    Return structured JSON only.""",
    tools=[FunctionTool(generate_recipe), FunctionTool(generate_dish_image)],
)

# The Narrator — generates TTS audio for each stop
narrator = Agent(
    name="narrator",
    model="gemini-2.5-flash-preview-tts",
    instruction="""You narrate cultural food journeys with a deep, gravelly,
    world-weary voice. Think late-night storytelling over whiskey.
    Read the text exactly as written — don't add commentary.""",
    tools=[FunctionTool(generate_tts)],
)

# ─── Root Orchestrator ───────────────────────────────────────────

first_bite_guide = Agent(
    name="first_bite_guide",
    model="gemini-3.1-pro-preview",
    instruction="""You are the First Bite orchestrator. When a user names a place
    or food culture:
    1. Send the prompt to the Storyteller to generate the interleaved journey
    2. For each stop, send dish details to the Chef for structured recipes + dish images
    3. Send each stop's narrative to the Narrator for TTS audio
    Assemble the complete journey and return all parts.""",
    sub_agents=[storyteller, chef, narrator],
)
```

**Agent pipeline flow:**
```
User: "Street food in Oaxaca"
    │
    ▼
┌─────────────────────────────┐
│  first_bite_guide            │
│  (Orchestrator - 2.5 Flash)  │
│                              │
│  1. Delegates to storyteller │
│     → interleaved text+images│
│  2. Parses 5 stops           │
│  3. Delegates to chef (×5)   │
│     → recipes + dish images  │
│  4. Delegates to narrator(×5)│
│     → TTS audio per stop     │
│  5. Assembles full journey   │
└─────────────────────────────┘
```

**Key ADK features used:**
- `sub_agents` — hierarchical agent delegation
- `FunctionTool` — wraps Python functions as callable tools
- `generate_content_config` — passes `response_modalities: ["TEXT", "IMAGE"]` to enable interleaved output on the storyteller agent
- Built-in session/state management via ADK runner

**NOTE:** `generateContent` with `["TEXT", "IMAGE"]` is non-streaming. The orchestrator blocks while the storyteller generates, then progressively emits SSE events to the frontend for the typewriter reveal effect.

### Gemini Response Parsing Strategy

Gemini interleaved output returns an array of `parts` — alternating `TextPart` and `InlineDataPart` (images). We parse this into our Stop structure using delimiter-based prompting:

**Prompt instructs Gemini to structure output as:**
```
[STOP 1: Place Title]
narrative text here...
[IMAGE: street scene description]
dish introduction text...
[IMAGE: plated dish description]
[RECIPE]
dishName: ...
cuisineType: ...
prepTime: ...
servings: ...
ingredients:
- amount | ingredient name
instructions:
1. Step one...
[PLACE]
name: ...
address: ...
footnote: ...
[END STOP]
```

**Parser logic:**
1. Iterate through `response.parts` in order
2. Track current stop number (increments at each `[STOP N]` delimiter)
3. Text parts → extract narrative, recipe, place data via delimiter matching
4. Image parts → assign to scene or dish based on order (first image = scene, second = dish)
5. Build `Stop[]` array from parsed data
6. If parsing fails (malformed response), retry once with simplified prompt (3 stops instead of 5)

### Fallback Strategy: Per-Stop Generation

If single-call 5-stop generation with 10 images proves unreliable (truncation, refusal), fall back to **per-stop calls:**
1. First call: generate journey outline (5 stop titles + places) — text only
2. Then 5 parallel calls: one per stop with `["TEXT", "IMAGE"]` for 2 images each
3. Assemble stops into journey

This is slower but more reliable. Test the single-call approach first.

## Architecture

```
┌──────────────────────────────────────┐
│  Next.js 15 (Vercel)                 │
│  - Landing page + prompt input       │
│  - Story flow renderer (SSE client)  │
│  - Audio player (TTS mp3)            │
│  - Recipe cards + html2canvas DL     │
│  - Google Maps / Street View modal   │
└──────────┬───────────────────────────┘
           │ SSE stream / REST (CORS)
           ▼
┌──────────────────────────────────────┐
│  Cloud Run (Python/FastAPI)           │
│  + rate limiter (5/IP/hr)            │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Google ADK Agent Pipeline     │  │
│  │  first_bite_guide (orchestrator)  │
│  │    → storyteller (text+image)  │  │
│  │    → chef (recipes+dish imgs)  │  │
│  │    → narrator (TTS audio)      │  │
│  └────────────────────────────────┘  │
│                                      │
│  POST /api/journey                   │
│  → ADK runner executes pipeline      │
│  → Upload images/audio to GCS       │
│  → Progressively emit SSE events     │
│  → Save journey to Firestore         │
│                                      │
│  GET  /api/journey/:id               │
│  → Fetch completed journey           │
│                                      │
│  POST /api/tts                       │
│  → Narrator agent generates audio    │
│  → Transcode WAV→MP3 (ffmpeg)       │
│  → Upload to Cloud Storage           │
│  → Return audio URL                  │
│                                      │
│  Firestore — journey documents       │
│  Cloud Storage — images + audio      │
└──────────────────────────────────────┘
```

## Data Model (Firestore)

### `journeys/{journeyId}`

```python
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Place:
    name: str
    address: str
    footnote: str              # cultural one-liner

@dataclass
class Ingredient:
    name: str
    amount: str

@dataclass
class Recipe:
    dish_name: str
    cuisine_type: str
    prep_time: int             # minutes
    servings: int
    ingredients: list[Ingredient]
    instructions: list[str]

@dataclass
class Stop:
    stop_number: int           # 1-5
    title: str                 # "Mercado de Abastos"
    narrative: str             # Bourdain-voice paragraphs
    scene_image_url: str       # GCS URL
    dish_image_url: str        # GCS URL (Nano Banana 2)
    recipe: Recipe
    place: Place
    tts_audio_url: str | None = None  # populated on-demand

@dataclass
class Journey:
    id: str
    prompt: str
    mode: str                  # "journey" | "guide"
    status: str                # "streaming" | "ready"
    created_at: datetime
    stops: list[Stop] = field(default_factory=list)
```

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/journey` | POST | Create journey, call Gemini interleaved, stream parsed stops via SSE |
| `/api/journey/:id` | GET | Fetch completed journey from Firestore |
| `/api/tts` | POST | Generate TTS audio for a stop's narrative, return audio URL |

**Removed:** `/api/recipe-image` — dish images come from the interleaved Gemini response (2 images per stop: scene + dish). If interleaved images are low quality, we fire a separate Nano Banana call server-side during journey post-processing, not as a client-facing API.

**Removed:** `/api/recipe-card` — recipe card download compositing happens client-side using `html2canvas` to capture the styled recipe card component as a PNG. No server endpoint needed.

### CORS Strategy

FastAPI middleware handles CORS:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://first-bite.vercel.app", "http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
```

SSE responses use `StreamingResponse` with `media_type="text/event-stream"`.

### Rate Limiting

In-memory rate limiter on Cloud Run: **5 journeys per IP per hour.** Simple dict-based counter, reset on Cloud Run instance recycle. Returns `429 Too Many Requests` with message: "Easy — even Bourdain took breaks between meals."

### TTS Audio Format

Gemini TTS returns PCM/WAV. For bandwidth (especially mobile), the server transcodes to **MP3** using `pydub` + `ffmpeg` (installed in Docker image) before returning. Expected size: ~500KB-1MB per stop narration (vs 5-15MB WAV).

## SSE Streaming Protocol

**Important:** Gemini `generateContent` with interleaved output is NOT streaming — it returns a complete response. The backend parses the full response, then progressively emits SSE events to the frontend with small delays between parts to create a typewriter/reveal effect. The frontend experience feels real-time even though the Gemini call blocks.

**Loading phase:** While waiting for Gemini (~15-30s), the backend sends periodic heartbeat events with Bourdain-style loading quips.

```
event: status
data: {"message": "Finding the places the guidebooks forgot..."}

event: status
data: {"message": "Talking to the woman at the third stall on the left..."}

event: stop-start
data: {"stopNumber": 1, "title": "Mercado de Abastos"}

event: text
data: {"content": "The smoke hits you before the market does..."}

event: image
data: {"type": "scene", "url": "https://storage.googleapis.com/..."}

event: text
data: {"content": "At a stall with no name..."}

event: image
data: {"type": "dish", "url": "https://storage.googleapis.com/..."}

event: recipe
data: {"dishName": "Mole Negro", "ingredients": [...], ...}

event: place
data: {"name": "Comedor La Abuelita", "address": "...", ...}

event: stop-end
data: {"stopNumber": 1}

... (repeats for stops 2-5)

event: journey-complete
data: {"journeyId": "abc123"}

event: journey-error
data: {"message": "The kitchen's closed. Try another destination.", "retryable": true}
```

**Image handling:** Images are uploaded to Cloud Storage first, then the GCS URL is sent in the SSE event (not base64 inline). This keeps SSE payloads small.

## Frontend Design

### Aesthetic
Dark, gritty, editorial. Bourdain's *Parts Unknown* meets long-form magazine feature.

### Color Palette
- Background: `#0A0A0A` (near-black)
- Text: `#E8E0D0` (warm off-white)
- Accent: `#C4652A` (burnt orange — charcoal embers)
- Secondary: `#6B7F5E` (muted sage — market produce)

### Typography
- Headlines: Playfair Display (serif, editorial weight)
- Body: Space Grotesk (clean readability)
- Quotes/callouts: Italic serif (Bourdain voice moments)

### Pages

**Landing (`/`)**
- Full-screen dark background, subtle smoke/grain texture
- "First Bite" logo centered
- Tagline: *"The real story starts where the guidebook ends."*
- Prompt input: *"Name a place. I'll find the food."*
- Suggestion pills: "Night markets of Bangkok", "Tacos in Oaxaca", "Street food in Lagos", "Ramen alleys of Tokyo"
- Toggle: Journey Mode / Guide Mode

**Journey (`/journey/[id]`)**
- Vertical scroll story flow
- Stops fade/slide in as user scrolls
- Text streams with typewriter-style reveal
- AI images full-width with parallax
- Recipe cards: dark card, dish image, ingredients, instructions, download button
- Map pin + address per stop → click opens Street View modal
- Audio play button per stop for TTS narration
- Progress: "Stop 2 of 5" dot indicator

**Guide Mode (`/guide`)** *(stretch)*
- Chat interface, dark aesthetic
- Interleaved images inline in guide responses
- Recipe cards within conversation

### Recipe Card Download
Canvas API composites: Nano Banana dish image + recipe text (name, ingredients, instructions) + "First Bite" branding → saves as PNG.

### Google Maps Street View Modal
Click "View on Map" → modal with Google Maps embed iframe in Street View mode. Address passed as URL parameter. Dismiss to return to journey.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS + Framer Motion |
| Backend | Python/FastAPI on Google Cloud Run (Google ADK agents) |
| Database | Google Firestore |
| Image Storage | Google Cloud Storage |
| AI - Journey | `gemini-3.1-flash-image-preview` — Nano Banana 2 (interleaved TEXT + IMAGE) |
| AI - Dish Images | `gemini-3.1-flash-image-preview` — Nano Banana 2 (IMAGE only mode for recipe cards) |
| AI - Narration | `gemini-2.5-flash-preview-tts` — Gemini TTS (30 voices) |
| Frontend Deploy | Vercel |
| Backend Deploy | Google Cloud Run |

## Build Order

1. Scaffold Next.js frontend + Python/FastAPI Cloud Run backend + ADK agents
2. ADK agent pipeline: storyteller → chef → narrator
3. SSE streaming from Cloud Run to frontend
4. Story flow UI (render text + images as they stream)
5. Gemini TTS integration (per-stop narration)
6. Recipe cards with Nano Banana + download
7. Google Maps Street View modal
8. Firestore persistence + share links
9. Polish, deploy, architecture diagram, demo video

## Scope

### Core (must ship)
- Landing page with prompt input + suggestion pills
- Gemini interleaved journey generation (5 stops)
- SSE streaming to frontend with real-time rendering
- Story flow UI (text, images, recipes, places)
- Gemini TTS narration per stop
- Recipe cards with Nano Banana dish images + download
- Google Maps Street View modal per stop
- Firestore persistence
- Cloud Run deployment
- One polished demo journey

### Stretch (if time allows)
- Guide Mode (conversational)
- Photo upload (identify dish → build journey)
- Share links for journeys
- Ambient regional music per stop
- Google Places API validation

### Cut
- User accounts / auth
- Gallery of past journeys
- Video generation
- Social features

## Error Handling

| Failure | Strategy |
|---|---|
| Gemini returns malformed response (missing stops, no images) | Retry once with simplified prompt (3 stops). If still fails, return `journey-error` SSE event. |
| Gemini truncates (fewer than 5 stops) | Accept partial journey, display what we got with "Journey continues..." note. |
| Image missing from interleaved response | Show placeholder (dark card with dish name in text). Fire separate Nano Banana call as fallback. |
| TTS generation fails | Hide play button for that stop. Silent fail — narration is enhancement, not core. |
| Cloud Storage upload fails | Inline base64 as fallback (larger payload but still works). |
| SSE connection drops | Frontend detects disconnect, shows "Reconnecting..." with retry. If journey was partially saved to Firestore, reload from there. |
| Street View has no coverage for address | Fallback to standard Google Maps embed (satellite/map view). Hide "Street View" label, show "View on Map" instead. |
| Gemini rate limit / quota exceeded | Return 503 with message: "Kitchen's backed up. Try again in a minute." |

## Disclaimer

All places and restaurants are AI-suggested. Verify details before visiting.
