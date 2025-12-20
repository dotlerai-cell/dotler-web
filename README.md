# Dotler.ai - AI-Powered Ad Automation Platform

A modern, full-stack web application for automating ad campaigns across multiple platforms including WhatsApp, Instagram, Google Ads, and Meta Ads.

## Features

- **Firebase Authentication**: Secure login with Google OAuth and email/password
- **Modern Dashboard**: Clean, intuitive interface with real-time metrics
- **Dark/Light Theme**: Toggle between themes with persistent preferences
- **Collapsible Sidebar**: Space-efficient navigation with smooth animations
- **Four Core Modules**:
  - WhatsApp Automation
  - Instagram Automation
  - Google Ads Management
  - Meta Ads Management
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Analytics**: Interactive charts and performance metrics

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Authentication**: Firebase Auth
- **Backend**: Node.js (ready for integration)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project with authentication enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dotler
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your Firebase configuration
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## Project Structure

```
dotler/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── PrivateRoute.tsx
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── pages/           # Page components
│   │   ├── Login.tsx
│   │   └── Dashboard.tsx
│   ├── config/          # Configuration files
│   │   └── firebase.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Firebase Configuration

Firebase credentials are stored securely in environment variables. To set up:

1. Create a `.env` file in the root directory (use `.env.example` as template)
2. Add your Firebase project credentials to the `.env` file
3. Make sure your Firebase project has:
   - Authentication enabled (Google and Email/Password providers)
   - Authorized domains configured for your deployment

**Important**: Never commit the `.env` file to version control. It's already included in `.gitignore`.

## Features in Development

- WhatsApp automation workflows
- Instagram post scheduling and analytics
- Google Ads campaign optimization
- Meta Ads creative management
- A/B testing studio
- Advanced analytics dashboard
- Budget allocation AI
- Creative studio with AI-generated copy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary and confidential.