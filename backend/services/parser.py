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
    """Extract recipe from text block — flexible parsing."""
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
            if not line:
                continue

            # Match dishName/dish_name/Dish Name variations
            if re.match(r"(?:dish_?[Nn]ame|Dish Name)\s*[:]\s*", line):
                dish_name = re.sub(r"^(?:dish_?[Nn]ame|Dish Name)\s*[:]\s*", "", line).strip()
            elif re.match(r"(?:cuisine_?[Tt]ype|Cuisine(?: Type)?)\s*[:]\s*", line):
                cuisine_type = re.sub(r"^(?:cuisine_?[Tt]ype|Cuisine(?: Type)?)\s*[:]\s*", "", line).strip()
            elif re.match(r"(?:prep_?[Tt]ime|Prep Time)\s*[:]\s*", line):
                val = re.sub(r"^(?:prep_?[Tt]ime|Prep Time)\s*[:]\s*", "", line).strip()
                prep_time = int(re.search(r"\d+", val).group()) if re.search(r"\d+", val) else 0
            elif re.match(r"(?:servings?|Servings?)\s*[:]\s*", line):
                val = re.sub(r"^(?:servings?|Servings?)\s*[:]\s*", "", line).strip()
                prep_match = re.search(r"\d+", val)
                servings = int(prep_match.group()) if prep_match else 4
            elif re.match(r"(?:ingredients?|Ingredients?)\s*[:]\s*$", line, re.IGNORECASE):
                section = "ingredients"
            elif re.match(r"(?:instructions?|Instructions?|Steps?|Directions?)\s*[:]\s*$", line, re.IGNORECASE):
                section = "instructions"
            elif section == "ingredients" and line.startswith("- "):
                raw = line[2:].strip()
                parts = raw.split("|")
                if len(parts) >= 2:
                    amount = parts[0].strip()
                    name = parts[1].strip()
                else:
                    amount = raw
                    name = raw.split(",")[0].strip() if "," in raw else raw
                ingredients.append(Ingredient(name=name, amount=amount))
            elif section == "instructions" and re.match(r"^\d+[\.\)]\s*", line):
                step = re.sub(r"^\d+[\.\)]\s*", "", line).strip()
                if step:
                    instructions.append(step)

        if not dish_name:
            return None

        return Recipe(
            dish_name=dish_name,
            cuisine_type=cuisine_type or "International",
            prep_time=prep_time,
            servings=servings or 4,
            ingredients=ingredients,
            instructions=instructions,
        )
    except Exception:
        return None


def _parse_place(text: str) -> Place | None:
    """Extract place from text block — flexible parsing."""
    try:
        name = ""
        address = ""
        footnote = ""
        for line in text.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            if re.match(r"(?:name|Name)\s*[:]\s*", line):
                name = re.sub(r"^(?:name|Name)\s*[:]\s*", "", line).strip()
            elif re.match(r"(?:address|Address)\s*[:]\s*", line):
                address = re.sub(r"^(?:address|Address)\s*[:]\s*", "", line).strip()
            elif re.match(r"(?:footnote|Footnote|Note)\s*[:]\s*", line):
                footnote = re.sub(r"^(?:footnote|Footnote|Note)\s*[:]\s*", "", line).strip()
        if not name:
            return None
        return Place(name=name, address=address or "Address not available", footnote=footnote)
    except Exception:
        return None


