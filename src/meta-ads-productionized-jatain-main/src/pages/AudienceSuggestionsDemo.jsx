import { useState } from 'react';
import AudienceSuggestions from '../components/ai-assistant/AudienceSuggestions';

/**
 * AudienceSuggestions Demo Page
 * 
 * Demonstrates the AudienceSuggestions component with sample data
 */
export default function AudienceSuggestionsDemo() {
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Sample audience suggestions
  const sampleSuggestions = [
    {
      name: 'Tech-Savvy Early Adopters',
      description: 'Young professionals interested in technology and innovation',
      interests: ['Technology', 'Gadgets', 'Innovation', 'Startups', 'Tech News', 'Software', 'Mobile Apps', 'AI & Machine Learning'],
      demographics: 'Ages 25-40, All genders, Urban areas in US, UK, Canada',
      behaviors: ['Early adopters', 'Online shoppers', 'Tech enthusiasts', 'Frequent app users'],
      rationale: 'This audience is most likely to engage with tech products and has high purchasing power. They actively seek out new technologies and are willing to pay premium prices for innovative solutions.',
      ranking: 1,
      customAudiences: ['Website visitors (last 30 days)', 'Email subscribers', 'Product page viewers']
    },
    {
      name: 'Budget-Conscious Millennials',
      description: 'Cost-aware young adults looking for value and deals',
      interests: ['Coupons', 'Deals and discounts', 'Budget shopping', 'Price comparison', 'Flash sales'],
      demographics: 'Ages 25-35, All genders, Worldwide',
      behaviors: ['Bargain hunters', 'Deal seekers', 'Price-conscious shoppers', 'Coupon users'],
      rationale: 'This segment responds well to promotional campaigns and limited-time offers. They have moderate purchasing power but high engagement rates with discount-focused messaging.',
      ranking: 2,
      customAudiences: ['Cart abandoners', 'Sale page visitors']
    },
    {
      name: 'Professional Business Owners',
      description: 'Small business owners and entrepreneurs seeking business solutions',
      interests: ['Entrepreneurship', 'Small business', 'Business software', 'Productivity tools', 'Business growth', 'Marketing'],
      demographics: 'Ages 30-55, All genders, US, UK, Canada, Australia',
      behaviors: ['Business decision makers', 'Small business owners', 'Entrepreneurs', 'B2B buyers'],
      rationale: 'Business owners have clear pain points and are willing to invest in solutions that improve efficiency. They value ROI and practical benefits over flashy features.',
      ranking: 3,
      customAudiences: ['LinkedIn profile visitors', 'Business webinar attendees', 'Free trial users']
    },
    {
      name: 'Lifestyle Enthusiasts',
      description: 'People interested in wellness, fitness, and lifestyle improvements',
      interests: ['Fitness', 'Wellness', 'Healthy living', 'Yoga', 'Meditation', 'Self-improvement', 'Nutrition'],
      demographics: 'Ages 22-45, 70% Female, Urban and suburban areas',
      behaviors: ['Health-conscious consumers', 'Fitness app users', 'Wellness product buyers'],
      rationale: 'This audience is highly engaged with lifestyle content and willing to invest in products that enhance their well-being. They respond well to aspirational messaging.',
      ranking: 4,
      customAudiences: ['Blog readers', 'Newsletter subscribers']
    },
    {
      name: 'Gen Z Digital Natives',
      description: 'Young adults who grew up with social media and mobile technology',
      interests: ['Social media', 'Gaming', 'Streaming', 'Influencers', 'Trending topics', 'Memes', 'TikTok'],
      demographics: 'Ages 18-25, All genders, Worldwide',
      behaviors: ['Social media enthusiasts', 'Mobile-first users', 'Video content consumers', 'Influencer followers'],
      rationale: 'Gen Z has significant influence on trends and purchasing decisions. They value authenticity, social responsibility, and engaging content over traditional advertising.',
      ranking: 5,
      customAudiences: ['Instagram followers', 'TikTok engagers', 'Video viewers']
    }
  ];

  /**
   * Handles audience selection
   */
  function handleSelect(audience) {
    setSelectedAudience(audience);
    console.log('Selected audience:', audience);
  }

  /**
   * Simulates loading state
   */
  function simulateLoading() {
    setIsLoading(true);
    setShowSuggestions(false);
    setTimeout(() => {
      setIsLoading(false);
      setShowSuggestions(true);
    }, 2000);
  }

  /**
   * Clears selection
   */
  function clearSelection() {
    setSelectedAudience(null);
  }

  /**
   * Toggles suggestions visibility
   */
  function toggleSuggestions() {
    setShowSuggestions(!showSuggestions);
  }

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          color: '#111827',
          marginBottom: '0.5rem'
        }}>
          Audience Suggestions Demo
        </h1>
        <p style={{ 
          fontSize: '1rem', 
          color: '#6b7280',
          marginBottom: '1.5rem'
        }}>
          Test the AudienceSuggestions component with sample audience data. 
          Select an audience to see how it would populate campaign targeting fields.
        </p>

        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          flexWrap: 'wrap',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={simulateLoading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Simulate Loading
          </button>
          <button
            onClick={toggleSuggestions}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {showSuggestions ? 'Hide' : 'Show'} Suggestions
          </button>
          <button
            onClick={clearSelection}
            disabled={!selectedAudience}
            style={{
              padding: '0.75rem 1.5rem',
              background: selectedAudience ? '#ef4444' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: selectedAudience ? 'pointer' : 'not-allowed'
            }}
          >
            Clear Selection
          </button>
        </div>

        {/* Selected Audience Info */}
        {selectedAudience && (
          <div style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            border: '2px solid #667eea',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '1rem', 
              fontWeight: '600',
              color: '#111827'
            }}>
              ✓ Selected Audience
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: '0.875rem', 
              color: '#374151'
            }}>
              <strong>{selectedAudience.name}</strong> - {selectedAudience.description}
            </p>
          </div>
        )}
      </div>

      {/* Component Demo */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '2rem',
        minHeight: '400px'
      }}>
        {showSuggestions ? (
          <AudienceSuggestions
            suggestions={sampleSuggestions}
            onSelect={handleSelect}
            selectedAudience={selectedAudience}
            isLoading={isLoading}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>
              👥
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '1rem', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Suggestions Hidden
            </p>
            <p style={{ 
              margin: '0.5rem 0 0 0', 
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              Click "Show Suggestions" to display audience recommendations
            </p>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '1.125rem', 
          fontWeight: '600',
          color: '#111827'
        }}>
          Component Features
        </h3>
        <ul style={{ 
          margin: 0, 
          paddingLeft: '1.5rem',
          color: '#374151',
          lineHeight: '1.8'
        }}>
          <li>Displays audience segments in visually appealing cards</li>
          <li>Shows demographics, interests, and behaviors for each audience</li>
          <li>Ranking display with color-coded badges (gold, silver, bronze)</li>
          <li>Expandable cards to view detailed information</li>
          <li>Selection functionality to choose an audience</li>
          <li>Custom audience recommendations when available</li>
          <li>Rationale explaining why each audience is relevant</li>
          <li>Loading and empty states</li>
          <li>Responsive design for mobile and desktop</li>
        </ul>
      </div>

      {/* Integration Example */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '0.75rem'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '1.125rem', 
          fontWeight: '600',
          color: '#92400e'
        }}>
          💡 Integration Tip
        </h3>
        <p style={{ 
          margin: 0, 
          color: '#92400e',
          lineHeight: '1.6'
        }}>
          When a user selects an audience, the <code>onSelect</code> callback provides the complete 
          audience object. You can use this data to automatically populate the campaign form's 
          targeting fields (age range, interests, behaviors, custom audiences, etc.).
        </p>
      </div>
    </div>
  );
}
