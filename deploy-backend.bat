@echo off
echo Deploying Google Ads Backend...

cd src\GoogleAdsConsentManagement\backend

echo Setting up Google Cloud project...
gcloud config set project dotler-web

echo Building and deploying to Cloud Run...
gcloud run deploy google-ads-backend ^
  --source . ^
  --region us-central1 ^
  --allow-unauthenticated ^
  --memory 2Gi ^
  --cpu 2 ^
  --timeout 300 ^
  --max-instances 10 ^
  --set-env-vars GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID% ^
  --set-env-vars GOOGLE_CLIENT_SECRET=%GOOGLE_CLIENT_SECRET% ^
  --set-env-vars GOOGLE_REDIRECT_URI=https://dotler-web.web.app/oauth2/callback ^
  --set-env-vars GOOGLE_ADS_REDIRECT_URI=https://dotler-web.web.app/src/GoogleAdsConsentManagement/oauth-callback.html ^
  --set-env-vars FRONTEND_URL=https://dotler-web.web.app ^
  --set-env-vars GEMINI_API_KEY=%GEMINI_API_KEY% ^
  --set-env-vars MONGO_URI=%MONGO_URI%

echo Backend deployed successfully!
cd ..\..\..