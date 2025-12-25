# 🚀 Adnalytics - Setup Guide

Complete setup instructions for deploying Adnalytics on your own infrastructure.

## 📋 Prerequisites

- **Python 3.11+**
- **Node.js 16+** (for Firebase CLI)
- **Google Cloud Account** (with billing enabled)
- **Firebase Account**
- **MongoDB Atlas Account** (free tier works)
- **Google Ads Account** with Developer Token
- **Google Gemini API Keys** (2 keys)

## 🔧 Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd GoogleAdsConsentManagement
```

## 🗄️ Step 2: MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

## 🔑 Step 3: Google Cloud Setup

### OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Ads API**
4. Go to **APIs & Services → Credentials**
5. Create **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-backend-url.run.app/oauth2/callback`
6. Save `Client ID` and `Client Secret`

### Google Ads Developer Token

1. Go to [Google Ads](https://ads.google.com)
2. Click **Tools & Settings → API Center**
3. Request Developer Token (approval takes 24-48 hours)
4. For testing, use test account token

## 🤖 Step 4: Gemini API Keys

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create **2 API keys**:
   - Key 1: For setup agent (gemini-2.0-flash-exp)
   - Key 2: For campaign creation (gemini-2.5-flash)

## ⚙️ Step 5: Backend Configuration

### Create `.env` file

```bash
cd backend
cp .env.example .env
```

### Edit `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-backend-url.run.app/oauth2/callback
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
MONGO_DB=trackerdb
MONGO_COLLECTION=tracking_events
GEMINI_API_KEY=your-gemini-api-key-for-campaigns
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_URL=https://your-frontend-url.web.app
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Test Locally

```bash
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/health` to verify.

## ☁️ Step 6: Deploy Backend to Google Cloud Run

```bash
cd backend

gcloud run deploy google-ads-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300s \
  --set-env-vars="GOOGLE_CLIENT_ID=your-client-id,GOOGLE_CLIENT_SECRET=your-secret,GOOGLE_REDIRECT_URI=https://your-backend.run.app/oauth2/callback,MONGO_URI=your-mongo-uri,MONGO_DB=trackerdb,MONGO_COLLECTION=tracking_events,GEMINI_API_KEY=your-key,GEMINI_MODEL=gemini-2.5-flash,FRONTEND_URL=https://your-frontend.web.app"
```

**Note the deployed URL** (e.g., `https://google-ads-backend-xxx.us-central1.run.app`)

## 🔥 Step 7: Firebase Setup

### Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Initialize Firebase

```bash
firebase init hosting
```

- Select your Firebase project
- Public directory: `frontend`
- Single-page app: Yes
- Don't overwrite `index.html`

### Update Backend URL in Frontend

Edit `frontend/index.html` and update:

```javascript
const BACKEND_BASE = 'https://your-actual-backend-url.run.app';
```

### Deploy Frontend

```bash
cd frontend
firebase deploy --only hosting
```

**Note the deployed URL** (e.g., `https://your-project.web.app`)

## 🔄 Step 8: Update OAuth Redirect URI

1. Go back to Google Cloud Console
2. **APIs & Services → Credentials**
3. Edit your OAuth 2.0 Client
4. Update **Authorized redirect URIs** to match your actual backend URL:
   ```
   https://google-ads-backend-xxx.us-central1.run.app/oauth2/callback
   ```

## ✅ Step 9: Verify Setup

1. Visit your frontend URL
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Chat with AI assistant to complete setup
5. View your campaigns in dashboard

## 🧪 Testing

### Test Backend Health

```bash
curl https://your-backend-url.run.app/health
```

Expected response:
```json
{"status": "ok", "mongodb": "connected"}
```

### Test Frontend

1. Open browser DevTools (F12)
2. Check Console for errors
3. Verify network requests to backend succeed

## 🐛 Troubleshooting

### "MongoDB not connected"
- Check `MONGO_URI` is correct
- Verify IP whitelist in MongoDB Atlas
- Check database user permissions

### "OAuth error"
- Verify `GOOGLE_REDIRECT_URI` matches exactly
- Check OAuth consent screen is configured
- Ensure redirect URI is added to Google Cloud Console

### "Developer token invalid"
- Request token from Google Ads API Center
- Use test account token for development
- Wait for approval (24-48 hours)

### "Gemini API error"
- Verify API key is valid
- Check quota limits (free tier: 15 requests/min)
- Ensure correct model name

## 🔒 Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use environment variables** for all secrets
3. **Enable HTTPS** on all endpoints
4. **Rotate API keys** regularly
5. **Monitor usage** in Google Cloud Console

## 📊 Monitoring

### Backend Logs

```bash
gcloud run logs read google-ads-backend --region us-central1 --limit 50
```

### Frontend Logs

Check Firebase Console → Hosting → Usage

### MongoDB Metrics

Check MongoDB Atlas → Metrics tab

## 🔄 Updates & Redeployment

### Update Backend

```bash
cd backend
# Make changes
gcloud run deploy google-ads-backend --source . --region us-central1
```

### Update Frontend

```bash
cd frontend
# Make changes to index.html
firebase deploy --only hosting
```

## 📚 Additional Resources

- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/start)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Google Gemini API](https://ai.google.dev/)

## 💡 Tips

- Use **test accounts** for development
- Start with **small budgets** when testing campaigns
- Monitor **API quotas** to avoid rate limits
- Keep **backups** of your MongoDB data
- Use **staging environment** before production

---

**Need help?** Open an issue on GitHub or check the troubleshooting section above.
