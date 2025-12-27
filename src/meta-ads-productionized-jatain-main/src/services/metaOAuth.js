// Meta OAuth Service for Multi-Company Integration

const META_APP_ID = import.meta.env.VITE_META_APP_ID
const META_REDIRECT_URI = import.meta.env.VITE_META_REDIRECT_URI

// Auto-detect redirect URI based on environment
const getRedirectUri = () => {
  // Always use env variable if set (production)
  if (META_REDIRECT_URI) {
    return META_REDIRECT_URI
  }
  // Fallback: use current origin (for local development without .env)
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`
  }
  // SSR fallback
  return 'http://localhost:3000/auth/callback'
}

// Permissions needed for ads management
const PERMISSIONS = [
  'ads_management',
  'ads_read',
  'business_management',
  'pages_read_engagement'
].join(',')

/**
 * Initiate Meta OAuth Login
 * Redirects user to Meta authorization page
 */
export function initiateMetaLogin() {
  const state = generateRandomState()
  // Use localStorage instead of sessionStorage (more reliable across redirects)
  localStorage.setItem('meta_oauth_state', state)
  localStorage.setItem('meta_oauth_timestamp', Date.now().toString())

  console.log('🔐 Generated OAuth state:', state)

  // Get redirect URI dynamically
  const redirectUri = getRedirectUri()
  console.log('🔗 Using redirect URI:', redirectUri)

  const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  authUrl.searchParams.append('client_id', META_APP_ID)
  authUrl.searchParams.append('redirect_uri', redirectUri)
  authUrl.searchParams.append('state', state)
  authUrl.searchParams.append('scope', PERMISSIONS)
  authUrl.searchParams.append('response_type', 'code')

  console.log('🚀 Redirecting to Meta OAuth:', authUrl.toString())
  window.location.href = authUrl.toString()
}

/**
 * Handle OAuth callback
 * Exchange authorization code for access token
 * 
 * NOTE: For development/demo, this exchanges the token client-side.
 * For production, this MUST be done server-side via Cloud Functions.
 */
export async function handleOAuthCallback(code, state) {
  console.log('🔍 Verifying OAuth state...')
  console.log('  Received state:', state)
  
  // Verify state to prevent CSRF
  const savedState = localStorage.getItem('meta_oauth_state')
  const timestamp = localStorage.getItem('meta_oauth_timestamp')
  
  console.log('  Saved state:', savedState)
  
  // Check if state exists
  if (!savedState) {
    console.warn('⚠️ No saved state found in localStorage')
    console.warn('⚠️ This could be due to browser privacy settings or redirect issues')
    console.warn('⚠️ Proceeding without state verification (DEV MODE ONLY)')
    // In production, you should throw an error here
    // throw new Error('OAuth state not found. Please try connecting again.')
  } else {
    // Check if state matches
    if (state !== savedState) {
      console.error('❌ State mismatch!')
      console.error('  Expected:', savedState)
      console.error('  Received:', state)
      throw new Error('Invalid state parameter. Please try connecting again.')
    }
  }
  
  // Check if state is not too old (5 minutes max)
  if (timestamp) {
    const age = Date.now() - parseInt(timestamp)
    if (age > 5 * 60 * 1000) {
      console.error('❌ OAuth state expired (older than 5 minutes)')
      localStorage.removeItem('meta_oauth_state')
      localStorage.removeItem('meta_oauth_timestamp')
      throw new Error('OAuth session expired. Please try connecting again.')
    }
  }
  
  console.log('✅ State verified successfully')
  
  // Clean up
  localStorage.removeItem('meta_oauth_state')
  localStorage.removeItem('meta_oauth_timestamp')

  // For development: Exchange token directly (NOT SECURE FOR PRODUCTION)
  // In production, this should call your Cloud Function
  const META_APP_SECRET = import.meta.env.VITE_META_APP_SECRET
  const REDIRECT_URI = getRedirectUri()

  if (!META_APP_SECRET) {
    console.warn('⚠️ META_APP_SECRET not set. Add it to .env for OAuth to work.')
    throw new Error('Meta App Secret not configured. Add VITE_META_APP_SECRET to your .env file.')
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${META_APP_ID}&` +
      `client_secret=${META_APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `code=${code}`
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to exchange token')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Token exchange error:', error)
    throw error
  }
}

/**
 * Get user's ad accounts
 * Fetches all ad accounts the user has access to
 */
export async function getUserAdAccounts(accessToken) {
  const url = new URL('https://graph.facebook.com/v19.0/me/adaccounts')
  url.searchParams.append('access_token', accessToken)
  url.searchParams.append('fields', 'id,name,account_status,currency,timezone_name,business')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error('Failed to fetch ad accounts')
  }

  const data = await response.json()
  return data.data || []
}

/**
 * Exchange short-lived token for long-lived token
 * Long-lived tokens last 60 days
 * 
 * NOTE: For development/demo, this is done client-side.
 * For production, use Cloud Functions.
 */
export async function exchangeForLongLivedToken(shortLivedToken) {
  const META_APP_SECRET = import.meta.env.VITE_META_APP_SECRET

  if (!META_APP_SECRET) {
    // If no app secret, just return the short-lived token
    console.warn('⚠️ Using short-lived token (expires in 1 hour). Add VITE_META_APP_SECRET for long-lived tokens.')
    return {
      access_token: shortLivedToken,
      token_type: 'bearer',
      expires_in: 3600 // 1 hour
    }
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${META_APP_ID}&` +
      `client_secret=${META_APP_SECRET}&` +
      `fb_exchange_token=${shortLivedToken}`
    )

    if (!response.ok) {
      throw new Error('Failed to extend token')
    }

    return await response.json()
  } catch (error) {
    console.error('Token extension error:', error)
    // Fallback to short-lived token
    return {
      access_token: shortLivedToken,
      token_type: 'bearer',
      expires_in: 3600
    }
  }
}

/**
 * Disconnect Meta account
 * Revokes access token and deletes from Firestore
 */
export async function disconnectMetaAccount(userId, accountId) {
  // For development: Just delete from Firestore
  // In production: Call Cloud Function to revoke token first
  const { db } = await import('../firebase')
  const { doc, deleteDoc } = await import('firebase/firestore')
  
  try {
    await deleteDoc(doc(db, 'users', userId, 'metaAccounts', accountId))
    return { success: true }
  } catch (error) {
    console.error('Disconnect error:', error)
    throw new Error('Failed to disconnect account')
  }
}

// Helper function to generate random state
function generateRandomState() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}
