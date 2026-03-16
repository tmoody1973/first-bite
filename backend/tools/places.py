"""Google Places API integration — verify restaurants and get real data.
Uses Places API (New) with minimal fields to control costs."""

import os
import requests
import logging
from config import GOOGLE_API_KEY

logger = logging.getLogger(__name__)

# Street View Static API
STREET_VIEW_BASE = "https://maps.googleapis.com/maps/api/streetview"
# Places Text Search (New)
PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"


def search_place(name: str, address: str) -> dict | None:
    """Search for a place by name and address. Returns basic info.
    Uses only basic fields to minimize cost (~$0.003 per call)."""
    try:
        response = requests.post(
            PLACES_SEARCH_URL,
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_API_KEY,
                # IMPORTANT: Only request basic fields to keep costs low
                "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.location,places.photos",
            },
            json={
                "textQuery": f"{name} {address}",
                "maxResultCount": 1,
            },
            timeout=10,
        )

        if response.status_code != 200:
            logger.warning(f"Places API error: {response.status_code} {response.text[:200]}")
            return None

        data = response.json()
        places = data.get("places", [])
        if not places:
            return None

        place = places[0]
        result = {
            "name": place.get("displayName", {}).get("text", name),
            "address": place.get("formattedAddress", address),
            "rating": place.get("rating"),
            "lat": place.get("location", {}).get("latitude"),
            "lng": place.get("location", {}).get("longitude"),
        }

        # Get first photo URL if available
        photos = place.get("photos", [])
        if photos:
            photo_name = photos[0].get("name", "")
            if photo_name:
                result["photo_url"] = (
                    f"https://places.googleapis.com/v1/{photo_name}/media"
                    f"?maxHeightPx=400&maxWidthPx=600&key={GOOGLE_API_KEY}"
                )

        return result

    except Exception as e:
        logger.warning(f"Places search failed for '{name}': {e}")
        return None


def get_street_view_url(lat: float, lng: float, width: int = 600, height: int = 400) -> str:
    """Get a Street View Static API image URL for coordinates."""
    return (
        f"{STREET_VIEW_BASE}?size={width}x{height}"
        f"&location={lat},{lng}"
        f"&fov=90&heading=0&pitch=0"
        f"&key={GOOGLE_API_KEY}"
    )


def get_street_view_url_from_address(address: str, width: int = 600, height: int = 400) -> str:
    """Get a Street View Static API image URL from an address string."""
    return (
        f"{STREET_VIEW_BASE}?size={width}x{height}"
        f"&location={requests.utils.quote(address)}"
        f"&fov=90&heading=0&pitch=0"
        f"&key={GOOGLE_API_KEY}"
    )
