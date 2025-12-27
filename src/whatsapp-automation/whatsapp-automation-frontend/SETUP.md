# WhatsApp Admin Frontend - Quick Setup Guide

## Overview

This is a React/TypeScript port of the Flutter-based WhatsApp admin panel. It provides complete admin functionality for managing WhatsApp automation, including user management, campaign broadcasting, analytics, and AI-powered complaint insights.

## Folder Structure

```
whatsapp-automation-frontend/
├── config/
│   └── config.ts                 # Environment configuration
├── pages/
│   ├── AdminPage.tsx             # Main admin dashboard with sidebar
│   ├── AdminLoginPage.tsx        # Login page
│   ├── DashboardAnalyticsView.tsx # Analytics and complaints overview
│   ├── RecentComplaintsView.tsx  # Complaint feed
│   ├── IntentStatsView.tsx       # Intent analysis
│   ├── UsersManagementView.tsx   # User management
│   └── CampaignsView.tsx         # Broadcasting campaigns
├── services/
│   └── apiService.ts             # API communication service
├── types/
│   └── index.ts                  # TypeScript types and interfaces
├── .env                          # Environment variables
└── index.ts                      # Main export file
```

## Features

### 1. **Admin Login**

- Username/password authentication
- JWT token storage and management
- Secure API communication

### 2. **Dashboard Analytics**

- Total complaints count
- Weekly complaint trends
- ML confidence metrics
- Top issues breakdown
- Repeat customer tracking

### 3. **Recent Complaints**

- Real-time complaint feed
- Confidence level indicators
- Customer classification
- Timestamp tracking
- Detailed complaint metadata

### 4. **Intent Stats**

- ML accuracy metrics
- Intent distribution pie chart
- Total messages analyzed
- Average confidence scores
- Intent breakdown by category

### 5. **User Management**

- Add new users with phone and name
- View all registered users
- User list with timestamps
- Phone number validation

### 6. **Campaign Broadcasting**

- Send messages to selected users
- Bulk user selection
- Campaign history tracking
- Message delivery confirmation
- Recipient count display

## Configuration

### Environment Variables (.env)

```env
# Environment
VITE_WA_ENVIRONMENT=development

# API Configuration
VITE_WA_API_KEY=aurora-beauty-dev-key-2025
VITE_WA_API_BASE_URL=http://localhost:8000

# Production (uncomment for production)
# VITE_WA_ENVIRONMENT=production
# VITE_WA_API_KEY=aurora-beauty-prod-key-2025
# VITE_WA_API_BASE_URL=https://34-58-246-94.sslip.io
```

### API Service Configuration

The API service automatically:

- Loads configuration from environment variables
- Manages authentication tokens
- Stores tokens in localStorage for persistence
- Handles all HTTP requests with proper headers

## API Endpoints

All endpoints require:

- `X-API-Key` header (API key from config)
- `Authorization: Bearer {token}` header (for authenticated endpoints)

### Authentication

- `POST /admin/login` - Admin login
- Returns JWT token for subsequent requests

### Users

- `GET /admin/users` - Get all registered users
- `POST /admin/add-user` - Add new user

### Broadcasting

- `POST /admin/broadcast-selected` - Send message to selected users
- `GET /admin/broadcast-history?limit=100` - Get campaign history

### Analytics

- `GET /admin/complaints/analytics` - Get complaint analytics
- `GET /admin/complaints/recent?limit=20` - Get recent complaints
- `GET /admin/intent/stats` - Get intent statistics

## Component Hierarchy

```
AdminPage (Main Container)
├── AdminLoginPage (if not authenticated)
└── Dashboard Layout
    ├── Sidebar (Navigation)
    │   ├── Overview
    │   ├── Analytics
    │   ├── Complaints
    │   ├── Intent Stats
    │   ├── Users
    │   └── Campaigns
    ├── Header
    └── Content Area
        ├── OverviewSection
        ├── DashboardAnalyticsView
        ├── RecentComplaintsView
        ├── IntentStatsView
        ├── UsersManagementView
        └── CampaignsView
```

## Styling & Theme

- **Color Scheme**: Dark mode matching dotler-web design
- **Primary Color**: Red (#ec1313)
- **Background**: Pure black (#000000)
- **Accent**: Gray gradients for secondary elements
- **Components**: Uses Lucide icons and Recharts for visualizations

## Key Features Implementation

### Token Management

- Stored in localStorage for persistence
- Automatically restored on page reload
- Cleared on logout

### Error Handling

- API exceptions with user-friendly messages
- Rate limiting support
- Network error handling
- Toast notifications for user feedback

### Responsive Design

- Mobile-friendly sidebar
- Toggle menu for small screens
- Responsive grid layouts
- Touch-friendly buttons

## Integration with dotler-web

The admin panel is integrated into the Dashboard component:

```tsx
// In Dashboard.tsx
if (featureId === "whatsapp") {
  return <AdminPage />;
}
```

When users click "WhatsApp Automation" on the dashboard, they see:

1. Login page if not authenticated
2. Admin dashboard with full functionality after login

## API Service Methods

```typescript
// Authentication
apiService.adminLogin(username: string, password: string)
apiService.logout()
apiService.initializeWithToken()

// Users
apiService.getAllUsers(): Promise<User[]>
apiService.addUser(phone: string, name: string): Promise<User>

// Broadcasting
apiService.sendBroadcastSelected(message: string, phones: string[]): Promise<BroadcastResponse>
apiService.getBroadcastHistory(limit: number): Promise<Campaign[]>

// Analytics
apiService.getComplaintAnalytics(): Promise<ComplaintAnalyticsData>
apiService.getRecentComplaints(limit: number): Promise<{ complaints: Complaint[] }>
apiService.getIntentStats(): Promise<IntentStatsData>
```

## Development Notes

- Uses React hooks (useState, useEffect) for state management
- Fetch API for HTTP requests
- Tailwind CSS for styling
- Recharts for data visualization
- Lucide React for icons

## Future Enhancements

- Redux/Context API for global state management
- WebSocket support for real-time updates
- File upload for CSV bulk user import
- Advanced filtering and search
- Export analytics to PDF
- Message templates
- Scheduled campaigns
- Two-factor authentication (2FA)

## Troubleshooting

### Login not working?

- Check API key in .env file
- Verify backend is running
- Check CORS configuration

### Data not loading?

- Verify API token is stored in localStorage
- Check network tab for API errors
- Verify backend endpoints are accessible

### Styling issues?

- Ensure Tailwind CSS is properly configured in dotler-web
- Check primary color definition in tailwind.config.js
