import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useMetaAPI } from '../hooks/useMetaAPI'
import { useAuth } from '../contexts/AuthContext'

// Connectivity Box Component
function ConnectivityBox({ isConfigured, connectedAccount, navigate }) {
  return (
    <div className="dashboard-box connectivity-box">
      <h3>🔗 Facebook Connectivity</h3>
      <div className="box-content">
        {!isConfigured() ? (
          <>
            <div className="alert alert-warning">
              <p>⚠️ Meta Ads Account Not Connected</p>
              <p>Connect your Meta Ads account to view real-time performance data.</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/connect-meta')}
            >
              Connect Meta Account
            </button>
          </>
        ) : (
          <>
            <div className="alert alert-success">
              <p>✅ Connected to: <strong>{connectedAccount?.adAccountName || 'Meta Account'}</strong></p>
              <p className="text-small">Account ID: {connectedAccount?.adAccountId || 'N/A'}</p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/connect-meta')}
            >
              Manage Connection
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Analytics Box Component
function AnalyticsBox({ data, loading, error, refreshData, dateRange, setDateRange }) {
  const metaData = data?.meta || {}

  const formatCurrency = (value) => {
    const currency = metaData.accountCurrency || 'USD'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0)
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0)
  }

  return (
    <div className="dashboard-box analytics-box">
      <h3>📊 Analytics Overview</h3>
      <div className="box-content">
        <div className="analytics-controls">
          <div className="filter-group">
            <label>Time Range:</label>
            <select
              className="filter-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="last7Days">Last 7 Days</option>
              <option value="last30Days">Last 30 Days</option>
            </select>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => refreshData(dateRange)}
            disabled={loading}
          >
            {loading ? '⟳ Refreshing...' : '↻ Refresh Data'}
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <p>❌ Error: {error}</p>
          </div>
        )}

        <div className="key-metrics">
          <div className="metric-item">
            <span className="metric-label">Total Spend</span>
            <span className="metric-value">{formatCurrency(metaData.spend)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">ROAS</span>
            <span className="metric-value">{(metaData.roas || 0).toFixed(2)}x</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Conversions</span>
            <span className="metric-value">{formatNumber(metaData.conversions)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Conversion Value</span>
            <span className="metric-value">{formatCurrency(metaData.conversionValue)}</span>
          </div>
        </div>

        <button
          className="btn btn-link"
          onClick={() => window.location.href = '/analytics'}
        >
          View Full Analytics →
        </button>
      </div>
    </div>
  )
}

// Campaign Creation Box Component
function CampaignBox({ navigate }) {
  return (
    <div className="dashboard-box campaign-box">
      <h3>🚀 Create Campaign</h3>
      <div className="box-content">
        <p>Launch new advertising campaigns with AI-powered optimization.</p>

        <div className="campaign-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/campaign')}
          >
            Create New Campaign
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/analytics')}
          >
            View Existing Campaigns
          </button>
        </div>

        <div className="quick-stats">
          <div className="quick-stat">
            <span className="stat-label">Quick Launch</span>
            <span className="stat-value">📋 Templates Available</span>
          </div>
          <div className="quick-stat">
            <span className="stat-label">AI Optimization</span>
            <span className="stat-value">✨ Smart Bidding</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, error, refreshData, isConfigured, connectedAccount } = useMetaAPI()
  const [dateRange, setDateRange] = useState('last7Days')
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Initial data fetch
  useEffect(() => {
    if (isConfigured()) {
      refreshData(dateRange)
    }
  }, [dateRange, isConfigured])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh || !isConfigured()) return

    const interval = setInterval(() => {
      refreshData(dateRange)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, dateRange, isConfigured, refreshData])

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Dashboard Overview" />

        {/* Dashboard Controls */}
        <section className="dashboard-controls">
          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                disabled={!isConfigured()}
              />
              Auto-refresh (5 min)
            </label>
          </div>
        </section>

        {/* Three Box Layout */}
        <div className="dashboard-boxes">
          <ConnectivityBox
            isConfigured={isConfigured}
            connectedAccount={connectedAccount}
            navigate={navigate}
          />

          <AnalyticsBox
            data={data}
            loading={loading}
            error={error}
            refreshData={refreshData}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />

          <CampaignBox
            navigate={navigate}
          />
        </div>

        {/* Campaign Summary */}
        {data?.meta?.campaigns && data.meta.campaigns.length > 0 && (
          <section className="section-card">
            <h2>Active Campaigns ({data.meta.campaigns.length})</h2>
            <div className="campaigns-list">
              {data.meta.campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="campaign-item">
                  <div className="campaign-info">
                    <h4>{campaign.name}</h4>
                    <p className="text-small">{campaign.objective}</p>
                  </div>
                  <span className={`badge ${campaign.status === 'ACTIVE' ? 'active' : 'paused'}`}>
                    {campaign.status}
                  </span>
                </div>
              ))}
            </div>
            <button
              className="btn btn-link"
              onClick={() => navigate('/analytics')}
            >
              View All Campaigns →
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
