import re
from dataclasses import dataclass
from models import Recipe, Place, Ingredient


@dataclass
class ParsedStop:
    stop_number: int = 0
    title: str = ""
    narrative: str = ""
    scene_image_data: str = ""
    dish_image_data: str = ""
    recipe: Recipe | None = None
    place: Place | None = None


def _parse_recipe(text: str) -> Recipe | None:
    """Extract recipe from delimited text block."""
    try:
        lines = text.strip().split("\n")
        dish_name = ""
        cuisine_type = ""
        prep_time = 0
        servings = 0
        ingredients: list[Ingredient] = []
        instructions: list[str] = []
        section = "fields"

        for line in lines:
            line = line.strip()
            if line.startswith("dishName:"):
                dish_name = line.split(":", 1)[1].strip()
            elif line.startswith("cuisineType:"):
                cuisine_type = line.split(":", 1)[1].strip()
            elif line.startswith("prepTime:"):
                prep_time = int(line.split(":", 1)[1].strip())
            elif line.startswith("servings:"):
                servings = int(line.split(":", 1)[1].strip())
            elif line.startswith("ingredients:"):
                section = "ingredients"
            elif line.startswith("instructions:"):
                section = "instructions"
            elif section == "ingredients" and line.startswith("- "):
                parts = line[2:].split("|")
                amount = parts[0].strip()
                name = parts[1].strip() if len(parts) > 1 else amount
                ingredients.append(Ingredient(name=name, amount=amount))
            elif section == "instructions" and re.match(r"^\d+\.", line):
                instructions.append(re.sub(r"^\d+\.\s*", "", line))

        if not dish_name:
            return None

        return Recipe(
            dish_name=dish_name,
            cuisine_type=cuisine_type,
            prep_time=prep_time,
            servings=servings,
            ingredients=ingredients,
            instructions=instructions,
        )
    except Exception:
        return None


def _parse_place(text: str) -> Place | None:
    """Extract place from delimited text block."""
    try:
        name = ""
        address = ""
        footnote = ""
        for line in text.strip().split("\n"):
            line = line.strip()
            if line.startswith("name:"):
                name = line.split(":", 1)[1].strip()
            elif line.startswith("address:"):
                address = line.split(":", 1)[1].strip()
            elif line.startswith("footnote:"):
                footnote = line.split(":", 1)[1].strip()
        if not name:
            return None
        return Place(name=name, address=address, footnote=footnote)
    except Exception:
        return None


def parse_interleaved_response(parts: list[dict]) -> list[ParsedStop]:
    """Parse Gemini interleaved response parts into structured stops."""
    stops: list[ParsedStop] = []
    current_stop: ParsedStop | None = None
    image_count = 0

    for part in parts:
        if "inline_data" in part:
            if current_stop is not None:
                data = part["inline_data"].get("data", "")
                if image_count % 2 == 0:
                    current_stop.scene_image_data = data
                else:
                    current_stop.dish_image_data = data
                image_count += 1
            continue

        text = part.get("text", "")

        # Check for stop starts
        stop_matches = list(re.finditer(r"\[STOP\s+(\d+):\s*(.+?)\]", text))

        if not stop_matches and current_stop is None:
            continue

        # Process text that may contain multiple stops
        segments = re.split(r"\[STOP\s+\d+:\s*.+?\]", text)

        for i, match in enumerate(stop_matches):
            # Save previous stop
            if current_stop is not None:
                stops.append(current_stop)

            current_stop = ParsedStop(
                stop_number=int(match.group(1)),
                title=match.group(2).strip(),
            )
            image_count = 0

            # Get the text after this stop marker
            segment = segments[i + 1] if i + 1 < len(segments) else ""
            _process_stop_text(current_stop, segment)

        # If no new stop markers but we have a current stop, append text
        if not stop_matches and current_stop is not None:
            _process_stop_text(current_stop, text)

    # Don't forget last stop
    if current_stop is not None:
        stops.append(current_stop)

    return stops


def _process_stop_text(stop: ParsedStop, text: str) -> None:
    """Extract narrative, recipe, and place from a stop's text."""
    recipe_match = re.search(
        r"\[RECIPE\](.*?)(?:\[PLACE\]|\[END STOP\]|$)", text, re.DOTALL
    )
    place_match = re.search(r"\[PLACE\](.*?)(?:\[END STOP\]|$)", text, re.DOTALL)

    # Narrative is everything before [RECIPE]
    narrative_end = text.find("[RECIPE]")
    if narrative_end == -1:
        narrative_end = text.find("[END STOP]")
    if narrative_end == -1:
        narrative_end = len(text)

    narrative = text[:narrative_end].strip()
    if narrative:
        stop.narrative = (
            (stop.narrative + "\n" + narrative).strip()
            if stop.narrative
            else narrative
        )

    if recipe_match:
        stop.recipe = _parse_recipe(recipe_match.group(1))

    if place_match:
        stop.place = _parse_place(place_match.group(1))
