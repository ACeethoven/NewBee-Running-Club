#!/bin/bash
# Setup CORS for Firebase Storage

# Install Google Cloud SDK (if not installed)
# For Mac:
# brew install google-cloud-sdk

# Login to Google Cloud (will open browser)
gcloud auth login

# Set the project
gcloud config set project newbee-running-club-website

# Apply CORS configuration
gsutil cors set cors.json gs://newbee-running-club-website.appspot.com

# Verify CORS
gsutil cors get gs://newbee-running-club-website.appspot.com

echo "CORS configuration complete!"
