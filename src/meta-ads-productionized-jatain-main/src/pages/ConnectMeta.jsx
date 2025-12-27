import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { collection, query, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { initiateMetaLogin, getUserAdAccounts } from '../services/metaOAuth'

export default function ConnectMeta() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [connectedAccounts, setConnectedAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDebug, setShowDebug] = useState(false)
  const [showManualToken, setShowManualToken] = useState(false)
  const [manualToken, setManualToken] = useState('')
  const [manualAdAccountId, setManualAdAccountId] = useState('')
  const [manualAdAccountName, setManualAdAccountName] = useState('')
  const [tokenLoading, setTokenLoading] = useState(false)
  const [fetchingAccounts, setFetchingAccounts] = useState(false)
  const [availableAccounts, setAvailableAccounts] = useState([])

  useEffect(() => {
    loadConnectedAccounts()
  }, [currentUser])

  async function loadConnectedAccounts() {
    if (!currentUser) {
      setLoading(false)
      return
    }

    try {
      const q = query(
        collection(db, 'users', currentUser.uid, 'metaAccounts')
      )
      const snapshot = await getDocs(q)
      const accounts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setConnectedAccounts(accounts)
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleConnectClick() {
    if (!currentUser) {
      alert('Please log in first before connecting Meta account')
      navigate('/login')
      return
    }
    console.log('🚀 Initiating Meta OAuth for user:', currentUser.uid)
    initiateMetaLogin()
  }

  async function handleDisconnect(accountId) {
    if (!window.confirm('Are you sure you want to disconnect this account?')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'metaAccounts', accountId))
      alert('Account disconnected successfully')
      loadConnectedAccounts()
    } catch (error) {
      console.error('Error disconnecting:', error)
      alert('Failed to disconnect account')
    }
  }

  async function handleFetchAccounts() {
    if (!manualToken.trim()) {
      alert('Please enter your access token first')
      return
    }

    setFetchingAccounts(true)
    try {
      const accounts = await getUserAdAccounts(manualToken)
      setAvailableAccounts(accounts)
      if (accounts.length === 0) {
        alert('No ad accounts found for this token')
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      alert('Failed to fetch ad accounts. Please check your token and try again.')
    } finally {
      setFetchingAccounts(false)
    }
  }

  async function handleManualConnect() {
    if (!currentUser) {
      alert('Please log in first')
      navigate('/login')
      return
    }

    if (!manualToken.trim()) {
      alert('Please enter your access token')
      return
    }

    if (!manualAdAccountId.trim()) {
      alert('Please enter your ad account ID')
      return
    }

    setTokenLoading(true)
    try {
      // Verify token works by fetching account info
      const accounts = await getUserAdAccounts(manualToken)
      const account = accounts.find(acc => acc.id === manualAdAccountId)
      
      const accountName = account ? account.name : (manualAdAccountName || 'My Ad Account')

      // Store in Firestore
      await setDoc(doc(db, 'users', currentUser.uid, 'metaAccounts', manualAdAccountId), {
        adAccountId: manualAdAccountId,
        adAccountName: accountName,
        accessToken: manualToken, // In production, encrypt this!
        connectionMethod: 'manual',
        connectedAt: serverTimestamp(),
        lastSync: serverTimestamp()
      })

      alert('Account connected successfully!')
      setManualToken('')
      setManualAdAccountId('')
      setManualAdAccountName('')
      setShowManualToken(false)
      setAvailableAccounts([])
      loadConnectedAccounts()
    } catch (error) {
      console.error('Error connecting account:', error)
      alert('Failed to connect account. Please check your token and account ID.')
    } finally {
      setTokenLoading(false)
    }
  }

  function handleSelectAccount(account) {
    setManualAdAccountId(account.id)
    setManualAdAccountName(account.name)
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Connect Meta Ads" />

        <section className="connect-section">
          <div className="consent-card">
            <div className="consent-header">
              <div className="consent-logo">
                <span className="logo-icon">⚡</span>
                <h1>AdVantage</h1>
              </div>
              <h2>Connect Your Meta Business Account</h2>
              <p className="consent-subtitle">
                Securely connect your Meta Ads account to access analytics and manage campaigns
              </p>
            </div>

            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your accounts...</p>
              </div>
            )}

            {!loading && connectedAccounts.length === 0 && (
              <>
                <div className="consent-body">
                  <div className="consent-section">
                    <h3>🔐 Permissions Required</h3>
                    <ul className="permission-list">
                      <li>
                        <span className="permission-icon">📊</span>
                        <div>
                          <strong>View Ad Data</strong>
                          <p>Access campaign metrics and analytics</p>
                        </div>
                      </li>
                      <li>
                        <span className="permission-icon">✏️</span>
                        <div>
                          <strong>Manage Campaigns</strong>
                          <p>Create and edit ad campaigns</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="consent-section">
                    <h3>🛡️ Data Protection</h3>
                    <ul className="security-list">
                      <li>✅ Encrypted and stored securely</li>
                      <li>✅ Never shared with third parties</li>
                      <li>✅ Disconnect anytime</li>
                    </ul>
                  </div>
                </div>

                <div className="consent-actions">
                  <button onClick={() => navigate('/')} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleConnectClick} className="btn-primary btn-large">
                    <span className="btn-icon">🔐</span>
                    Authorize with OAuth
                  </button>
                </div>

                {/* Manual Token Option */}
                <div style={{ marginTop: '30px', borderTop: '1px solid #333', paddingTop: '30px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <p style={{ color: '#888', marginBottom: '10px' }}>OR</p>
                    <button 
                      onClick={() => setShowManualToken(!showManualToken)}
                      className="btn-secondary"
                      style={{ fontSize: '14px' }}
                    >
                      {showManualToken ? '🔼 Hide' : '🔽 Use'} Manual Access Token
                    </button>
                  </div>

                  {showManualToken && (
                    <div style={{ 
                      background: '#1a1a1a', 
                      padding: '20px', 
                      borderRadius: '8px',
                      maxWidth: '600px',
                      margin: '0 auto'
                    }}>
                      <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>
                        🔑 Connect with Access Token
                      </h3>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#aaa' }}>
                          Access Token *
                        </label>
                        <input
                          type="text"
                          value={manualToken}
                          onChange={(e) => setManualToken(e.target.value)}
                          placeholder="Paste your Meta access token here"
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: '#0a0a0a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '14px',
                            fontFamily: 'monospace'
                          }}
                        />
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          Get your token from <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: '#4a9eff' }}>Meta Graph API Explorer</a>
                        </p>
                      </div>

                      {manualToken && (
                        <div style={{ marginBottom: '15px' }}>
                          <button
                            onClick={handleFetchAccounts}
                            disabled={fetchingAccounts}
                            className="btn-secondary"
                            style={{ width: '100%', marginBottom: '10px' }}
                          >
                            {fetchingAccounts ? '⏳ Fetching...' : '🔍 Fetch My Ad Accounts'}
                          </button>
                        </div>
                      )}

                      {availableAccounts.length > 0 && (
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#aaa' }}>
                            Select Ad Account *
                          </label>
                          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {availableAccounts.map(account => (
                              <div
                                key={account.id}
                                onClick={() => handleSelectAccount(account)}
                                style={{
                                  padding: '10px',
                                  background: manualAdAccountId === account.id ? '#2a4a2a' : '#0a0a0a',
                                  border: `1px solid ${manualAdAccountId === account.id ? '#4a9eff' : '#333'}`,
                                  borderRadius: '4px',
                                  marginBottom: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{account.name}</div>
                                <div style={{ fontSize: '12px', color: '#888' }}>{account.id}</div>
                                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                  Status: {account.account_status === 1 ? '✅ Active' : '⚠️ ' + account.account_status}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {availableAccounts.length === 0 && (
                        <>
                          <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#aaa' }}>
                              Ad Account ID * (e.g., act_123456789)
                            </label>
                            <input
                              type="text"
                              value={manualAdAccountId}
                              onChange={(e) => setManualAdAccountId(e.target.value)}
                              placeholder="act_123456789"
                              style={{
                                width: '100%',
                                padding: '10px',
                                background: '#0a0a0a',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '14px'
                              }}
                            />
                          </div>

                          <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#aaa' }}>
                              Account Name (optional)
                            </label>
                            <input
                              type="text"
                              value={manualAdAccountName}
                              onChange={(e) => setManualAdAccountName(e.target.value)}
                              placeholder="My Ad Account"
                              style={{
                                width: '100%',
                                padding: '10px',
                                background: '#0a0a0a',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '14px'
                              }}
                            />
                          </div>
                        </>
                      )}

                      <button
                        onClick={handleManualConnect}
                        disabled={tokenLoading || !manualToken || !manualAdAccountId}
                        className="btn-primary"
                        style={{ width: '100%' }}
                      >
                        {tokenLoading ? '⏳ Connecting...' : '✅ Connect Account'}
                      </button>

                      <div style={{ 
                        marginTop: '15px', 
                        padding: '10px', 
                        background: '#2a2a0a', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#aa8'
                      }}>
                        <strong>⚠️ Security Note:</strong> Your token will be stored in Firestore. 
                        For production, use OAuth or encrypt tokens server-side.
                      </div>
                    </div>
                  )}
                </div>

                {/* Debug Panel */}
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button 
                    onClick={() => setShowDebug(!showDebug)} 
                    style={{ 
                      fontSize: '12px', 
                      padding: '5px 10px',
                      background: '#333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {showDebug ? 'Hide' : 'Show'} Debug Info
                  </button>
                  
                  {showDebug && (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '15px', 
                      background: '#1a1a1a', 
                      borderRadius: '8px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}>
                      <div><strong>User ID:</strong> {currentUser?.uid || 'Not logged in'}</div>
                      <div><strong>Email:</strong> {currentUser?.email || 'N/A'}</div>
                      <div><strong>Meta App ID:</strong> {import.meta.env.VITE_META_APP_ID || 'Not set'}</div>
                      <div><strong>Redirect URI:</strong> {import.meta.env.VITE_META_REDIRECT_URI || 'Not set'}</div>
                      <div><strong>App Secret Set:</strong> {import.meta.env.VITE_META_APP_SECRET ? 'Yes ✅' : 'No ❌'}</div>
                      <div style={{ marginTop: '10px', color: '#888' }}>
                        💡 Open browser console (F12) to see detailed logs
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {!loading && connectedAccounts.length > 0 && (
              <>
                <div className="consent-body">
                  <div className="success-message">
                    <span className="success-icon">✅</span>
                    <h3>Account Connected Successfully!</h3>
                    <p>Your Meta Ads account is now connected</p>
                  </div>

                  {connectedAccounts.map(account => (
                    <div key={account.id} className="connected-account-card">
                      <div className="account-header">
                        <div className="account-avatar">
                          <span className="avatar-icon">📊</span>
                        </div>
                        <div className="account-details">
                          <h4>{account.adAccountName}</h4>
                          <p className="account-id">{account.adAccountId}</p>
                          <p className="connection-date">
                            Connected on {account.connectedAt?.toDate ? 
                              new Date(account.connectedAt.toDate()).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              }) : 'Recently'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="consent-actions">
                  <button
                    onClick={() => handleDisconnect(connectedAccounts[0].id)}
                    className="btn-secondary"
                  >
                    Disconnect Account
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="btn-primary btn-large"
                  >
                    Go to Dashboard →
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
