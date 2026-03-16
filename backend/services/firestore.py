import uuid
from datetime import datetime
from google.cloud import firestore


def _get_db():
    return firestore.Client()


def create_journey(prompt: str, user_id: str = "", mode: str = "journey") -> str:
    """Create a new journey document, return its ID."""
    db = _get_db()
    journey_id = str(uuid.uuid4())[:8]
    doc_ref = db.collection("journeys").document(journey_id)
    doc_ref.set({
        "prompt": prompt,
        "user_id": user_id,
        "mode": mode,
        "status": "generating",
        "created_at": datetime.now(),
        "stops": [],
        "poster_url": "",
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


def update_journey_poster(journey_id: str, poster_url: str) -> None:
    """Set the travel poster URL."""
    db = _get_db()
    doc_ref = db.collection("journeys").document(journey_id)
    doc_ref.update({"poster_url": poster_url})


def get_journey(journey_id: str) -> dict | None:
    """Fetch a journey by ID."""
    db = _get_db()
    doc = db.collection("journeys").document(journey_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return data


def list_journeys_by_user(user_id: str) -> list[dict]:
    """List all journeys for a user, newest first."""
    db = _get_db()
    # Simple query — filter by user_id only, sort/filter in Python to avoid composite index
    docs = (
        db.collection("journeys")
        .where("user_id", "==", user_id)
        .limit(50)
        .stream()
    )
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        if data.get("status") == "ready":
            results.append(data)
    # Sort by created_at descending
    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results[:20]


def delete_journey(journey_id: str, user_id: str) -> bool:
    """Delete a journey if owned by user."""
    db = _get_db()
    doc = db.collection("journeys").document(journey_id).get()
    if not doc.exists:
        return False
    data = doc.to_dict()
    if data.get("user_id") != user_id:
        return False
    db.collection("journeys").document(journey_id).delete()
    return True
