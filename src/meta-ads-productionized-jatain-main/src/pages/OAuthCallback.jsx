import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { handleOAuthCallback, getUserAdAccounts, exchangeForLongLivedToken } from '../services/metaOAuth'

export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentUser, loading: authLoading } = useAuth()
  const [status, setStatus] = useState('processing')
  const [message, setMessage] = useState('Connecting your Meta account...')

  useEffect(() => {
    // Wait for auth to load before processing
    if (!authLoading && currentUser) {
      processCallback()
    } else if (!authLoading && !currentUser) {
      setStatus('error')
      setMessage('You must be logged in to connect a Meta account')
      setTimeout(() => navigate('/login'), 2000)
    }
  }, [authLoading, currentUser])

  async function processCallback() {
    try {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      if (error) {
        throw new Error(`Authorization failed: ${error}`)
      }

      if (!code) {
        throw new Error('No authorization code received')
      }

      if (!currentUser) {
        throw new Error('You must be logged in to connect a Meta account')
      }

      console.log('🔄 Starting OAuth callback for user:', currentUser.uid)
      setMessage('Exchanging authorization code...')

      // Exchange code for access token (via your backend)
      const tokenData = await handleOAuthCallback(code, state)
      console.log('✅ Got access token')

      setMessage('Getting long-lived token...')

      // Exchange for long-lived token
      const longLivedToken = await exchangeForLongLivedToken(tokenData.access_token)
      console.log('✅ Got long-lived token, expires in:', longLivedToken.expires_in)

      setMessage('Fetching your ad accounts...')

      // Get user's ad accounts
      const adAccounts = await getUserAdAccounts(longLivedToken.access_token)
      console.log('✅ Found ad accounts:', adAccounts.length)

      if (adAccounts.length === 0) {
        throw new Error('No ad accounts found. Please create an ad account in Meta Business Manager.')
      }

      setMessage('Saving account information...')

      // Store each ad account in Firestore
      // WARNING: For development only - storing token client-side
      // In production, tokens MUST be encrypted and stored server-side
      const savedAccounts = []
      for (const account of adAccounts) {
        const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'metaAccounts'), {
          adAccountId: account.id,
          adAccountName: account.name,
          accountStatus: account.account_status,
          currency: account.currency,
          timezone: account.timezone_name,
          businessId: account.business?.id || null,
          businessName: account.business?.name || null,
          // DEV ONLY: Storing token in Firestore (NOT SECURE)
          // Production: Use Cloud Functions to encrypt and store
          accessToken: longLivedToken.access_token,
          tokenExpiry: new Date(Date.now() + (longLivedToken.expires_in || 5184000) * 1000), // 60 days default
          connectedAt: serverTimestamp(),
          lastSync: serverTimestamp()
        })
        savedAccounts.push(docRef.id)
        console.log('✅ Saved account:', account.name, 'with ID:', docRef.id)
      }

      setStatus('success')
      setMessage(`Successfully connected ${adAccounts.length} ad account(s)!`)
      console.log('🎉 OAuth flow complete! Saved accounts:', savedAccounts)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('❌ OAuth callback error:', error)
      setStatus('error')
      setMessage(error.message || 'Failed to connect Meta account')

      // Redirect back after 3 seconds
      setTimeout(() => {
        navigate('/connect-meta')
      }, 3000)
    }
  }

  return (
    <div className="oauth-callback-container">
      <div className="oauth-callback-card">
        {status === 'processing' && (
          <>
            <div className="spinner"></div>
            <h2>Connecting...</h2>
            <p>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✅</div>
            <h2>Success!</h2>
            <p>{message}</p>
            <p className="redirect-message">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">🔗</div>
            <h2>Connecting... </h2>
            <p>{message}</p>
            <p className="redirect-message">Redirecting back...</p>
          </>
        )}
      </div>
    </div>
  )
}
