import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "")
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "first-bite-media")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Gemini model IDs
STORYTELLER_MODEL = "gemini-3.1-flash-image-preview"
CHEF_MODEL = "gemini-3.1-flash-image-preview"
NARRATOR_MODEL = "gemini-2.5-flash-preview-tts"
ORCHESTRATOR_MODEL = "gemini-3.1-pro-preview"
