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
