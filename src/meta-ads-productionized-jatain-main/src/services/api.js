// Meta Marketing API Integration

// Valid Meta Ads Insights API fields
// Reference: https://developers.facebook.com/docs/marketing-api/reference/ad-account/insights/
const META_METRICS = [
  // Account & Campaign Info
  'account_id',
  'account_name',
  'account_currency',
  'campaign_id',
  'campaign_name',
  'adset_id',
  'adset_name',
  'ad_id',
  'ad_name',
  
  // Core Performance Metrics
  'spend',
  'impressions',
  'clicks',
  'reach',
  'frequency',
  
  // Cost Metrics
  'cpc',
  'cpm',
  'cpp',
  'ctr',
  
  // Actions & Conversions
  'actions',
  'action_values',
  'conversions',
  'conversion_values',
  'cost_per_action_type',
  'cost_per_conversion',
  
  // Link Clicks
  'inline_link_clicks',
  'inline_link_click_ctr',
  'cost_per_inline_link_click',
  'inline_post_engagement',
  'cost_per_inline_post_engagement',
  
  // Outbound Clicks
  'outbound_clicks',
  'cost_per_outbound_click',
  
  // Unique Metrics (estimated)
  'unique_clicks',
  'cost_per_unique_click',
  'cost_per_unique_action_type',
  'cost_per_unique_inline_link_click',
  'cost_per_unique_outbound_click',
  
  // ROAS Metrics
  'purchase_roas',
  'website_purchase_roas',
  'mobile_app_purchase_roas',
  
  // Video Metrics
  'video_play_actions',
  'video_30_sec_watched_actions',
  'video_p25_watched_actions',
  'video_p50_watched_actions',
  'video_p75_watched_actions',
  'video_p100_watched_actions',
  'video_avg_time_watched_actions',
  'cost_per_thruplay',
  
  // Objective Results
  'objective',
  'optimization_goal',
  'buying_type',
  
  // Date Range
  'date_start',
  'date_stop'
]

const DATE_RANGES = {
  today: {
    since: new Date().toISOString().split('T')[0],
    until: new Date().toISOString().split('T')[0]
  },
  last7Days: {
    since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    until: new Date().toISOString().split('T')[0]
  },
  last30Days: {
    since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    until: new Date().toISOString().split('T')[0]
  }
}

export class MetaAdsAPI {
  constructor(accessToken, adAccountId) {
    this.accessToken = accessToken
    this.adAccountId = adAccountId
    this.baseUrl = 'https://graph.facebook.com'
    this.apiVersion = 'v19.0'
  }

  async makeRequest(endpoint, params = {}) {
    if (!this.accessToken) {
      throw new Error('Meta API Access Token is required')
    }

    if (!this.adAccountId) {
      throw new Error('Ad Account ID is required')
    }

    const url = new URL(`${this.baseUrl}${endpoint}`)
    url.searchParams.append('access_token', this.accessToken)
    
    Object.keys(params).forEach(key => {
      if (Array.isArray(params[key])) {
        url.searchParams.append(key, params[key].join(','))
      } else {
        url.searchParams.append(key, params[key])
      }
    })

    try {
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'API request failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Meta API Error:', error)
      throw error
    }
  }

  async getAccountInsights(dateRange = 'today', metrics = META_METRICS) {
    const endpoint = `/${this.apiVersion}/${this.adAccountId}/insights`
    const range = DATE_RANGES[dateRange] || DATE_RANGES.today

    const params = {
      fields: metrics.join(','),
      time_range: JSON.stringify(range),
      level: 'account',
      action_attribution_windows: '7d_click,1d_view'
    }

    return await this.makeRequest(endpoint, params)
  }

  async getCampaignInsights(campaignId, dateRange = 'today') {
    const endpoint = `/${this.apiVersion}/${campaignId}/insights`
    const range = DATE_RANGES[dateRange] || DATE_RANGES.today

    const params = {
      fields: META_METRICS.join(','),
      time_range: JSON.stringify(range),
      action_attribution_windows: '7d_click,1d_view'
    }

    return await this.makeRequest(endpoint, params)
  }

  async getCampaigns(status = ['ACTIVE', 'PAUSED']) {
    const endpoint = `/${this.apiVersion}/${this.adAccountId}/campaigns`

    const params = {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time',
      limit: 100
    }

    // Note: Meta API doesn't support filtering by status in the campaigns endpoint
    // We'll filter on the client side after fetching
    const response = await this.makeRequest(endpoint, params)
    
    // Client-side filtering if status parameter is provided
    if (response.data && status && status.length > 0) {
      response.data = response.data.filter(campaign => 
        status.includes(campaign.status)
      )
    }
    
    return response
  }

  async createCampaign(campaignData) {
    const endpoint = `/${this.apiVersion}/${this.adAccountId}/campaigns`

    const params = {
      name: campaignData.name,
      objective: campaignData.objective || 'OUTCOME_SALES',
      status: campaignData.status || 'PAUSED',
      special_ad_categories: JSON.stringify([]),
    }

    if (campaignData.daily_budget) {
      params.daily_budget = campaignData.daily_budget * 100
    }

    const url = new URL(`${this.baseUrl}${endpoint}`)
    url.searchParams.append('access_token', this.accessToken)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to create campaign')
    }

    return await response.json()
  }

  calculateROAS(insightsData) {
    if (!insightsData || !insightsData.data || insightsData.data.length === 0) {
      return 0
    }

    const data = insightsData.data[0]
    
    // Try purchase_roas field first (most accurate)
    if (data.purchase_roas && data.purchase_roas.length > 0) {
      return parseFloat(data.purchase_roas[0].value)
    }

    // Try website_purchase_roas
    if (data.website_purchase_roas && data.website_purchase_roas.length > 0) {
      return parseFloat(data.website_purchase_roas[0].value)
    }

    // Try mobile_app_purchase_roas
    if (data.mobile_app_purchase_roas && data.mobile_app_purchase_roas.length > 0) {
      return parseFloat(data.mobile_app_purchase_roas[0].value)
    }

    // Calculate from action_values if available
    const spend = parseFloat(data.spend || 0)
    if (spend === 0) return 0

    const actionValues = data.action_values || []
    const purchaseValue = actionValues.find(av => 
      av.action_type === 'omni_purchase' ||
      av.action_type === 'purchase' || 
      av.action_type === 'offsite_conversion.fb_pixel_purchase'
    )

    if (purchaseValue) {
      const revenue = parseFloat(purchaseValue.value || 0)
      return revenue / spend
    }

    return 0
  }
}

