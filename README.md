# First Bite

> *The real story starts where the guidebook ends.*

An AI-powered cultural food journey generator — inspired by food-focused travel shows — that transforms a simple prompt into an immersive multimedia travelogue. Text, AI-generated photography, ambient soundscapes, video, TTS narration, verified restaurant recommendations, and downloadable recipe cards, all woven together in one cohesive experience powered by Gemini's interleaved output.

**Built for the [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com/) — Creative Storyteller category.**

**Live:** https://first-bite.vercel.app
**API:** https://first-bite-api-396860003792.us-central1.run.app
**Code:** https://github.com/tmoody1973/first-bite

---

## How it works

Type a place. Get a food journey.

```
"Street food in Oaxaca" → 5-stop multimedia travelogue
```

Each journey follows a narrative arc:

| Stop | Theme | What you get |
|------|-------|-------------|
| 1. The Arrival | First impression, the chaos, the smell | AI scene photo + narrative + recipe + real restaurant |
| 2. The Street | The stall nobody talks about | AI dish photo + ambient sound + TTS narration |
| 3. The Kitchen | Behind the counter, the technique | Street View + verified Google Places data |
| 4. The Table | Communal moment, strangers sharing food | Downloadable recipe card with ingredients |
| 5. The Last Bite | Reflection, what this place taught you | Cultural context + place rating |
| Finale | Your journey, captured | Vintage travel poster + cinematic Veo video |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│  Next.js 15 (Vercel)                         │
│  Full-screen story flow with auto-advance    │
│  Photo carousel, recipe cards, map modals    │
│  Ambient audio + TTS narration playback      │
└──────────┬───────────────────────────────────┘
           │ REST polling (3s interval)
           ▼
┌──────────────────────────────────────────────┐
│  Cloud Run (Python/FastAPI)                  │
│                                              │
│  Per-stop generation pipeline:               │
│  ┌────────────────────────────────────────┐  │
│  │ Gemini 3.1 Flash Image (Nano Banana 2)│  │
│  │ → Interleaved text + AI images        │  │
│  │ → Grounded with Google Search         │  │
│  ├────────────────────────────────────────┤  │
│  │ Google Places API (New)               │  │
│  │ → Verify restaurant, get rating/photo │  │
│  ├────────────────────────────────────────┤  │
│  │ Street View Static API                │  │
│  │ → Street-level imagery per stop       │  │
│  ├────────────────────────────────────────┤  │
│  │ ElevenLabs Sound Generation           │  │
│  │ → Ambient environment audio per stop  │  │
│  ├────────────────────────────────────────┤  │
│  │ Gemini 2.5 Flash TTS                  │  │
│  │ → Narrative voice narration per stop  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Post-journey enhancements:                  │
│  ┌────────────────────────────────────────┐  │
│  │ Nano Banana 2 → Vintage travel poster │  │
│  │ Veo 3.1 → Cinematic summary video    │  │
│  │ Geocoding API → Dashboard map pin     │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Firestore → journey persistence             │
│  Cloud Storage → images, audio, video        │
└──────────────────────────────────────────────┘
```

---

## Gemini models and Google Cloud services

| Service | Model / API | What it does |
|---------|-------------|-------------|
| **Interleaved output** | `gemini-3.1-flash-image-preview` (Nano Banana 2) | Generates narrative text and AI images in a single response |
| **Grounding** | Google Search tool | Verifies restaurants and recipes against real search results |
| **TTS narration** | `gemini-2.5-flash-preview-tts` | Narrates each stop with a distinctive voice |
| **Travel poster** | `gemini-3.1-flash-image-preview` (Nano Banana 2) | Generates vintage French-style poster with all dishes and restaurants |
| **Journey video** | `veo-3.1-generate-preview` | Creates 8-second cinematic summary video |
| **Orchestrator** | `gemini-3.1-pro-preview` | Routes and coordinates the agent pipeline |
| **Restaurant verification** | Google Places API (New) | Verifies places exist, returns ratings, real photos, coordinates |
| **Location imagery** | Street View Static API | Street-level photos of each restaurant location |
| **Map pins** | Geocoding API | Converts prompts to lat/lng for the dashboard world map |
| **Ambient sound** | ElevenLabs Sound Generation | Environment audio per stop (market bustle, kitchen sounds) |
| **Backend hosting** | Cloud Run | Python/FastAPI with 2GB memory, 10-min timeout |
| **Database** | Firestore | Journey persistence with progressive writes |
| **Media storage** | Cloud Storage | Images, audio, video with public read access |
| **Auth** | Clerk | User accounts, journey gallery |

### Interleaved output (mandatory tech)

The storyteller uses `responseModalities: ["TEXT", "IMAGE"]` to generate text and images in a single Gemini call. This is the core Creative Storyteller requirement.

```python
response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents=[{"role": "user", "parts": [{"text": prompt}]}],
    config={
        "response_modalities": ["TEXT", "IMAGE"],
        "tools": [{"google_search": {}}],  # Grounding
    },
)
```

The response returns alternating text and image parts. A parser extracts the narrative, recipe, and place data from each stop.

---

## Features

- **8 modalities per journey** — narrative text, AI scene photos, AI dish photos, real restaurant photos, Street View, ambient sound, TTS narration, video
- **5-stop narrative arc** — The Arrival, The Street, The Kitchen, The Table, The Last Bite
- **Full-screen immersive story flow** — auto-advances like a travel show, with manual navigation
- **Photo carousel** — auto-scrolling through AI images, real photos, and Street View per stop
- **Downloadable recipe cards** — two-column layout with Nano Banana dish photo, saved as PNG
- **Verified restaurant data** — Google Places API confirms restaurants exist with real ratings and photos
- **Google Maps integration** — tap any place to view on map or Street View
- **Ambient soundscapes** — ElevenLabs generates environment audio per stop (15% volume under narration)
- **Vintage travel poster** — AI-generated French lithograph-style poster with all dishes and restaurants
- **Cinematic summary video** — Veo 3.1 generates an 8-second journey recap, plays behind poster
- **Dashboard with world map** — all your journeys as pins on a dark-themed map
- **Share links** — every journey has a public URL anyone can view
- **Clerk auth** — sign in to save and revisit journeys

---

## Quick start

### Prerequisites

- Python 3.12+
- Node.js 20+
- Google Cloud SDK (`gcloud`)
- A Google API key (Gemini API access)
- A Google Maps API key (Places, Street View, Geocoding, Maps Static)
- An ElevenLabs API key (sound generation)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your API keys

uvicorn main:app --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key" >> .env.local
echo "CLERK_SECRET_KEY=your_key" >> .env.local
echo "NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key" >> .env.local

npm run dev
```

