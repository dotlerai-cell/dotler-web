import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useMetaAPI } from '../hooks/useMetaAPI'

export default function Analytics() {
  const { data, loading, refreshData } = useMetaAPI()
  const [dateRange, setDateRange] = useState('today')
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    refreshData(dateRange)
  }, [dateRange])

  useEffect(() => {
    if (data?.meta?.campaigns) {
      setCampaigns(data.meta.campaigns)
    }
  }, [data])

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Analytics Dashboard" />

        <section className="analytics-controls">
          <div className="filter-group">
            <label>Time Range:</label>
            <select
              className="filter-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Last 24 Hours</option>
              <option value="last7Days">Last 7 Days</option>
              <option value="last30Days">Last 30 Days</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Campaign Status:</label>
            <select className="filter-select">
              <option>All Campaigns</option>
              <option>Active Only</option>
              <option>Paused Only</option>
            </select>
          </div>
        </section>

        <section className="analytics-grid">
          <div className="chart-card">
            <h3>ROAS Trend</h3>
            <div className="chart-placeholder">
              <p>Chart visualization coming soon</p>
              <p className="chart-value">{data?.meta?.roas?.toFixed(2) || '0.00'}x</p>
            </div>
          </div>
          <div className="chart-card">
            <h3>Spend Over Time</h3>
            <div className="chart-placeholder">
              <p>Chart visualization coming soon</p>
              <p className="chart-value">${data?.meta?.spend?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
          <div className="chart-card">
            <h3>Conversions</h3>
            <div className="chart-placeholder">
              <p>Chart visualization coming soon</p>
              <p className="chart-value">{data?.meta?.conversions || 0}</p>
            </div>
          </div>
          <div className="chart-card">
            <h3>CTR & Impressions</h3>
            <div className="chart-placeholder">
              <p>Chart visualization coming soon</p>
              <p className="chart-value">{data?.meta?.ctr?.toFixed(2) || '0.00'}%</p>
            </div>
          </div>
        </section>

        <section className="data-table-section">
          <h2>Campaign Performance</h2>
          {loading ? (
            <p className="loading-text">Loading campaigns...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Budget</th>
                  <th>Objective</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length > 0 ? (
                  campaigns.map((campaign) => {
                    const budget = campaign.daily_budget
                      ? `$${(campaign.daily_budget / 100).toFixed(2)}/day`
                      : campaign.lifetime_budget
                      ? `$${(campaign.lifetime_budget / 100).toFixed(2)} lifetime`
                      : 'N/A'
                    
                    const status = campaign.status === 'ACTIVE' ? 'active' : 'paused'
                    const statusText = campaign.status === 'ACTIVE' ? 'Active' : 'Paused'

                    return (
                      <tr key={campaign.id}>
                        <td>{campaign.name}</td>
                        <td>{budget}</td>
                        <td>{campaign.objective || 'N/A'}</td>
                        <td>
                          <span className={`badge ${status}`}>{statusText}</span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                      No campaigns found. Configure Meta API in .env to fetch real data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  )
}
