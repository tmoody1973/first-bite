from google import genai
from config import GOOGLE_API_KEY, STORYTELLER_MODEL
from services.storage import upload_image_from_base64


def generate_dish_image(dish_name: str, cuisine_type: str) -> str:
    """Generate a styled photo of a plated dish using Nano Banana 2.
    Returns Cloud Storage URL of the generated image."""
    client = genai.Client(api_key=GOOGLE_API_KEY)

    response = client.models.generate_content(
        model=STORYTELLER_MODEL,
        contents=f"Generate a beautifully plated photo of {dish_name}, "
        f"{cuisine_type} cuisine, shot from above on a worn wooden table "
        f"with natural light. Rustic, editorial food photography style.",
        config={"response_modalities": ["IMAGE"]},
    )

    for part in response.candidates[0].content.parts:
        if hasattr(part, "inline_data") and part.inline_data:
            url = upload_image_from_base64(
                part.inline_data.data, prefix="dish-images"
            )
            return url

    return ""
