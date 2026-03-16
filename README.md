# First Bite

> *The real story starts where the guidebook ends.*

An AI-powered cultural food journey generator — inspired by food-focused travel shows — that transforms a simple prompt into an immersive multimedia travelogue. Text, AI-generated photography, ambient soundscapes, video, TTS narration, verified restaurant recommendations, and downloadable recipe cards, all woven together in one cohesive experience powered by Gemini's interleaved output.

**Built for the [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com/) — Creative Storyteller category.**

**Live:** https://first-bite.vercel.app
**API:** https://first-bite-api-396860003792.us-central1.run.app
**Code:** https://github.com/tmoody1973/first-bite

### Google Cloud Deployment Proof

- **Cloud Run Service:** [first-bite-api](https://console.cloud.google.com/run/detail/us-central1/first-bite-api/metrics?project=gen-lang-client-0506418938)
- **Firestore Database:** [journeys collection](https://console.cloud.google.com/firestore/databases/-default-/data/panel/journeys?project=gen-lang-client-0506418938)
- **Cloud Storage Bucket:** [first-bite-media](https://console.cloud.google.com/storage/browser/first-bite-media?project=gen-lang-client-0506418938)
- **GCP Project:** `gen-lang-client-0506418938`
- **Region:** `us-central1`

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

![First Bite Architecture](docs/architecture.png)

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

## Try it live (testing instructions)

No setup required. The app is deployed and ready to use.

### Step 1: Open the app

Go to **https://first-bite.vercel.app**

### Step 2: Sign in

Click **"Sign In"** or **"Get Started"** in the top right. You can sign in with Google or create an account with email.

### Step 3: Start a journey

Type a place in the input field and click **"Bon Voyage"**. Try one of these:

- `Street food in Lagos`
- `Night markets of Bangkok`
- `Grandmother kitchens of Tbilisi`
- `Dock workers' breakfast in Lisbon`

Or click any of the suggestion pills below the input.

### Step 4: Wait for generation (~3-4 minutes)

The loading screen shows progress as each stop generates. You'll see checkmarks appear as stops complete (1 of 5, 2 of 5, etc.). Floating food photos provide visual ambiance while you wait.

### Step 5: Experience the journey

Once all 5 stops and the travel poster are ready, the experience reveals automatically starting at **Stop 1: The Arrival**. Each stop includes:

- Full-screen AI-generated scene as background
- Narrative text with cultural history
- Photo carousel (AI scene → Street View → real Google Places photo)
- Voice narration (auto-plays)
- Ambient soundscape (plays at low volume under narration)
- Recipe card (tap the dish thumbnail to expand, tap "Save" to download as PNG)
- Verified restaurant with rating (tap "View on Map" for Google Maps)

### Step 6: Navigate

- **Tap right side of screen** or press **→** to go to next stop
- **Tap left side** or press **←** to go back
- Narration auto-advances to the next stop when it finishes
- Press **P** to jump to the poster/video finale
- Press **Home** to jump back to Stop 1

### Step 7: The finale

The last slide shows a vintage French travel poster with all 5 dishes and restaurants. If the Veo video has finished generating, it plays full-screen behind the poster. You can:

- **Download the poster** as an image
- **Share the journey** — copies a public link anyone can view without an account
- **Start a new journey**
- **Go to your dashboard**

### Step 8: Dashboard

Click **"My Journeys"** or **"Gallery"** to see all your saved journeys. The world map shows pins for each destination. Click any journey card to revisit the full experience.

### What to look for

- **Interleaved output** — text and AI images generated together in one Gemini call per stop
- **Cultural storytelling** — history, trade routes, origin stories woven into every narrative
- **Real restaurant data** — verified names, addresses, and ratings from Google Places
- **Audio layers** — TTS narration on top, ambient soundscape underneath
- **Recipe cards** — full ingredients and steps, downloadable as PNG
- **Travel poster** — vintage French lithograph style with all dishes
- **Journey video** — Veo 3.1 cinematic recap on the final slide

---

## Quick start (spin-up instructions)

Get the app running locally in under 5 minutes.

### Step 0: Clone the repo

```bash
git clone https://github.com/tmoody1973/first-bite.git
cd first-bite
```

### Step 1: Get your API keys

You need three keys before starting:

| Key | Where to get it | What it's for |
|-----|----------------|---------------|
| **Google API Key** | [Google AI Studio](https://aistudio.google.com/apikey) | Gemini models (interleaved output, TTS, Veo) |
| **Google Maps API Key** | [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials) | Places, Street View, Geocoding, Maps Embed. Enable these APIs: Places API (New), Street View Static API, Geocoding API, Maps Embed API, Maps Static API |
| **ElevenLabs API Key** | [ElevenLabs Dashboard](https://elevenlabs.io) | Ambient sound effects |

### Step 2: Start the backend

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
```

Now edit `backend/.env` with your keys:

```
GOOGLE_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_maps_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
GCP_PROJECT_ID=your_gcp_project_id
GCS_BUCKET_NAME=first-bite-media
```

Start the server:

```bash
uvicorn main:app --port 8000 --reload
```

Verify it's running: open http://localhost:8000/health — you should see `{"status":"ok"}`

### Step 3: Start the frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create your .env.local file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_maps_api_key
EOF
```

Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000. Type a place name and hit "Bon Voyage."

### Step 4 (optional): GCP setup for Cloud Storage and Firestore

If you want images, audio, and video to persist (not just local dev):

```bash
# Authenticate
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable firestore.googleapis.com storage.googleapis.com

# Create Firestore database
gcloud firestore databases create --location=us-central1

# Create Cloud Storage bucket
gsutil mb -l us-central1 gs://first-bite-media
gsutil iam ch allUsers:objectViewer gs://first-bite-media
```

### Automated cloud deployment (one command)

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
