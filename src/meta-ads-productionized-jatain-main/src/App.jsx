import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Campaign from './pages/Campaign'
import ConnectMeta from './pages/ConnectMeta'
import OAuthCallback from './pages/OAuthCallback'
import DocumentUploaderDemo from './pages/DocumentUploaderDemo'
import WebsiteInputDemo from './pages/WebsiteInputDemo'
import AdditionalInfoInputDemo from './pages/AdditionalInfoInputDemo'
import ChatInterfaceDemo from './pages/ChatInterfaceDemo'
import AIAssistantPanelDemo from './pages/AIAssistantPanelDemo'
import CampaignFormDemo from './pages/CampaignFormDemo'
import DraftManagerDemo from './pages/DraftManagerDemo'
import CampaignGenerator from './pages/CampaignGenerator'
import AgenticWorkflowDashboard from './pages/AgenticWorkflowDashboard'
import './App.css'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }
  
  return currentUser ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaign"
            element={
              <ProtectedRoute>
                <Campaign />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connect-meta"
            element={
              <ProtectedRoute>
                <ConnectMeta />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth/callback"
            element={
              <ProtectedRoute>
                <OAuthCallback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/document-uploader-demo"
            element={
              <ProtectedRoute>
                <DocumentUploaderDemo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/website-input-demo"
            element={
              <ProtectedRoute>
                <WebsiteInputDemo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/additional-info-input-demo"
            element={
              <ProtectedRoute>
                <AdditionalInfoInputDemo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat-interface-demo"
            element={
              <ProtectedRoute>
                <ChatInterfaceDemo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-assistant-panel-demo"
            element={
              <ProtectedRoute>
                <AIAssistantPanelDemo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaign-form-demo"
            element={
              <ProtectedRoute>
                <CampaignFormDemo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/draft-manager-demo"
            element={
              <ProtectedRoute>
                <DraftManagerDemo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaign-generator"
            element={
              <ProtectedRoute>
                <CampaignGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agentic-workflow"
            element={
              <ProtectedRoute>
                <AgenticWorkflowDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
