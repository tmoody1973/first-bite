#!/bin/bash
# First Bite — Automated Cloud Deployment Script
# Infrastructure-as-code for Google Cloud Run + Vercel
# Gemini Live Agent Challenge 2026

set -e

echo "=== First Bite — Automated Cloud Deployment ==="
echo ""

# ─── Configuration ────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:-gen-lang-client-0506418938}"
REGION="us-central1"
SERVICE_NAME="first-bite-api"
BUCKET_NAME="${GCS_BUCKET_NAME:-first-bite-media}"

# Check required env vars
if [ -z "$GOOGLE_API_KEY" ]; then
  echo "ERROR: GOOGLE_API_KEY is not set"
  exit 1
fi

if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
  echo "ERROR: GOOGLE_MAPS_API_KEY is not set"
  exit 1
fi

echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "Bucket: $BUCKET_NAME"
echo ""

# ─── Step 1: Enable GCP APIs ─────────────────────────────────
echo ">>> Step 1: Enabling Google Cloud APIs..."
gcloud config set project "$PROJECT_ID" --quiet
gcloud services enable \
  firestore.googleapis.com \
  storage.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  generativelanguage.googleapis.com \
  places-backend.googleapis.com \
  --quiet
echo "    APIs enabled."

# ─── Step 2: Create Firestore database ───────────────────────
echo ">>> Step 2: Setting up Firestore..."
gcloud firestore databases create \
  --location="$REGION" \
  --quiet 2>/dev/null || echo "    Firestore already exists."

# ─── Step 3: Create Cloud Storage bucket ─────────────────────
echo ">>> Step 3: Setting up Cloud Storage..."
gsutil mb -l "$REGION" "gs://$BUCKET_NAME" 2>/dev/null || echo "    Bucket already exists."
gsutil iam ch allUsers:objectViewer "gs://$BUCKET_NAME" 2>/dev/null || true
echo "    Bucket configured with public read access."

# ─── Step 4: Deploy backend to Cloud Run ─────────────────────
echo ">>> Step 4: Deploying backend to Cloud Run..."
cd backend
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_API_KEY=$GOOGLE_API_KEY,GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY,GCP_PROJECT_ID=$PROJECT_ID,GCS_BUCKET_NAME=$BUCKET_NAME" \
  --memory 2Gi \
  --timeout 600 \
  --quiet

BACKEND_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --format "value(status.url)")
echo "    Backend deployed: $BACKEND_URL"
cd ..

# ─── Step 5: Verify backend health ───────────────────────────
echo ">>> Step 5: Verifying backend health..."
HEALTH=$(curl -s "$BACKEND_URL/health")
if echo "$HEALTH" | grep -q '"ok"'; then
  echo "    Backend healthy: $HEALTH"
else
  echo "    WARNING: Health check returned: $HEALTH"
fi

# ─── Step 6: Deploy frontend to Vercel ───────────────────────
echo ">>> Step 6: Deploying frontend to Vercel..."
cd frontend

# Set environment variables
vercel env rm NEXT_PUBLIC_API_URL production --yes 2>/dev/null || true
printf "%s" "$BACKEND_URL" | vercel env add NEXT_PUBLIC_API_URL production --yes 2>/dev/null

# Deploy
vercel --prod --yes
cd ..

echo ""
echo "=== Deployment Complete ==="
echo "Backend:  $BACKEND_URL"
echo "Frontend: https://first-bite.vercel.app"
echo "Health:   $BACKEND_URL/health"
echo ""
echo "Google Cloud services used:"
echo "  - Cloud Run (backend hosting)"
echo "  - Firestore (journey persistence)"
echo "  - Cloud Storage (images, audio, video)"
echo "  - Gemini 3.1 Flash Image (interleaved text+image)"
echo "  - Gemini 2.5 Flash TTS (narration)"
echo "  - Veo 3.1 (journey video)"
echo "  - Google Places API (restaurant verification)"
echo "  - Street View Static API (location imagery)"
echo "  - Google Search Grounding (fact verification)"