Open http://localhost:3000.

### Automated cloud deployment

```bash
# Set environment variables, then run:
./deploy.sh
```

The `deploy.sh` script automates: GCP API enablement, Firestore creation, Cloud Storage bucket setup, Cloud Run deployment, health check, and Vercel deployment.

---

## Project structure

```
first-bite/
├── backend/
│   ├── agents/                # Gemini agent definitions
│   │   ├── orchestrator.py    # Root agent (gemini-3.1-pro-preview)
│   │   ├── storyteller.py     # Interleaved text+image (Nano Banana 2)
│   │   ├── chef.py            # Recipe + dish image generation
│   │   └── narrator.py        # TTS narration
│   ├── tools/                 # External API integrations
│   │   ├── image_gen.py       # Nano Banana 2 dish photos
│   │   ├── tts.py             # Gemini TTS + WAV→MP3 transcoding
│   │   ├── places.py          # Google Places API verification
│   │   ├── geocode.py         # Geocoding API for map pins
│   │   ├── ambient.py         # ElevenLabs ambient sound effects
│   │   └── video_gen.py       # Veo 3.1 journey video
│   ├── services/
│   │   ├── parser.py          # Parse interleaved Gemini response
│   │   ├── storage.py         # Cloud Storage uploads
│   │   └── firestore.py       # Journey CRUD with progressive writes
│   ├── routes/
│   │   ├── journey.py         # POST /api/journey, GET /api/journey/:id
│   │   └── tts.py             # POST /api/tts
│   ├── models.py              # Pydantic data models
│   ├── config.py              # Environment config + model IDs
│   ├── main.py                # FastAPI app + CORS + rate limiter
│   ├── Dockerfile             # Cloud Run container (Python 3.12 + ffmpeg)
│   └── tests/                 # Parser unit tests
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Landing page with prompt input
│   │   ├── dashboard/         # Journey gallery with world map
│   │   └── journey/[id]/      # Saved journey viewer
│   ├── components/
│   │   ├── journey/           # StoryFlow, StopCard, RecipeCard, PlaceCard,
│   │   │                      # PhotoCarousel, AudioPlayer, ProgressDots
│   │   ├── landing/           # Hero, SuggestionPills
│   │   └── ui/                # LoadingQuips
│   ├── hooks/
│   │   └── useJourneyStream.ts  # Polling hook with progressive reveal
│   └── lib/                   # API client, constants
├── blog/
│   └── building-first-bite.md # Blog post (hackathon bonus content)
├── deploy.sh                  # Automated cloud deployment script
└── docs/                      # Design spec + implementation plan
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Gemini API key (interleaved output, TTS, Veo, grounding) | Yes |
| `GOOGLE_MAPS_API_KEY` | Google Maps Platform key (Places, Street View, Geocoding) | Yes |
| `ELEVENLABS_API_KEY` | ElevenLabs key (ambient sound effects) | Yes |
| `GCP_PROJECT_ID` | Google Cloud project ID | Yes |
| `GCS_BUCKET_NAME` | Cloud Storage bucket name | Yes |

### Frontend (Vercel env vars)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Cloud Run backend URL | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps key (for embed iframe) | No |

---

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/journey` | Create journey. Returns ID, generates in background. |
| `GET` | `/api/journey/:id` | Fetch journey (stops, poster, video). |
| `GET` | `/api/journeys/:userId` | List user's completed journeys. |
| `GET` | `/api/journey/:id/share` | Public share endpoint (no auth). |
| `POST` | `/api/tts` | Generate TTS narration for a stop. |
| `DELETE` | `/api/journey/:id` | Delete a journey (owner only). |
| `GET` | `/health` | Health check. |

