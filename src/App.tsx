import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pricing from './pages/Pricing'
import Privacy from './pages/Privacy'
import About from './pages/About'
import AuthCallback from './pages/AuthCallback'
import PrivateRoute from './components/PrivateRoute'

// Import the new module
import InstagramLayout from './modules/instagram/InstagramLayout'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            
            {/* Main Dashboard Route */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* New Instagram Module Route */}
            {/* The "/*" allows the InstagramLayout to handle sub-paths like /create or /schedule */}
            <Route
              path="/instagram/*"
              element={
                <PrivateRoute>
                  <InstagramLayout />
                </PrivateRoute>
              }
            />

          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App