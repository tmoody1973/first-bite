# First Bite — DevPost Submission

## Inspiration

I kept thinking about food travel shows — the good ones, where you feel the heat of a kitchen before you see the food. The ones that make you understand why a grandmother in Oaxaca has been making the same mole for forty years. I wanted to build something that captures that feeling, but generated entirely by AI from a single sentence. When I saw the Creative Storyteller category asking for "text, images, audio, and video in a single fluid output stream," the idea clicked: what if one prompt could produce an entire food documentary?

## What it does

You type a place — "Street food in Lagos," "Grandmother kitchens of Tbilisi," anything — and First Bite generates a complete 5-stop food journey. Each stop has a narrative with cultural history woven in, AI-generated street photography and dish photos, a verified real restaurant with Google Places ratings, a Street View image of the location, a home-cookable recipe with downloadable card, voice narration, and ambient soundscapes (market bustle, kitchen clatter, dining room chatter). The final slide is a vintage French travel poster featuring all five dishes and a cinematic Veo video playing behind it. You can save journeys, build a world map of your food travels, and share any journey with a public link.

## How we built it

The core is one API call per stop: Nano Banana 2 with `responseModalities: ["TEXT", "IMAGE"]` generates narrative text and AI photography interleaved in a single response. The model composes the story around the images it generates — not separate calls stitched together after the fact.

After each stop generates, an enrichment pipeline runs: Google Places API verifies the restaurant exists and pulls real ratings and photos. Street View Static API grabs the actual street-level view. ElevenLabs generates an ambient soundscape from a text description of the scene. Gemini 2.5 Flash TTS narrates the text. Everything saves progressively to Firestore so the frontend can show loading progress.

After all five stops: Nano Banana 2 generates a vintage travel poster in IMAGE-only mode, and Veo 3.1 creates an 8-second cinematic summary video in the background. The backend runs on Cloud Run (Python/FastAPI) with Cloud Storage for media. The frontend is Next.js on Vercel with Clerk for auth and a full-screen story flow built with Framer Motion.

## Challenges we ran into

Google Search grounding and interleaved image generation don't play well together. Early builds had the first stop returning empty — Gemini would get caught up in search grounding metadata and forget to generate the actual narrative and images. We had to remove grounding from the interleaved calls and handle fact verification separately through Google Places API.

Gemini TTS returns raw PCM audio, not MP3. Our first deploy had ffmpeg crashing because it couldn't identify the input format. Stop 1's narration kept failing silently because the Arrival narrative was the longest — the PCM file was so large ffmpeg timed out at the 30-second limit. Finding that in the Cloud Run logs took longer than it should have.

Getting the experience flow right was the biggest challenge. We went through SSE streaming (broke on the frontend), progressive polling (showed stops out of order), cinematic reveal (started on stop 4 instead of stop 1), and fixed-timer auto-advance (cut off narration mid-sentence). The final solution: wait for everything to generate, reveal from stop 1, advance when narration ends. Simple. Should have started there.

## Accomplishments that we're proud of

Eight modalities from one prompt. Narrative text, AI scene photography, AI dish photography, real restaurant photos, Street View imagery, ambient soundscapes, voice narration, and cinematic video — all generated and assembled into a full-screen immersive experience. No other approach we've seen combines this many output types from a single user input.

The interleaved output is the part that matters most. Nano Banana 2 doesn't generate text and images separately — it composes them together, deciding where to place each image in the narrative flow. That's what makes it feel like a creative director working, not a series of API calls bolted together.

The recipes with history. Each recipe doesn't just tell you how to cook — it tells you why this dish exists, what trade routes brought the ingredients, who perfected the technique. Food as cultural storytelling, not just instructions.

## What we learned

Interleaved output is genuinely different from generating text and images separately. The model makes creative decisions about where visuals belong in the narrative. That compositional quality is hard to get any other way.

Google's API ecosystem is deep but the pieces don't always work together seamlessly. Grounding conflicts with image generation. Places API charges per field. Street View coverage varies wildly by region. The APIs are powerful individually — the engineering is in knowing which combinations work and which ones fight each other.

Progressive generation with polling is more reliable than streaming for multimodal content. We burned hours debugging SSE parsing for interleaved data before realizing that writing to Firestore and polling from the frontend was simpler, more reliable, and gave us progressive loading for free.

## What's next for First Bite

Guide Mode — a conversational interface where you chat with the storytelling agent and it generates interleaved responses inline. Say "tell me more about the mole" and get a deeper narrative with fresh images and history. That's the "interactive storybook" from the category description.

Recipe videos with Veo — a 5-second clip of each dish being plated, generated per stop instead of just a still image.

Animated map transitions using the Maps JavaScript API — the map flies between stop locations as you navigate the journey, connecting the geography to the story.

Lyria integration for ambient music — generative background music that matches the mood and region of each stop, playing under the narration and ambient sound as a third audio layer.
