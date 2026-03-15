# First Bite

> *The real story starts where the guidebook ends.*

A Bourdain-inspired cultural food journey generator that transforms a simple prompt into an immersive multimedia travelogue — narration, AI-generated street photography, home-cookable recipes with downloadable cards, and real place recommendations with Google Maps — all powered by Gemini's interleaved output.

**Built for the [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com/) — Creative Storyteller category.**

**Live:** https://first-bite.vercel.app
**API:** https://first-bite-api-396860003792.us-central1.run.app

---

## How It Works

Type a place. Get a food journey.

```
"Street food in Oaxaca" → 5-stop multimedia travelogue
```

Each journey follows a narrative arc inspired by Bourdain's storytelling:

| Stop | Theme | What You Get |
|------|-------|-------------|
| 1. The Arrival | First impression, chaos, the smell | Street scene image + narrative |
| 2. The Street | The stall nobody talks about | Dish image + recipe card |
| 3. The Kitchen | Behind the counter, the technique | Cooking story + ingredients |
| 4. The Table | Communal moment, strangers sharing | Cultural context + place |
| 5. The Last Bite | Reflection, what this place taught you | Farewell + TTS narration |

Every stop includes: AI-generated scene photography, a signature dish with downloadable recipe card, a real restaurant/stall recommendation with Google Maps link, and on-demand Gemini TTS narration.

---

## Architecture

```
┌──────────────────────────────────────┐
│  Next.js 15 (Vercel)                 │
│  Landing page → SSE stream → Story   │
│  flow with recipe cards, maps, audio │
└──────────┬───────────────────────────┘
           │ SSE stream / REST
           ▼
┌──────────────────────────────────────┐
│  Cloud Run (Python/FastAPI)          │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Google ADK Agent Pipeline     │  │
│  │                                │  │
│  │  Orchestrator (3.1 Pro)        │  │
│  │    → Storyteller               │  │
│  │      (interleaved text+image)  │  │
│  │    → Chef                      │  │
│  │      (recipes + dish images)   │  │
│  │    → Narrator                  │  │
│  │      (TTS audio per stop)      │  │
│  └────────────────────────────────┘  │
│                                      │
│  Firestore — journey persistence     │
│  Cloud Storage — images + audio      │
└──────────────────────────────────────┘
```

---

## Gemini Models Used

| Agent | Model ID | Purpose |
|-------|----------|---------|
| **Orchestrator** | `gemini-3.1-pro-preview` | Routes prompts to sub-agents, assembles journey |
| **Storyteller** | `gemini-3.1-flash-image-preview` (Nano Banana 2) | Generates interleaved text + AI images in one response |
| **Chef** | `gemini-3.1-flash-image-preview` (Nano Banana 2) | Generates styled dish photos for recipe cards |
| **Narrator** | `gemini-2.5-flash-preview-tts` | Generates TTS narration with gravelly Bourdain-style voice |

### Interleaved Output (Mandatory Tech)

The Storyteller agent uses `responseModalities: ["TEXT", "IMAGE"]` to generate a single response that weaves together narrative text and AI-generated images. This is the core Creative Storyteller requirement — not separate text and image calls, but one fluid multimodal stream.

```python
storyteller_agent = Agent(
    name="storyteller",
    model="gemini-3.1-flash-image-preview",
    instruction=STORYTELLER_INSTRUCTION,
    generate_content_config={
        "response_modalities": ["TEXT", "IMAGE"],
    },
)
```

### Google ADK Multi-Agent Pipeline

