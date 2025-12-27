import { useState } from 'react';
import './AudienceSuggestions.css';

/**
 * AudienceSuggestions Component
 * 
 * Displays AI-generated audience targeting suggestions in cards.
 * Shows demographics, interests, behaviors, and allows selection.
 * Includes ranking display and custom audience recommendations.
 */
export default function AudienceSuggestions({
  suggestions = [],
  onSelect,
  selectedAudience = null,
  isLoading = false,
}) {
  const [expandedCard, setExpandedCard] = useState(null);

  /**
   * Handles audience selection
   */
  function handleSelect(audience) {
    if (onSelect) {
      onSelect(audience);
    }
  }

  /**
   * Toggles card expansion
   */
  function toggleExpand(audienceId) {
    setExpandedCard(expandedCard === audienceId ? null : audienceId);
  }

  /**
   * Gets ranking badge color
   */
  function getRankingColor(ranking) {
    if (ranking === 1) return 'gold';
    if (ranking === 2) return 'silver';
    if (ranking === 3) return 'bronze';
    return 'default';
  }

  /**
   * Formats demographics for display
   */
  function formatDemographics(demographics) {
    if (!demographics) return 'Not specified';
    return demographics;
  }

  if (isLoading) {
    return (
      <div className="audience-suggestions loading">
        <div className="loading-spinner" />
        <p>Generating audience suggestions...</p>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="audience-suggestions empty">
        <div className="empty-icon">👥</div>
        <p className="empty-text">No audience suggestions available</p>
        <p className="empty-hint">
          Generate a campaign first to receive audience targeting recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="audience-suggestions">
      <div className="suggestions-header">
        <h3>Audience Suggestions</h3>
        <p className="suggestions-description">
          AI-generated audience segments ranked by relevance to your campaign
        </p>
      </div>

      <div className="suggestions-list">
        {suggestions.map((audience, index) => {
          const audienceId = `audience-${index}`;
          const isExpanded = expandedCard === audienceId;
          const isSelected = selectedAudience?.name === audience.name;
          const rankingColor = getRankingColor(audience.ranking);

          return (
            <div
              key={audienceId}
              className={`audience-card ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
            >
              {/* Card Header */}
              <div className="card-header">
                <div className="header-left">
                  <div className={`ranking-badge ${rankingColor}`}>
                    #{audience.ranking}
                  </div>
                  <div className="audience-name-section">
                    <h4 className="audience-name">{audience.name}</h4>
                    {audience.description && (
                      <p className="audience-description">{audience.description}</p>
                    )}
                  </div>
                </div>
                <div className="header-actions">
                  <button
                    className="expand-button"
                    onClick={() => toggleExpand(audienceId)}
                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                    title={isExpanded ? 'Collapse details' : 'Expand details'}
                  >
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* Card Content - Always visible summary */}
              <div className="card-summary">
                <div className="summary-item">
                  <span className="summary-icon">📊</span>
                  <span className="summary-label">Demographics:</span>
                  <span className="summary-value">
                    {formatDemographics(audience.demographics)}
                  </span>
                </div>

                {audience.interests && audience.interests.length > 0 && (
                  <div className="summary-item">
                    <span className="summary-icon">💡</span>
                    <span className="summary-label">Top Interests:</span>
                    <span className="summary-value">
                      {audience.interests.slice(0, 3).join(', ')}
                      {audience.interests.length > 3 && ` +${audience.interests.length - 3} more`}
                    </span>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="card-details">
                  {/* Interests */}
                  {audience.interests && audience.interests.length > 0 && (
                    <div className="detail-section">
                      <h5 className="detail-title">
                        <span className="detail-icon">💡</span>
                        Interests
                      </h5>
                      <div className="tag-list">
                        {audience.interests.map((interest, idx) => (
                          <span key={idx} className="tag interest-tag">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Behaviors */}
                  {audience.behaviors && audience.behaviors.length > 0 && (
                    <div className="detail-section">
                      <h5 className="detail-title">
                        <span className="detail-icon">🎯</span>
                        Behaviors
                      </h5>
                      <div className="tag-list">
                        {audience.behaviors.map((behavior, idx) => (
                          <span key={idx} className="tag behavior-tag">
                            {behavior}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Audiences */}
                  {audience.customAudiences && audience.customAudiences.length > 0 && (
                    <div className="detail-section">
                      <h5 className="detail-title">
                        <span className="detail-icon">👤</span>
                        Recommended Custom Audiences
                      </h5>
                      <ul className="custom-audience-list">
                        {audience.customAudiences.map((customAudience, idx) => (
                          <li key={idx} className="custom-audience-item">
                            {customAudience}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Rationale */}
                  {audience.rationale && (
                    <div className="detail-section rationale-section">
                      <h5 className="detail-title">
                        <span className="detail-icon">💭</span>
                        Why This Audience?
                      </h5>
                      <p className="rationale-text">{audience.rationale}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Card Footer - Select Button */}
              <div className="card-footer">
                <button
                  className={`select-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(audience)}
                  disabled={isSelected}
                >
                  {isSelected ? (
                    <>
                      <span className="button-icon">✓</span>
                      Selected
                    </>
                  ) : (
                    <>
                      <span className="button-icon">→</span>
                      Use This Audience
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="suggestions-footer">
        <p className="footer-hint">
          💡 Tip: Select an audience to automatically populate your campaign's targeting fields
        </p>
      </div>
    </div>
  );
}
