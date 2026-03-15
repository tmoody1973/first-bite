from pydantic import BaseModel, Field
from datetime import datetime


class Place(BaseModel):
    name: str
    address: str
    footnote: str


class Ingredient(BaseModel):
    name: str
    amount: str


class Recipe(BaseModel):
    dish_name: str
    cuisine_type: str
    prep_time: int
    servings: int
    ingredients: list[Ingredient]
    instructions: list[str]


class Stop(BaseModel):
    stop_number: int
    title: str
    narrative: str
    scene_image_url: str = ""
    dish_image_url: str = ""
    recipe: Recipe | None = None
    place: Place | None = None
    tts_audio_url: str | None = None


class Journey(BaseModel):
    id: str = ""
    prompt: str
    mode: str = "journey"
    status: str = "streaming"
    created_at: datetime = Field(default_factory=datetime.now)
    stops: list[Stop] = Field(default_factory=list)
