import uuid
from datetime import datetime
from google.cloud import firestore


def _get_db():
    return firestore.Client()


def create_journey(prompt: str, mode: str = "journey") -> str:
    """Create a new journey document, return its ID."""
    db = _get_db()
    journey_id = str(uuid.uuid4())[:8]
    doc_ref = db.collection("journeys").document(journey_id)
    doc_ref.set({
        "prompt": prompt,
        "mode": mode,
        "status": "generating",
        "created_at": datetime.now(),
        "stops": [],
    })
    return journey_id


def update_journey_stops(journey_id: str, stops: list[dict]) -> None:
    """Update the stops array for a journey (progressive — called after each stop)."""
    db = _get_db()
    doc_ref = db.collection("journeys").document(journey_id)
    doc_ref.update({"stops": stops})


def update_journey_status(journey_id: str, status: str) -> None:
    """Update just the status field."""
    db = _get_db()
    doc_ref = db.collection("journeys").document(journey_id)
    doc_ref.update({"status": status})


def get_journey(journey_id: str) -> dict | None:
    """Fetch a journey by ID."""
    db = _get_db()
    doc = db.collection("journeys").document(journey_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return data
