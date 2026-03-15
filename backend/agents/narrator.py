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
