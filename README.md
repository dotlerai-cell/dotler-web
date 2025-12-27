# AdVantage - Multi-Company Meta Ads Platform

🚀 **AI-Powered platform where companies can connect their Meta Ads accounts, view analytics, and create campaigns.**

Built with React, Vite, Firebase, and Meta Marketing API.

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite
- **Authentication**: Firebase Auth (Email/Password + Google)
- **Hosting**: Firebase Hosting
- **Database**: Firestore (optional)
- **Routing**: React Router v6
- **API**: Meta Marketing API v19.0

## ✨ Features

- 🔐 **Authentication** - Email/Password and Google Sign-In
- 📊 **Real-time Dashboard** - Live Meta Ads metrics
- 🎯 **Campaign Management** - Create and manage campaigns
- 📈 **Analytics** - Performance tracking and insights
- 🤖 **AI Agents** - Multi-agent system monitoring
- 🌓 **Theme Switcher** - Dark/Light mode
- 📱 **Responsive Design** - Works on all devices

## 📋 Prerequisites

- Node.js 16+ and npm
- Firebase account
- Meta Business account with API access

## 🛠️ Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase and Meta credentials (already configured for Firebase).

### 3. Setup Meta OAuth (For Multi-Company Support)

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app (Business type)
3. Add **Facebook Login for Business** and **Marketing API**
4. Add OAuth redirect URI: `http://localhost:3000/auth/callback`
5. Copy App ID to `.env` → `VITE_META_APP_ID`

### 4. Deploy Cloud Functions (Optional - for production)

```bash
cd functions
npm install
firebase deploy --only functions
```

## 🏃 Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default Login:** Use your email or Google account to sign up.

## 🏗️ Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase
```bash
# Deploy everything
firebase deploy

# Or deploy separately
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

Your app will be live at: `https://your-project-id.web.app`

### Before Production
1. Complete Meta App Review
2. Get Advanced Access for permissions
3. Update OAuth redirect URIs
4. Set up monitoring and alerts

## 📁 Project Structure

```
advantage/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── AgentFeed.jsx
│   │   └── PerformanceChart.jsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.jsx  # Authentication context
│   ├── hooks/               # Custom React hooks
│   │   └── useMetaAPI.js    # Meta API integration hook
│   ├── pages/               # Page components
│   │   ├── Login.jsx        # Login/Signup page
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   ├── Analytics.jsx    # Analytics page
│   │   ├── Campaign.jsx     # Campaign creation
│   │   └── Agents.jsx       # Agent monitor
│   ├── services/            # API services
│   │   └── api.js           # Meta Marketing API
│   ├── styles/              # CSS modules
│   ├── firebase.js          # Firebase configuration
│   ├── App.jsx              # Main app component
│   ├── App.css
│   ├── main.jsx             # Entry point
│   └── index.css
├── public/                  # Static assets
├── .env                     # Environment variables (create this)
├── .env.example             # Environment template
├── .gitignore
├── firebase.json            # Firebase hosting config
├── .firebaserc              # Firebase project config
├── vite.config.js           # Vite configuration
├── package.json
└── README.md
```

## 🔐 How Companies Use It

### Step 1: Sign Up
Company users sign up with email/password or Google account.

### Step 2: Connect Meta Account
1. Click "Connect Meta" in sidebar
2. Authorize with their Meta Business account (OAuth)
3. Select ad accounts to connect
4. Tokens stored encrypted server-side

### Step 3: View Analytics
- Real-time campaign metrics
- ROAS tracking
- Spend monitoring
- Performance insights

### Step 4: Create Campaigns
- Fill campaign form
- Set budgets and objectives
- Publish directly to their Meta Ads account

## 🏗️ Architecture

```
Company User → Your Platform → Firebase Auth
                    ↓
            Connect Meta (OAuth)
                    ↓
        Meta Business Account Authorization
                    ↓
    Access Token (encrypted) → Firestore
                    ↓
        Cloud Functions → Meta API
                    ↓
        Analytics & Campaign Management
```

### Security Features
- ✅ OAuth 2.0 authentication
- ✅ Tokens encrypted with AES-256
- ✅ Server-side API proxy (Cloud Functions)
- ✅ Per-company data isolation
- ✅ Firestore security rules enforced

## 🤖 AI Agent System

### Agents
1. **Manager Agent** - Orchestrates decisions
2. **Analyst Agent** - Analyzes performance data
3. **Inventory Agent** - Monitors stock levels
4. **Creative Agent** - Optimizes ad creative

### Features
- Live agent feed
- Real-time decision logging
- Multi-agent coordination
- Automated optimization

## 🎨 Theming

Toggle between dark and light themes:
- Click theme button in header (🌙/☀️)
- Preference saved in localStorage
- Smooth transitions

## 🔧 Configuration

### Vite Config (`vite.config.js`)
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true
  }
})
```

### Firebase Config (`firebase.json`)
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## 🐛 Troubleshooting

### Firebase Auth Issues
- Check Firebase Console → Authentication → Sign-in methods
- Ensure Email/Password and Google are enabled
- Add authorized domains

### Meta API Errors
- Verify access token is valid
- Check ad account ID format: `act_XXXXXXXXXX`
- Ensure token has required permissions

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Deployment Issues
```bash
# Rebuild and redeploy
npm run build
firebase deploy --only hosting
```

## 📝 Scripts

```json
{
  "dev": "vite",                    // Start dev server
  "build": "vite build",            // Build for production
  "preview": "vite preview",        // Preview production build
  "deploy": "npm run build && firebase deploy"  // Build and deploy
}
```

## 🔒 Security

- Never commit `.env` file
- Use environment variables for sensitive data
- Enable Firebase security rules
- Implement rate limiting for API calls

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [React Router](https://reactrouter.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is for educational and demonstration purposes.

## 🆘 Support

For issues and questions:
1. Check browser console for errors
2. Review Firebase console for auth/hosting issues
3. Check network tab for API errors
4. Review SETUP.md for detailed instructions

---

**Built with ❤️ using Vite + React + Firebase**