export class AdDataManager {
  constructor() {
    this.metaAPI = null
    this.cache = {
      meta: null,
      lastUpdate: null
    }
  }

  initialize(metaToken, metaAccountId) {
    if (metaToken && metaAccountId) {
      this.metaAPI = new MetaAdsAPI(metaToken, metaAccountId)
    }
  }

  isConfigured() {
    return this.metaAPI !== null
  }

  async fetchAllData(dateRange = 'today') {
    const data = {
      meta: null
    }

    try {
      if (this.metaAPI) {
        const [accountInsights, campaigns] = await Promise.all([
          this.metaAPI.getAccountInsights(dateRange),
          this.metaAPI.getCampaigns()
        ])

        const metaData = accountInsights.data?.[0] || {}
        
        data.meta = {
          // Account Info
          accountId: metaData.account_id,
          accountName: metaData.account_name,
          accountCurrency: metaData.account_currency || 'USD',
          
          // Date Range
          dateStart: metaData.date_start,
          dateStop: metaData.date_stop,
          
          // Core Metrics
          spend: parseFloat(metaData.spend || 0),
          impressions: parseInt(metaData.impressions || 0),
          clicks: parseInt(metaData.clicks || 0),
          reach: parseInt(metaData.reach || 0),
          frequency: parseFloat(metaData.frequency || 0),
          
          // Cost Metrics
          ctr: parseFloat(metaData.ctr || 0),
          cpc: parseFloat(metaData.cpc || 0),
          cpm: parseFloat(metaData.cpm || 0),
          cpp: parseFloat(metaData.cpp || 0),
          
          // Conversions & ROAS
          conversions: this.extractConversions(metaData),
          conversionValue: this.extractConversionValue(metaData),
          roas: this.metaAPI.calculateROAS(accountInsights),
          costPerConversion: this.extractCostPerConversion(metaData),
          
          // Link Clicks
          inlineLinkClicks: parseInt(metaData.inline_link_clicks || 0),
          inlineLinkClickCtr: parseFloat(metaData.inline_link_click_ctr || 0),
          costPerInlineLinkClick: parseFloat(metaData.cost_per_inline_link_click || 0),
          
          // Outbound Clicks
          outboundClicks: this.extractOutboundClicks(metaData),
          costPerOutboundClick: this.extractCostPerOutboundClick(metaData),
          
          // Unique Metrics (estimated)
          uniqueClicks: parseInt(metaData.unique_clicks || 0),
          costPerUniqueClick: parseFloat(metaData.cost_per_unique_click || 0),
          costPerUniqueInlineLinkClick: parseFloat(metaData.cost_per_unique_inline_link_click || 0),
          
          // Post Engagement
          inlinePostEngagement: parseInt(metaData.inline_post_engagement || 0),
          costPerInlinePostEngagement: parseFloat(metaData.cost_per_inline_post_engagement || 0),
          
          // Video Metrics
          videoViews: this.extractActionValue(metaData, 'video_view'),
          video30SecWatched: this.extractActionValue(metaData, 'video_30_sec_watched_actions'),
          videoP25: this.extractActionValue(metaData, 'video_p25_watched_actions'),
          videoP50: this.extractActionValue(metaData, 'video_p50_watched_actions'),
          videoP75: this.extractActionValue(metaData, 'video_p75_watched_actions'),
          videoP100: this.extractActionValue(metaData, 'video_p100_watched_actions'),
          
          // Actions breakdown
          actions: metaData.actions || [],
          actionValues: metaData.action_values || [],
          
          // Campaigns
          campaigns: campaigns.data || [],
          
          // Raw data for advanced analysis
          rawData: metaData
        }

        this.cache.meta = data.meta
      }

      this.cache.lastUpdate = new Date()

      return data

    } catch (error) {
      console.error('Error fetching ad data:', error)
      throw error
    }
  }