def parse_interleaved_response(parts: list[dict]) -> list[ParsedStop]:
    """Parse Gemini interleaved response parts into structured stops.

    Handles flexible formatting — Gemini may use:
    - [STOP 1: Title] or ### [STOP 1: Title] or **Stop 1: Title** etc.
    - [RECIPE] or embedded recipe blocks
    - [PLACE] or embedded place info
    """
    stops: list[ParsedStop] = []
    current_stop: ParsedStop | None = None
    image_count_for_stop = 0

    # First pass: concatenate all text and track image positions
    all_parts_flat = []
    for part in parts:
        if "text" in part:
            all_parts_flat.append(("text", part["text"]))
        elif "inline_data" in part:
            all_parts_flat.append(("image", part["inline_data"].get("data", "")))

    for part_type, part_data in all_parts_flat:
        if part_type == "image":
            if current_stop is not None:
                if image_count_for_stop == 0:
                    current_stop.scene_image_data = part_data
                elif image_count_for_stop == 1:
                    current_stop.dish_image_data = part_data
                image_count_for_stop += 1
            continue

        text = part_data

        # Check for stop markers — very flexible matching
        # Matches: [STOP 1: Title], ### [STOP 1: ...], **Stop 1 — Title**, ## Stop 1: Title, etc.
        stop_pattern = r"(?:#{1,4}\s*)?(?:\[?\s*)?(?:STOP|Stop)\s+(\d+)\s*(?:[:—\-]\s*(?:The\s+\w+\s*[:—\-]\s*)?)?(.+?)(?:\]|\s*$)"
        stop_matches = list(re.finditer(stop_pattern, text, re.MULTILINE))

        if stop_matches:
            # Split text by stop markers
            for i, match in enumerate(stop_matches):
                # Save previous stop
                if current_stop is not None:
                    stops.append(current_stop)

                title = match.group(2).strip().rstrip("]").strip()
                # Clean up markdown from title
                title = re.sub(r"[*#\[\]]", "", title).strip()

                current_stop = ParsedStop(
                    stop_number=int(match.group(1)),
                    title=title,
                )
                image_count_for_stop = 0

                # Get text after this marker until next marker or end
                start = match.end()
                if i + 1 < len(stop_matches):
                    end = stop_matches[i + 1].start()
                else:
                    end = len(text)

                segment = text[start:end].strip()
                _process_stop_text(current_stop, segment)
        elif current_stop is not None:
            # No stop marker — append to current stop
            _process_stop_text(current_stop, text)

    # Don't forget last stop
    if current_stop is not None:
        stops.append(current_stop)

    return stops


def _process_stop_text(stop: ParsedStop, text: str) -> None:
    """Extract narrative, recipe, and place from a stop's text."""
    # Check for recipe section
    recipe_marker = re.search(r"\[RECIPE\]", text, re.IGNORECASE)
    place_marker = re.search(r"\[PLACE\]", text, re.IGNORECASE)
    end_marker = re.search(r"\[END STOP\]", text, re.IGNORECASE)

    # If no explicit markers, look for recipe content by field names
    if not recipe_marker:
        recipe_marker = re.search(r"^(?:dish_?[Nn]ame|dishName)\s*:", text, re.MULTILINE)

    if not place_marker:
        place_marker = re.search(r"^(?:name|Name)\s*:.*\n.*(?:address|Address)\s*:", text, re.MULTILINE)

    # Extract narrative (everything before recipe/place markers)
    narrative_end = len(text)
    if recipe_marker:
        narrative_end = min(narrative_end, recipe_marker.start())
    if place_marker and not recipe_marker:
        narrative_end = min(narrative_end, place_marker.start())

    narrative = text[:narrative_end].strip()
    # Clean markdown artifacts
    narrative = re.sub(r"^\s*#{1,4}\s*", "", narrative, flags=re.MULTILINE)
    narrative = narrative.strip()

    if narrative:
        stop.narrative = (
            (stop.narrative + "\n\n" + narrative).strip()
            if stop.narrative
            else narrative
        )

    # Extract recipe
    if recipe_marker:
        recipe_start = recipe_marker.start()
        recipe_end = place_marker.start() if place_marker and place_marker.start() > recipe_start else (end_marker.start() if end_marker else len(text))
        recipe_text = text[recipe_start:recipe_end]
        # Remove the [RECIPE] marker itself
        recipe_text = re.sub(r"\[RECIPE\]", "", recipe_text, flags=re.IGNORECASE).strip()
        parsed = _parse_recipe(recipe_text)
        if parsed:
            stop.recipe = parsed

    # Extract place
    if place_marker:
        place_start = place_marker.start()
        place_end = end_marker.start() if end_marker else len(text)
        place_text = text[place_start:place_end]
        place_text = re.sub(r"\[PLACE\]", "", place_text, flags=re.IGNORECASE).strip()
        parsed = _parse_place(place_text)
        if parsed:
            stop.place = parsed
