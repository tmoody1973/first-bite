# How I built First Bite: a creative storytelling agent that actually composes

*I created this piece for the Gemini Live Agent Challenge hackathon (#GeminiLiveAgentChallenge). What follows is an honest account of building a multimodal storytelling agent with Gemini's interleaved output over a long weekend.*

---

The Creative Storyteller category caught my eye because of one specific phrase: "an agent that thinks and creates like a creative director." Not an agent that answers questions. Not a chatbot. Something that composes — that weaves together text, images, audio, and video the way a human director would storyboard a documentary.

I kept coming back to food travel shows. Not the recipes. The way the best ones make you feel the heat of a kitchen in Bangkok, hear the clatter of a market in Lagos, understand why a grandmother in Oaxaca cooks this particular dish and not that one. The food is the entry point, but the story is about people and places. I wanted to build an agent that does that — takes "street food in Oaxaca" and produces something you'd actually want to watch, listen to, and cook from.

## What the hackathon actually asks for

The category description says: "Leverage Gemini's native interleaved output to generate rich, mixed-media responses that combine narration with visuals, explanations with generated imagery, or storyboards with voiceover, all in one cohesive flow."

That word "interleaved" is doing a lot of work. It means text and images generated together in one response — not separate API calls stitched together after the fact. Gemini can actually compose: write a paragraph, generate a photo, write another paragraph, generate another photo, all in a single call. The model decides where images belong in the narrative. That felt like the foundation for something genuinely new.

## The interleaved output — how the agent actually composes

Here is the core call. One request, two modalities, grounded with Google Search:

```python
response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents=[{"role": "user", "parts": [{"text": prompt}]}],
    config={
        "response_modalities": ["TEXT", "IMAGE"],
        "tools": [{"google_search": {}}],
    },
)
```

What comes back is an array of parts — `TextPart`, then `InlineDataPart` (a PNG), then more text, then another image. The model decided where to place each image based on the narrative flow. I parse this into structured stops, upload the images to Cloud Storage, and stream the results to the frontend.

The `google_search` tool is grounding. Without it, Gemini occasionally invents restaurants that sound plausible but don't exist. With grounding enabled, it checks its claims against real search results. The restaurant recommendations tend to be real places with real addresses.

## The prompting — teaching an agent to be a creative director

This is where most of the work went. The agent prompt has several layers, each one there because of a specific failure I hit during testing.

**The voice layer.** The agent writes in a specific style — sensory, opinionated, respectful of the people behind the food. I explicitly ban food-blog language. If the AI writes "mouth-watering" or "hidden gem," I consider it a prompt failure. The voice rules:

```
- NEVER use food-blog superlatives ("amazing", "delicious", "mouth-watering")
- Respect the people behind the food — who's cooking, why it matters
- Sensory-first — smell, heat, texture, sound of the kitchen
- Be opinionated and direct
```

**The history layer.** Each stop must include cultural context — not generic facts, but the kind of detail that makes food meaningful. Why does this dish exist in this neighborhood? What trade routes brought these spices here? Who are the people cooking this, and how long has this stall been in this family? The prompt requires history about both the food and the place itself. With grounding enabled, the agent can verify dates and events against search results instead of guessing.

**The anti-repetition layer.** Early testing revealed a pattern problem. Every stop started with "Forget the tourist traps" because my example phrase leaked into the output. I had to explicitly ban repeated sentence structures:

```
CRITICAL — AVOID REPETITION:
- NEVER start with "Forget..." or "You don't come here to..."
- Each stop must open with a COMPLETELY DIFFERENT sentence structure
- Vary your vocabulary — if you used "smoke" in one stop, don't in the next
```

**The structure layer.** Each stop follows a narrative arc — The Arrival, The Street, The Kitchen, The Table, The Last Bite. The agent generates exactly two images per stop (scene and dish), a complete recipe with ingredients and instructions, and a real restaurant recommendation. The recipe descriptions read as stories, not lists — where the dish came from, what the ingredients say about the region's history.

## Eight modalities from one prompt

Each journey generates:

1. **Narrative text** — interleaved with images in a single Gemini call
2. **AI scene photography** — street markets, kitchens, dining tables (Nano Banana 2)
3. **AI dish photography** — the signature plate at each stop (Nano Banana 2)
4. **Real restaurant photos** — pulled from Google Places API
5. **Street View imagery** — actual street-level view of each location
6. **Ambient soundscapes** — market bustle, kitchen clatter, dining room hum (ElevenLabs)
7. **Voice narration** — a distinctive narrator voice reads each stop (Gemini TTS)
8. **Cinematic video** — an 8-second journey summary (Veo 3.1)

Plus a vintage French travel poster at the end with all five dishes and restaurant names.

The ambient sound is worth explaining. Each stop gets a different soundscape — Stop 1 might be "busy outdoor market, vendors calling, sizzling food," Stop 3 might be "kitchen sounds, knife on cutting board, pot bubbling." These play at 15% volume under the narration. Most users won't consciously notice them, but they fill the space between words the way a film score does. The narration sits clearly on top.

## The pipeline — how all the pieces fit

The backend runs on Cloud Run (Python/FastAPI). Each journey goes through two phases:

**Phase 1** generates the five stops and marks the journey as ready. Each stop is a separate Gemini call (one stop per call turned out to be more reliable than asking for all five at once). For each stop: Gemini generates interleaved text + images, then the parser extracts the recipe and place data, then Google Places verifies the restaurant and pulls real ratings and photos, then Street View grabs the location imagery, then ElevenLabs generates the ambient sound, then Gemini TTS narrates the text. Each stop saves to Firestore as it completes, so the frontend can show progress.

**Phase 2** runs after the user already has the experience. It generates the travel poster (Nano Banana 2) and the Veo summary video. These are enhancements — the core experience doesn't wait for them.

The frontend (Next.js on Vercel) polls the backend every three seconds. It waits for four stops before revealing anything, then auto-advances through the experience like a story — 45 seconds per stop. Users can also tap to navigate manually. The final slide shows the poster with the Veo video playing full-screen behind it.

## What I learned about Gemini TTS

The Charon voice has a low, slightly rough quality that fits the storytelling tone. But Gemini TTS returns raw PCM audio, not MP3 or WAV with headers. My first deploys had ffmpeg crashing because it couldn't identify the input format. I had to explicitly tell it: "this is signed 16-bit little-endian PCM at 24kHz, mono channel."

Another gotcha: Stop 1 kept failing while the other four worked fine. Turned out Stop 1's narrative was the longest — the Arrival stop tends to run verbose. The PCM file was so large that ffmpeg timed out at the 30-second limit. I capped the TTS input at 800 characters (about 60 seconds of speech) and bumped the timeout to 120 seconds.

## The Google Places problem

I burned through API credits early because I was requesting every available field. The Places API (New) charges per field. I cut the field mask to five fields: `displayName`, `formattedAddress`, `rating`, `location`, `photos`. About $0.003 per lookup. Five stops means under two cents per journey for verified restaurant data.

Street View coverage varies a lot. For restaurants in central Bangkok or Mexico City, you get a clear street-level view. For a market stall in rural Cameroon, sometimes the nearest coverage is 500 meters away on the main road. The app handles this gracefully — if Street View has no coverage, it falls back to a Google Maps link.

## How this fits the Creative Storyteller category

The hackathon asks for "text, images, audio, and video in a single, fluid output stream." Here is what First Bite delivers on each:

**Text + images: interleaved.** Not separate calls assembled after the fact. One `generateContent` call with `responseModalities: ["TEXT", "IMAGE"]`. The model composes the narrative around the images it generates. This is the mandatory tech requirement.

**Audio: narration + ambient layers.** Gemini TTS provides the voice narration. ElevenLabs provides the ambient soundscape underneath. Two audio layers that work together — the narration tells the story, the ambient sound puts you in the space.

**Video: cinematic summary.** Veo 3.1 generates an 8-second cinematic journey recap — a documentary-style montage capturing the atmosphere of all five stops. On the final slide, this video plays full-screen behind the vintage travel poster, creating a cinematic finale that feels like the closing credits of a food documentary. The prompt describes the specific locations and dishes from the journey, so the video is unique to each experience. Veo runs asynchronously after the core journey is ready — users start viewing immediately, and the video appears when they reach the last slide.

**Creative director behavior.** The agent doesn't just generate content — it makes creative decisions. Which five stops to feature. What narrative arc to follow. Where to place images in the text. What history and cultural context to weave in. What ambient sound fits each scene. The prompting encodes a creative sensibility, not just a task description.

The result: eight modalities from one user prompt. Text, AI images, real photos, Street View, ambient sound, voice narration, video, and interactive maps. All assembled into a full-screen immersive experience that auto-advances like a documentary, with a downloadable recipe card at every stop and a vintage travel poster at the end.

## The tech

- **Gemini 3.1 Flash Image** (Nano Banana 2) — interleaved text + image, travel posters
- **Gemini 3.1 Pro** — orchestrator agent
- **Gemini 2.5 Flash TTS** — voice narration (Charon voice)
- **Veo 3.1** — cinematic journey video
- **Google Search Grounding** — fact verification for restaurants and history
- **Google Places API** — restaurant verification with ratings and real photos
- **Street View Static API** — location imagery
- **Geocoding API** — map pins for the journey dashboard
- **ElevenLabs Sound Generation** — ambient soundscapes per stop
- **Cloud Run** — Python/FastAPI backend (2GB, 10-min timeout)
- **Firestore** — progressive journey persistence
- **Cloud Storage** — images, audio, video
- **Clerk** — authentication and user journeys
- **Next.js 15 + Framer Motion** — full-screen story flow frontend

## What I'd build next

A conversational guide mode — chat with the storytelling agent and it generates interleaved responses inline. Say "tell me more about the mole" and get a deeper dive with fresh images and history. That is the "interactive storybook" example from the category description, and it is a natural extension of what is already here.

Recipe videos with Veo — a 5-second clip of the dish being plated, generated per stop instead of just a still image. And animated map transitions between stops using the Maps JavaScript API, so the map flies between locations as you navigate the journey.

## Why food

Food is the original multimodal storytelling medium. A recipe is text. A plated dish is visual. Cooking is sound. Eating is sensory. The history behind a dish is narrative. The place where you eat it is geography. A meal shared with strangers is community.

If you want to build an agent that weaves together text, images, audio, and video into one cohesive experience — food is the subject that demands all of it. You cannot tell the story of street food in Lagos with text alone, or images alone, or audio alone. You need all of them working together. That is what interleaved output was built for.

---

*Built for the [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com/) by [Tarik Moody](https://github.com/tmoody1973).*

*Try it: [first-bite.vercel.app](https://first-bite.vercel.app) | Code: [github.com/tmoody1973/first-bite](https://github.com/tmoody1973/first-bite)*

*#GeminiLiveAgentChallenge*