Built with [Google ADK](https://github.com/google/adk-python) using the `sub_agents` pattern for hierarchical orchestration:

```python
orchestrator = Agent(
    name="first_bite_guide",
    model="gemini-3.1-pro-preview",
    instruction=ORCHESTRATOR_INSTRUCTION,
    sub_agents=[storyteller_agent, chef_agent, narrator_agent],
)
```

---

## The Bourdain Voice

The Storyteller agent channels Bourdain's raw, honest prose. Key prompt rules:

- **Never** use food-blog superlatives ("amazing," "delicious," "mouth-watering")
- Respect the **people** behind the food — who's cooking, why it matters
- Anti-tourist — skip the guidebook spots, find the real stuff
- Sensory-first — smell, heat, texture, sound of the kitchen
- Opinionated and direct: *"Skip the resort buffet. Walk three blocks east."*

---

## Features

- **Interleaved Gemini Output** — Text and AI images generated in a single stream
- **5-Stop Narrative Arc** — Structured journey from Arrival to Last Bite
- **Downloadable Recipe Cards** — Every dish includes home-cookable recipe with Nano Banana 2 dish photo, downloadable as PNG
- **Real Place Recommendations** — AI-suggested restaurants/stalls with addresses
- **Google Maps Integration** — Click any place to view on Google Maps
- **Gemini TTS Narration** — On-demand audio narration per stop with gravelly voice
- **SSE Streaming** — Progressive reveal with Bourdain-style loading quips
- **Mobile-Responsive** — Dark editorial design that works on any screen

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS, Framer Motion |
| Backend | Python 3.12, FastAPI, Google ADK |
| AI Models | Gemini 3.1 Pro, Gemini 3.1 Flash Image (Nano Banana 2), Gemini 2.5 Flash TTS |
| Database | Google Firestore |
| Storage | Google Cloud Storage |
| Frontend Hosting | Vercel |
| Backend Hosting | Google Cloud Run |

---

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- Google Cloud SDK (`gcloud`)
- A Google API key with Gemini API access

### Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your GOOGLE_API_KEY and GCP_PROJECT_ID

# Start the server
uvicorn main:app --port 8000 --reload
```

### Frontend Setup

```bash
cd frontend
npm install

# Set backend URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

Open http://localhost:3000 and type a place name.

### Deploy to Google Cloud

```bash
# Backend → Cloud Run
cd backend
gcloud run deploy first-bite-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_API_KEY=YOUR_KEY,GCP_PROJECT_ID=YOUR_PROJECT,GCS_BUCKET_NAME=first-bite-media" \
  --memory 1Gi \
  --timeout 300

# Frontend → Vercel
cd frontend
vercel --prod
```

---

## Project Structure

```
first-bite/
├── backend/
│   ├── agents/              # Google ADK agent definitions
│   │   ├── orchestrator.py  # Root agent with sub_agents
│   │   ├── storyteller.py   # Interleaved text+image generation
│   │   ├── chef.py          # Recipe + dish image generation
│   │   └── narrator.py      # TTS narration
│   ├── tools/               # Gemini tool functions
│   │   ├── image_gen.py     # Nano Banana 2 dish photos
│   │   └── tts.py           # TTS + WAV→MP3 transcoding
│   ├── services/            # Infrastructure services
│   │   ├── parser.py        # Parse interleaved Gemini response
│   │   ├── storage.py       # Cloud Storage uploads
│   │   └── firestore.py     # Journey CRUD
│   ├── routes/              # FastAPI endpoints
│   │   ├── journey.py       # POST /api/journey (SSE stream)
│   │   └── tts.py           # POST /api/tts
│   ├── models.py            # Pydantic data models
│   ├── main.py              # FastAPI app + CORS + rate limiter
│   ├── Dockerfile           # Cloud Run container
│   └── tests/               # Parser unit tests
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/
│   │   ├── landing/         # Hero, suggestion pills
│   │   ├── journey/         # StoryFlow, StopCard, RecipeCard, PlaceCard, AudioPlayer
│   │   └── ui/              # LoadingQuips
│   ├── hooks/               # useJourneyStream (SSE client)
│   └── lib/                 # API client, constants
└── docs/                    # Design spec + implementation plan
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Gemini API key | Yes |
| `GCP_PROJECT_ID` | Google Cloud project ID | Yes |
| `GCS_BUCKET_NAME` | Cloud Storage bucket for media | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | No |

### Frontend (`frontend/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps Embed API key | No |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/journey` | Create a journey. Returns SSE stream of stops with text, images, recipes, places. |
| `GET` | `/api/journey/:id` | Fetch a saved journey by ID. |
| `POST` | `/api/tts` | Generate TTS narration for a stop. Returns audio URL. |
| `GET` | `/health` | Health check. |

---

## Hackathon Requirements

| Requirement | Status |
|-------------|--------|
| Gemini model | Gemini 3.1 Pro + 3.1 Flash Image + 2.5 Flash TTS |
| Google GenAI SDK or ADK | Google ADK with multi-agent pipeline |
| Backend on Google Cloud | Cloud Run + Firestore + Cloud Storage |
| Interleaved/mixed output | `responseModalities: ["TEXT", "IMAGE"]` |
| Public code repository | https://github.com/tmoody1973/first-bite |
| Architecture diagram | Above |
| Demo video | [Coming soon] |

---

## Disclaimer

All places and restaurants mentioned in journeys are AI-suggested. Verify details before visiting.

---

Built by [Tarik Moody](https://github.com/tmoody1973) for the Gemini Live Agent Challenge 2026.
