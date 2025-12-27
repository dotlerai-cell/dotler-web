# Dashboard Features

## Overview
The Dashboard provides a comprehensive view of your Meta Ads performance with real-time metrics from the Meta Marketing API.

## Key Features

### 1. Connection Status
- Shows whether Meta Ads account is connected
- Displays connected account name and ID
- Quick link to connect account if not configured

### 2. Time Range Selection
- **Today**: Last 24 hours of data
- **Last 7 Days**: Weekly performance overview
- **Last 30 Days**: Monthly performance trends

### 3. Auto-Refresh
- Optional auto-refresh every 5 minutes
- Keeps data up-to-date without manual intervention
- Can be toggled on/off

## Metrics Displayed

### Core Performance Metrics
1. **Total Spend** - Total ad spend in selected time range
2. **ROAS** (Return on Ad Spend) - Revenue generated per dollar spent
3. **Conversions** - Total number of conversions
4. **Conversion Value** - Total revenue from conversions
5. **Impressions** - Number of times ads were shown
6. **Reach** - Unique people who saw your ads
7. **Clicks** - Total clicks on ads
8. **CTR** (Click-Through Rate) - Percentage of impressions that resulted in clicks

### Cost Metrics
- **CPC** (Cost per Click) - Average cost for each click
- **CPM** (Cost per 1,000 Impressions) - Cost to reach 1,000 impressions
- **CPP** (Cost per 1,000 People) - Cost to reach 1,000 unique people
- **Cost per Conversion** - Average cost to acquire one conversion

### Engagement Metrics
- **Inline Link Clicks** - Clicks on links within ads
- **Inline Link Click CTR** - Click-through rate for inline links
- **Cost per Inline Link Click** - Average cost per inline link click
- **Post Engagement** - Total engagement with ad posts

### Additional Metrics
- **Frequency** - Average times each person saw your ad
- **Conversion Rate** - Percentage of clicks that converted
- **Outbound Clicks** - Clicks that took users off Facebook
- **Unique Clicks** - Estimated unique click count

### Video Performance (when applicable)
- Video Views
- 30-Second Views
- 25%, 50%, 75%, 100% Watch Completion Rates

## Campaign Summary
- Lists up to 5 active campaigns
- Shows campaign status (Active/Paused)
- Displays campaign objective
- Link to view all campaigns in Analytics page

## Data Attribution
- Uses Meta's default attribution window: 7-day click, 1-day view
- Some metrics are estimated (marked in UI)
- Data updates reflect the selected time range

## API Integration
All data is fetched from Meta Marketing API v19.0 using the Insights endpoint:
- Endpoint: `/{api_version}/{ad_account_id}/insights`
- Fields: 50+ metrics from Meta Ads Insights API
- Real-time data with configurable refresh intervals

## Navigation
- **Analytics**: Detailed campaign-level analysis
- **Campaign**: Create and manage campaigns
- **Connect Meta**: Configure Meta Ads account connection
