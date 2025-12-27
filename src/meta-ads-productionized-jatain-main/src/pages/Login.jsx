import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleGoogleLogin() {
    try {
      setError('')
      setLoading(true)
      await loginWithGoogle()
      navigate('/')
    } catch (error) {
      console.error('Google login error:', error)
      setError(error.message || 'Failed to login with Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo">
            <span className="brand-icon">⚡</span>
            <h1 className="brand-name">AdVantage</h1>
          </div>
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-description">
            Sign in with Google to manage your Meta Ads
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button onClick={handleGoogleLogin} className="btn-google" disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <div className="login-info">
          <p>🔒 Secure authentication via Google OAuth</p>
          <p>✅ No password required</p>
          <p>📧 Uses your Google account email</p>
        </div>
      </div>
    </div>
  )
}
