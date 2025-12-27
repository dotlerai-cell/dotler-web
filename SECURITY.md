# Security Checklist

## ✅ Protected Files (Never Commit These)

The following files are protected by `.gitignore`:

- `.env` - Contains Firebase and Meta API credentials
- `.env.local` - Local development overrides
- `.env.production` - Production environment variables
- `ad-acc-insights.pdf` - Contains sensitive account data
- `ad-acc-insights.txt` - Contains sensitive account data
- `.firebase/` - Firebase deployment cache
- `node_modules/` - Dependencies

## 🔐 Environment Variables

### Required Variables
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### For Local Development
Create `.env.local` to override the redirect URI:

```env
VITE_META_REDIRECT_URI=http://localhost:3000/auth/callback
```

### For Production
Update `.env` with your production URL:

```env
VITE_META_REDIRECT_URI=https://your-domain.web.app/auth/callback
```

## ⚠️ Important Security Notes

1. **Never commit `.env` files** - They contain sensitive API keys and secrets
2. **Meta App Secret** - Currently in frontend (DEV ONLY). Move to Cloud Functions for production
3. **Access Tokens** - Currently stored in Firestore unencrypted. Encrypt in production
4. **OAuth Redirect URIs** - Must be whitelisted in Meta App Settings

## 🚀 Before Deploying to Production

- [ ] Move token exchange to Cloud Functions
- [ ] Encrypt access tokens before storing in Firestore
- [ ] Remove `VITE_META_APP_SECRET` from frontend
- [ ] Set up proper CORS policies
- [ ] Enable Firestore security rules
- [ ] Add rate limiting
- [ ] Set up monitoring and alerts

## 📝 Meta App Configuration

Add these redirect URIs to your Meta App:
- Development: `http://localhost:3000/auth/callback`
- Production: `https://meta-ads-f02c6.web.app/auth/callback`

Go to: https://developers.facebook.com/apps/YOUR_APP_ID/settings/basic/
