"""Geocode a location string to lat/lng using Google Geocoding API."""

import logging
import requests
from config import GOOGLE_MAPS_API_KEY

logger = logging.getLogger(__name__)

GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


def geocode_location(query: str) -> tuple[float | None, float | None]:
    """Geocode a location string to (lat, lng). Returns (None, None) on failure."""
    if not GOOGLE_MAPS_API_KEY:
        return None, None

    try:
        response = requests.get(
            GEOCODE_URL,
            params={"address": query, "key": GOOGLE_MAPS_API_KEY},
            timeout=10,
        )

        if response.status_code != 200:
            return None, None

        data = response.json()
        results = data.get("results", [])
        if not results:
            return None, None

        location = results[0]["geometry"]["location"]
        lat = location["lat"]
        lng = location["lng"]
        logger.info(f"Geocoded '{query}' → ({lat}, {lng})")
        return lat, lng

    except Exception as e:
        logger.warning(f"Geocode failed for '{query}': {e}")
        return None, None
