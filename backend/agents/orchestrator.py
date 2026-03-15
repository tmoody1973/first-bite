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
