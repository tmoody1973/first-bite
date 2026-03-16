# How I built First Bite: a food storytelling app that actually feels alive

*I created this piece for the Gemini Live Agent Challenge hackathon (#GeminiLiveAgentChallenge). What follows is an honest account of building with Gemini's interleaved output, Veo, TTS, and a bunch of Google Cloud services over a very long weekend.*

---

I've been obsessed with Anthony Bourdain's storytelling for years. Not the food part specifically, but the way he made you feel like you were standing on a street corner in Hanoi at 2am, watching a woman pull noodles from a pot she's been tending since before sunrise. That mix of sensory detail, cultural respect, and zero tolerance for tourist nonsense.

So when I saw the Gemini Live Agent Challenge — specifically the Creative Storyteller category asking for "text, images, audio, and video in a single fluid output stream" — I thought: what if I could build something that tells food stories the way Bourdain did?

## The idea

First Bite takes a simple prompt like "Street food in Oaxaca" and generates a full multimedia journey. Five stops. Each one has a Bourdain-voiced narrative, AI-generated street photography, a home-cookable recipe with a plated dish photo, a real restaurant recommendation verified through Google, Street View imagery, and audio narration. At the end, you get a vintage French travel poster and a cinematic summary video. All from one sentence.

## Why interleaved output changes things

Here's what made this project click: Gemini's `responseModalities: ["TEXT", "IMAGE"]` config. Instead of generating text in one call and images in another, Gemini weaves them together in a single response. You get back an array of parts — text, then image, then text, then image — like a creative director sketching and writing simultaneously.

I'm using `gemini-3.1-flash-image-preview` (Nano Banana 2) for this. The prompt tells Gemini to channel Bourdain's voice and generate exactly one stop per call, with scene photography and dish photography inline. The response comes back with the narrative naturally broken around the images. It genuinely feels like the AI is composing, not just answering a question.

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

That `google_search` tool is grounding — Gemini checks its restaurant recommendations against real Google Search results. Without it, the AI occasionally invents restaurants. With it, the places tend to actually exist.

## The pipeline

Each journey runs through this sequence:

1. **Gemini 3.1 Flash Image** generates interleaved narrative + scene photo + dish photo for each stop
2. A parser extracts the structured data (recipe, place name, address) from the response
3. **Google Places API** verifies the restaurant exists and pulls real ratings, addresses, photos
4. **Street View Static API** grabs the actual street-level view of each location
5. **Gemini 2.5 Flash TTS** narrates the text in a gravelly, world-weary voice
6. Everything saves to **Firestore** progressively, so the frontend can show stops as they arrive
7. After all stops: **Nano Banana 2** generates a vintage French travel poster
8. **Veo 3.1** creates an 8-second cinematic summary video

The whole thing runs on **Cloud Run** with a Python/FastAPI backend. Images and audio go to **Cloud Storage**. The frontend is Next.js on Vercel, polling Firestore for progressive updates.

## What I learned about Gemini TTS

The TTS quality surprised me. I'm using the "Charon" voice — it has this low, slightly rough quality that fits the Bourdain tone. But there was a catch: Gemini TTS returns raw PCM audio, not MP3. My first deploy had ffmpeg timing out trying to transcode long narratives. I ended up capping the narration at 800 characters (about 60 seconds of speech) and bumping the ffmpeg timeout to 120 seconds.

One gotcha: the first stop's narration kept failing because the Arrival narrative was always the longest. The user would get four stops with audio and one silent one. Took me a while to find that in the logs.

## The Google Places problem

I burned through some API credits early on because I was requesting too many fields. The Places API (New) charges based on which fields you include in `X-Goog-FieldMask`. I cut it down to just `displayName`, `formattedAddress`, `rating`, `location`, and `photos`. About $0.003 per lookup. Five stops per journey, so under two cents per journey for verified restaurant data.

The Street View integration is my favorite touch. You tap "View on Map" and you're standing in front of the actual restaurant. Or at least close to it — Street View coverage varies. For spots in rural Mexico or Southeast Asia, sometimes you get a view from the nearest road instead of the front door.

## Making the prompt not repeat itself

Early on, every stop started with "Forget the tourist traps" or "You don't come here for the air conditioning." Gemini was copying my example phrases from the voice rules. I had to explicitly ban certain phrases:

```
CRITICAL — AVOID REPETITION:
- NEVER start with "Forget..." or "You don't come here to..."
- NEVER mention "air conditioning" or "resort" or "guidebook"
- Each stop must open with a COMPLETELY DIFFERENT sentence structure
```

That fixed it. Each stop now reads like a different chapter.

## The tech stack

- **Gemini 3.1 Flash Image** (Nano Banana 2) — interleaved text + image generation
- **Gemini 3.1 Pro** — orchestrator model
- **Gemini 2.5 Flash TTS** — narration with Charon voice
- **Veo 3.1** — journey summary video
- **Google Places API** — restaurant verification
- **Street View Static API** — location imagery
- **Google Search Grounding** — fact verification
- **Cloud Run** — Python/FastAPI backend
- **Firestore** — journey persistence
- **Cloud Storage** — images, audio, video
- **Next.js 15** — frontend (Vercel)
- **Clerk** — authentication
- **Framer Motion** — full-screen story flow animations

## What I'd do with more time

I want to add a Guide Mode — a conversational interface where you chat with the Bourdain-voiced guide and it generates interleaved responses inline. Think of it as an interactive storybook where you can say "tell me more about the mole" and get a deeper dive with fresh images.

I'd also want to generate recipe videos with Veo. Instead of just a static dish photo, imagine a 5-second clip of the dish being plated. The prompt engineering would be interesting.

And animated map transitions between stops. Right now the stops are full-screen slides. With a Maps JavaScript API integration, the map could fly between locations as you swipe through the journey.

## The Bourdain thing

I want to be clear: First Bite isn't trying to replace Bourdain or claim his voice. It's an homage to his approach — the idea that food tells stories about people and places, and those stories deserve to be told with honesty and sensory detail instead of food-blog superlatives. If the AI writes "mouth-watering" even once, I consider that a prompt engineering failure.

The real test is whether someone uses First Bite and then actually goes to one of these places. That's the point. Not the poster. Not the video. Whether it makes you curious enough to book a flight and find the third stall on the left.

---

*Built for the [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com/) by [Tarik Moody](https://github.com/tmoody1973).*

*Try it: [first-bite.vercel.app](https://first-bite.vercel.app) | Code: [github.com/tmoody1973/first-bite](https://github.com/tmoody1973/first-bite)*

*#GeminiLiveAgentChallenge*