  extractActionValue(insightsData, actionType) {
    if (!insightsData.actions) return 0

    const action = insightsData.actions.find(a => a.action_type === actionType)
    return action ? parseInt(action.value || 0) : 0
  }

  extractConversions(insightsData) {
    // Try conversions field first (direct from API)
    if (insightsData.conversions && Array.isArray(insightsData.conversions)) {
      return insightsData.conversions.reduce((sum, conv) => sum + parseInt(conv.value || 0), 0)
    }

    // Fallback to actions field
    if (!insightsData.actions) return 0

    const conversionActions = insightsData.actions.filter(action =>
      action.action_type === 'omni_purchase' ||
      action.action_type === 'purchase' ||
      action.action_type === 'offsite_conversion.fb_pixel_purchase' ||
      action.action_type.includes('conversion')
    )

    return conversionActions.reduce((sum, action) => sum + parseInt(action.value || 0), 0)
  }

  extractConversionValue(insightsData) {
    // Try conversion_values field first
    if (insightsData.conversion_values && Array.isArray(insightsData.conversion_values)) {
      return insightsData.conversion_values.reduce((sum, cv) => sum + parseFloat(cv.value || 0), 0)
    }

    // Fallback to action_values
    if (!insightsData.action_values) return 0

    const purchaseValues = insightsData.action_values.filter(av =>
      av.action_type === 'omni_purchase' ||
      av.action_type === 'purchase' ||
      av.action_type === 'offsite_conversion.fb_pixel_purchase'
    )

    return purchaseValues.reduce((sum, av) => sum + parseFloat(av.value || 0), 0)
  }

  extractCostPerConversion(insightsData) {
    // Try cost_per_conversion field first
    if (insightsData.cost_per_conversion && Array.isArray(insightsData.cost_per_conversion)) {
      const avgCost = insightsData.cost_per_conversion.reduce((sum, cpc) => sum + parseFloat(cpc.value || 0), 0)
      return avgCost / insightsData.cost_per_conversion.length
    }

    // Calculate manually
    const conversions = this.extractConversions(insightsData)
    const spend = parseFloat(insightsData.spend || 0)
    
    if (conversions > 0 && spend > 0) {
      return spend / conversions
    }
    
    return 0
  }

  extractOutboundClicks(insightsData) {
    // Try outbound_clicks field first
    if (insightsData.outbound_clicks && Array.isArray(insightsData.outbound_clicks)) {
      return insightsData.outbound_clicks.reduce((sum, oc) => sum + parseInt(oc.value || 0), 0)
    }

    // Fallback to actions
    return this.extractActionValue(insightsData, 'outbound_click')
  }

  extractCostPerOutboundClick(insightsData) {
    // Try cost_per_outbound_click field first
    if (insightsData.cost_per_outbound_click && Array.isArray(insightsData.cost_per_outbound_click)) {
      const avgCost = insightsData.cost_per_outbound_click.reduce((sum, cpoc) => sum + parseFloat(cpoc.value || 0), 0)
      return avgCost / insightsData.cost_per_outbound_click.length
    }

    // Calculate manually
    const outboundClicks = this.extractOutboundClicks(insightsData)
    const spend = parseFloat(insightsData.spend || 0)
    
    if (outboundClicks > 0 && spend > 0) {
      return spend / outboundClicks
    }
    
    return 0
  }

  getCachedData() {
    return this.cache
  }
}
