import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useMetaAPI } from '../hooks/useMetaAPI'
import { getCampaignTemplates, loadCampaignTemplate } from '../services/campaignGenerator'

export default function Campaign() {
  const { createCampaign } = useMetaAPI()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [templates, setTemplates] = useState([])
  const [showTemplates, setShowTemplates] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    objective: 'OUTCOME_SALES',
    dailyBudget: '',
    totalBudget: '',
    startDate: '',
    endDate: '',
    adCopy: '',
    targetUrl: '',
    enableCreativeRefresh: true,
    enableInventorySync: true,
    enableArbitrage: true,
    enableWeatherBidding: false
  })

  // Load templates on component mount
  useEffect(() => {
    const loadedTemplates = getCampaignTemplates()
    setTemplates(loadedTemplates)
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const loadTemplate = (templateId) => {
    const template = loadCampaignTemplate(templateId)
    if (template) {
      setFormData({
        name: template.name,
        objective: template.objective,
        dailyBudget: template.dailyBudget.toString(),
        totalBudget: '',
        startDate: template.startDate,
        endDate: template.endDate,
        adCopy: template.adCopy,
        targetUrl: template.targetUrl,
        enableCreativeRefresh: template.enableCreativeRefresh,
        enableInventorySync: template.enableInventorySync,
        enableArbitrage: template.enableArbitrage,
        enableWeatherBidding: template.enableWeatherBidding
      })
      setShowTemplates(false)
      setError('')
      setSuccess('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name || !formData.dailyBudget) {
      setError('Please fill in required fields')
      return
    }

    try {
      setLoading(true)
      
      const campaignData = {
        name: formData.name,
        objective: formData.objective,
        daily_budget: parseFloat(formData.dailyBudget),
        status: 'PAUSED' // Start paused for safety
      }

      const result = await createCampaign(campaignData)
      setSuccess(`Campaign "${formData.name}" created successfully! ID: ${result.id}`)
      
      // Reset form
      setFormData({
        name: '',
        objective: 'OUTCOME_SALES',
        dailyBudget: '',
        totalBudget: '',
        startDate: '',
        endDate: '',
        adCopy: '',
        targetUrl: '',
        enableCreativeRefresh: true,
        enableInventorySync: true,
        enableArbitrage: true,
        enableWeatherBidding: false
      })

    } catch (err) {
      console.error('Campaign creation error:', err)
      setError(err.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Create New Campaign" />

        <section className="campaign-form-section">

          {/* Campaign Templates */}
          <div className="templates-section">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              {showTemplates ? 'Hide Templates' : '📋 Load Campaign Template'}
            </button>

            {showTemplates && (
              <div className="templates-grid">
                <h4>Choose a Campaign Template</h4>
                <div className="templates-list">
                  {templates.map((template) => (
                    <div key={template.id} className="template-card">
                      <h5>{template.name}</h5>
                      <p>{template.description}</p>
                      <div className="template-meta">
                        <span>🎯 {template.objective.replace('OUTCOME_', '').toLowerCase()}</span>
                        <span>💰 ${template.dailyBudget}/day</span>
                      </div>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => loadTemplate(template.id)}
                      >
                        Use This Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form className="campaign-form" onSubmit={handleSubmit}>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-section">
              <h3>📝 Basic Information</h3>
              <div className="form-group">
                <label>Campaign Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Summer Sale 2025"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>🎯 Campaign Objective</h3>
              <div className="form-group">
                <label>Select Objective</label>
                <select
                  name="objective"
                  value={formData.objective}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="OUTCOME_SALES">Sales (Conversions)</option>
                  <option value="OUTCOME_LEADS">Lead Generation</option>
                  <option value="OUTCOME_AWARENESS">Brand Awareness</option>
                  <option value="OUTCOME_TRAFFIC">Traffic</option>
                  <option value="OUTCOME_ENGAGEMENT">Engagement</option>
                  <option value="OUTCOME_APP_PROMOTION">App Promotion</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <h3>💰 Budget & Schedule</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Daily Budget * ($)</label>
                  <input
                    type="number"
                    name="dailyBudget"
                    value={formData.dailyBudget}
                    onChange={handleChange}
                    placeholder="100"
                    className="form-input"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Total Budget ($)</label>
                  <input
                    type="number"
                    name="totalBudget"
                    value={formData.totalBudget}
                    onChange={handleChange}
                    placeholder="3000"
                    className="form-input"
                    min="1"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>🎨 Creative Settings</h3>
              <div className="form-group">
                <label>Ad Copy</label>
                <textarea
                  name="adCopy"
                  value={formData.adCopy}
                  onChange={handleChange}
                  className="form-textarea"
                  rows="4"
                  placeholder="Enter your ad copy here..."
                />
              </div>
              <div className="form-group">
                <label>Target URL</label>
                <input
                  type="url"
                  name="targetUrl"
                  value={formData.targetUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/product"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="enableCreativeRefresh"
                    checked={formData.enableCreativeRefresh}
                    onChange={handleChange}
                  />
                  Enable AI Creative Refresh (Auto-regenerate when CTR drops)
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>🛡️ Autopilot Settings</h3>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="enableInventorySync"
                    checked={formData.enableInventorySync}
                    onChange={handleChange}
                  />
                  Enable Inventory Sync (Pause ads when stock is low)
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="enableArbitrage"
                    checked={formData.enableArbitrage}
                    onChange={handleChange}
                  />
                  Enable Budget Optimization (Auto-optimize based on ROAS)
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="enableWeatherBidding"
                    checked={formData.enableWeatherBidding}
                    onChange={handleChange}
                  />
                  Enable Weather-Based Bidding
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => window.history.back()}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : '🚀 Launch Campaign'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
