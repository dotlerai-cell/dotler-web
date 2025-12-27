#!/usr/bin/env python3
"""
Campaign Meta Generator
Generates JSON data for Meta Ads campaign creation
"""

import json
import random
from datetime import datetime, timedelta

def generate_campaign_data():
    """Generate sample campaign data"""

    # Campaign objectives
    objectives = [
        'OUTCOME_SALES',
        'OUTCOME_LEADS',
        'OUTCOME_AWARENESS',
        'OUTCOME_TRAFFIC',
        'OUTCOME_ENGAGEMENT',
        'OUTCOME_APP_PROMOTION'
    ]

    # Sample campaign templates
    campaign_templates = [
        {
            'name': 'Summer Sale 2025 - E-commerce',
            'objective': 'OUTCOME_SALES',
            'daily_budget': 150.00,
            'description': 'Drive online sales during summer promotion',
            'target_audience': 'Online shoppers interested in fashion',
            'ad_copy': '🌞 Summer Sale! Up to 50% off on all items. Limited time offer!',
            'target_url': 'https://example.com/summer-sale',
            'creative_type': 'carousel',
            'enable_creative_refresh': True,
            'enable_inventory_sync': True,
            'enable_arbitrage': True,
            'enable_weather_bidding': False
        },
        {
            'name': 'Lead Generation - Webinar Signup',
            'objective': 'OUTCOME_LEADS',
            'daily_budget': 100.00,
            'description': 'Generate leads for upcoming webinar',
            'target_audience': 'Professionals interested in marketing',
            'ad_copy': '🚀 Master Facebook Ads in 2025! Free Webinar Registration',
            'target_url': 'https://example.com/webinar-signup',
            'creative_type': 'single_image',
            'enable_creative_refresh': False,
            'enable_inventory_sync': False,
            'enable_arbitrage': False,
            'enable_weather_bidding': False
        },
        {
            'name': 'Brand Awareness - Product Launch',
            'objective': 'OUTCOME_AWARENESS',
            'daily_budget': 200.00,
            'description': 'Build brand awareness for new product launch',
            'target_audience': 'Tech enthusiasts',
            'ad_copy': '📱 Introducing the future of mobile technology. Coming soon!',
            'target_url': 'https://example.com/product-launch',
            'creative_type': 'video',
            'enable_creative_refresh': True,
            'enable_inventory_sync': False,
            'enable_arbitrage': False,
            'enable_weather_bidding': False
        },
        {
            'name': 'Traffic Boost - Blog Content',
            'objective': 'OUTCOME_TRAFFIC',
            'daily_budget': 75.00,
            'description': 'Drive traffic to educational blog content',
            'target_audience': 'Content consumers',
            'ad_copy': '📚 Learn the secrets of successful content marketing',
            'target_url': 'https://example.com/blog/content-marketing-guide',
            'creative_type': 'single_image',
            'enable_creative_refresh': False,
            'enable_inventory_sync': False,
            'enable_arbitrage': True,
            'enable_weather_bidding': False
        }
    ]

    # Generate multiple campaigns
    campaigns = []
    for i, template in enumerate(campaign_templates):
        campaign = template.copy()
        campaign['id'] = f'campaign_{i+1}'
        campaign['status'] = 'PAUSED'  # Start paused for safety

        # Add some randomization for variety
        campaign['daily_budget'] += random.uniform(-20, 50)

        # Generate date range (next 30 days)
        start_date = datetime.now() + timedelta(days=1)
        end_date = start_date + timedelta(days=30)
        campaign['start_date'] = start_date.strftime('%Y-%m-%d')
        campaign['end_date'] = end_date.strftime('%Y-%m-%d')

        campaigns.append(campaign)

    return {
        'generated_at': datetime.now().isoformat(),
        'total_campaigns': len(campaigns),
        'campaigns': campaigns,
        'meta': {
            'api_version': 'v19.0',
            'default_currency': 'USD',
            'supported_objectives': objectives
        }
    }

def main():
    """Main function to generate and output JSON"""
    try:
        data = generate_campaign_data()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except Exception as e:
        error_data = {
            'error': str(e),
            'generated_at': datetime.now().isoformat()
        }
        print(json.dumps(error_data, indent=2))
        exit(1)

if __name__ == '__main__':
    main()