---

## Hackathon requirements

| Requirement | Status | Details |
|-------------|--------|---------|
| Gemini model | Done | 3.1 Pro + 3.1 Flash Image + 2.5 Flash TTS + Veo 3.1 |
| Google GenAI SDK | Done | All Gemini calls via `google-genai` Python SDK |
| Backend on Google Cloud | Done | Cloud Run + Firestore + Cloud Storage + Places + Street View + Geocoding |
| Interleaved/mixed output | Done | `responseModalities: ["TEXT", "IMAGE"]` with grounding |
| Public code repository | Done | github.com/tmoody1973/first-bite |
| Architecture diagram | Done | See above |
| Demo video (< 4 min) | Pending | |

### Bonus points

| Bonus | Status | Details |
|-------|--------|---------|
| Published content with #GeminiLiveAgentChallenge | Done | `blog/building-first-bite.md` |
| Automated cloud deployment | Done | `deploy.sh` — infrastructure-as-code |

---

## The storytelling voice

First Bite's narrative style is inspired by food-focused travel shows — the kind that respect the people behind the food and skip the tourist traps. The AI storyteller writes with sensory detail, cultural context, and honest opinions. No food-blog superlatives. No "mouth-watering." Just real stories about real food in real places.

---

## How First Bite fulfills the Creative Storyteller category

The hackathon asks for: *"an agent that thinks and creates like a creative director, seamlessly weaving together text, images, audio, and video in a single, fluid output stream."*

Here's how First Bite delivers on every element:

### Text + images in one interleaved stream

Each stop is generated by a single `generateContent` call with `responseModalities: ["TEXT", "IMAGE"]`. Gemini composes the narrative and generates scene/dish photography in one response. The text naturally flows around the images — not separate calls stitched together, but one creative output.

```
Gemini response parts:
  [TEXT]  "The smoke hits you before the market does..."
  [IMAGE] AI-generated street market scene
  [TEXT]  "At a stall with no name, the taquero..."
  [IMAGE] AI-generated plated dish
  [TEXT]  "[RECIPE] dishName: Tacos de Tasajo..."
```

### Audio narration woven with visuals

Gemini 2.5 Flash TTS narrates each stop automatically. The narration plays as the user views the images and text — audio layered with visuals, not separate. ElevenLabs ambient soundscapes (market bustle, kitchen sounds) play underneath at 15% volume, creating a multi-layered audio experience.

### Video in the output stream

Veo 3.1 generates a cinematic 8-second journey summary video that plays full-screen behind the travel poster on the final slide. The video captures the atmosphere of all 5 stops as B-roll footage.

### Grounded in reality

Google Search grounding verifies restaurants and recipes. Google Places API confirms each restaurant exists with real ratings and photos. Street View provides actual street-level imagery. The AI creates the story; Google's data makes it real.

### The creative director experience

```
User types: "Street food in Oaxaca"
     │
     ▼
┌─ STOP 1: THE ARRIVAL ──────────────────────────┐
│  [Narrative text streams in]                     │
│  [AI street scene fades in as background]        │
│  [Photo carousel: real photo → Street View]      │
│  [Ambient market sounds at 15% volume]           │
│  [TTS narration auto-plays]                      │
│  [Recipe card with dish photo + download]         │
│  [Verified restaurant: ★4.3 — tap for map]      │
└──────────────────────────────────────────────────┘
     │  auto-advances after 15 seconds
     ▼
┌─ STOP 2: THE STREET ────────────────────────────┐
│  [New narrative, new images, new sounds]          │
│  [Different ambient: sizzling wok, quiet street] │
└──────────────────────────────────────────────────┘
     │  ... stops 3, 4, 5 ...
     ▼
┌─ FINALE ────────────────────────────────────────┐
│  [Veo video plays full-screen as background]     │
│  [Vintage French travel poster with all dishes]  │
│  [Download poster / Share journey / New journey] │
└──────────────────────────────────────────────────┘
```

8 modalities. One prompt. One cohesive flow. Text, AI images, real photos, Street View, ambient sound, TTS narration, video, and interactive maps — all generated and assembled by Gemini, grounded by Google, and delivered as an immersive full-screen experience.

---

Built by [Tarik Moody](https://github.com/tmoody1973) for the Gemini Live Agent Challenge 2026.
