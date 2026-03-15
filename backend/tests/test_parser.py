import pytest
from services.parser import parse_interleaved_response, ParsedStop


def test_parse_single_stop_text_only():
    """Parser extracts stop title and narrative from text parts."""
    parts = [
        {"text": "[STOP 1: Mercado de Abastos]\nThe smoke hits you before the market does.\n\n[RECIPE]\ndishName: Mole Negro\ncuisineType: Oaxacan\nprepTime: 45\nservings: 4\ningredients:\n- 2 dried guajillo chiles | guajillo chiles\n- 1 tbsp lard | lard\ninstructions:\n1. Toast the chiles in a dry skillet.\n2. Blend with stock.\n[PLACE]\nname: Comedor La Abuelita\naddress: Mercado de Abastos, Oaxaca, Mexico\nfootnote: Three generations of mole.\n[END STOP]"}
    ]
    stops = parse_interleaved_response(parts)
    assert len(stops) == 1
    assert stops[0].title == "Mercado de Abastos"
    assert "smoke" in stops[0].narrative
    assert stops[0].recipe is not None
    assert stops[0].recipe.dish_name == "Mole Negro"
    assert len(stops[0].recipe.ingredients) == 2
    assert stops[0].place.name == "Comedor La Abuelita"


def test_parse_stop_with_images():
    """Parser assigns images in order: first=scene, second=dish."""
    parts = [
        {"text": "[STOP 1: Night Market]\nLanterns sway above..."},
        {"inline_data": {"mime_type": "image/png", "data": "scene_base64"}},
        {"text": "The pad thai arrives sizzling..."},
        {"inline_data": {"mime_type": "image/png", "data": "dish_base64"}},
        {"text": "[RECIPE]\ndishName: Pad Thai\ncuisineType: Thai\nprepTime: 20\nservings: 2\ningredients:\n- 200g rice noodles | rice noodles\ninstructions:\n1. Soak noodles.\n[PLACE]\nname: Jay Fai\naddress: 327 Maha Chai Rd, Bangkok\nfootnote: Michelin-starred street food.\n[END STOP]"},
    ]
    stops = parse_interleaved_response(parts)
    assert len(stops) == 1
    assert stops[0].scene_image_data == "scene_base64"
    assert stops[0].dish_image_data == "dish_base64"


def test_parse_multiple_stops():
    """Parser handles multiple stops in sequence."""
    parts = [
        {"text": "[STOP 1: Place A]\nNarrative A.\n[RECIPE]\ndishName: Dish A\ncuisineType: Mexican\nprepTime: 10\nservings: 2\ningredients:\n- 1 item | item\ninstructions:\n1. Cook it.\n[PLACE]\nname: Spot A\naddress: Addr A\nfootnote: Note A\n[END STOP]"},
        {"text": "[STOP 2: Place B]\nNarrative B.\n[RECIPE]\ndishName: Dish B\ncuisineType: Thai\nprepTime: 15\nservings: 4\ningredients:\n- 2 items | items\ninstructions:\n1. Prep it.\n[PLACE]\nname: Spot B\naddress: Addr B\nfootnote: Note B\n[END STOP]"},
    ]
    stops = parse_interleaved_response(parts)
    assert len(stops) == 2
    assert stops[0].stop_number == 1
    assert stops[1].stop_number == 2


def test_parse_empty_response():
    """Parser returns empty list for empty response."""
    stops = parse_interleaved_response([])
    assert stops == []


def test_parse_malformed_response():
    """Parser handles response without proper delimiters gracefully."""
    parts = [{"text": "Just some random text without any stops."}]
    stops = parse_interleaved_response(parts)
    assert stops == []
