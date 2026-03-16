import base64
import uuid
from google.cloud import storage as gcs

from config import GCS_BUCKET_NAME


def _get_bucket():
    client = gcs.Client()
    return client.bucket(GCS_BUCKET_NAME)


def upload_image_from_base64(data: str, prefix: str = "images") -> str:
    """Upload base64-encoded image to GCS, return public URL."""
    bucket = _get_bucket()
    filename = f"{prefix}/{uuid.uuid4()}.png"
    blob = bucket.blob(filename)
    blob.upload_from_string(base64.b64decode(data), content_type="image/png")
    # Public URL via bucket-level IAM (allUsers:objectViewer), not object ACLs
    return f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{filename}"


def upload_video(video_bytes: bytes, prefix: str = "videos") -> str:
    """Upload video bytes to GCS, return public URL."""
    bucket = _get_bucket()
    filename = f"{prefix}/{uuid.uuid4()}.mp4"
    blob = bucket.blob(filename)
    blob.upload_from_string(video_bytes, content_type="video/mp4")
    return f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{filename}"


def upload_audio(audio_bytes: bytes, prefix: str = "audio") -> str:
    """Upload audio bytes to GCS, return public URL."""
    bucket = _get_bucket()
    filename = f"{prefix}/{uuid.uuid4()}.mp3"
    blob = bucket.blob(filename)
    blob.upload_from_string(audio_bytes, content_type="audio/mpeg")
    return f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{filename}"
