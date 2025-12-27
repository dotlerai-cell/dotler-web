import { useState } from 'react';
import './AdCopyVariations.css';

/**
 * AdCopyVariations Component
 * 
 * Displays AI-generated ad copy variations in a selectable list.
 * Shows variation tone/angle labels and allows selection.
 * Includes "Generate More" button for additional variations.
 */
export default function AdCopyVariations({
  variations = [],
  onSelect,
  onGenerateMore,
  selectedVariation = null,
  isLoading = false,
  isGeneratingMore = false,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  /**
   * Handles variation selection
   */
  function handleSelect(variation, index) {
    if (onSelect) {
      onSelect(variation, index);
    }
  }

  /**
   * Handles generate more button click
   */
  function handleGenerateMore() {
    if (onGenerateMore && !isGeneratingMore) {
      onGenerateMore();
    }
  }

  /**
   * Determines the tone/angle label for a variation
   * Based on content analysis
   */
  function getVariationLabel(variation, index) {
    const text = variation.toLowerCase();
    
    // Check for urgency indicators
    if (text.includes('limited') || text.includes('hurry') || text.includes('now') || 
        text.includes('today') || text.includes('don\'t miss') || text.includes('last chance')) {
      return { label: 'Urgency', color: 'red' };
    }
    
    // Check for benefit indicators
    if (text.includes('benefit') || text.includes('gain') || text.includes('save') || 
        text.includes('improve') || text.includes('transform') || text.includes('discover')) {
      return { label: 'Benefit-Focused', color: 'green' };
    }
    
    // Check for social proof
    if (text.includes('join') || text.includes('thousands') || text.includes('trust') || 
        text.includes('rated') || text.includes('loved') || text.includes('popular')) {
      return { label: 'Social Proof', color: 'blue' };
    }
    
    // Check for questions
    if (text.includes('?')) {
      return { label: 'Question-Based', color: 'purple' };
    }
    
    // Check for features
    if (text.includes('feature') || text.includes('includes') || text.includes('with') || 
        text.includes('powered') || text.includes('advanced')) {
      return { label: 'Feature-Focused', color: 'orange' };
    }
    
    // Default based on position
    const defaultLabels = [
      { label: 'Benefit-Focused', color: 'green' },
      { label: 'Feature-Focused', color: 'orange' },
      { label: 'Urgency', color: 'red' },
      { label: 'Social Proof', color: 'blue' },
      { label: 'Problem-Solution', color: 'teal' },
      { label: 'Storytelling', color: 'purple' }
    ];
    
    return defaultLabels[index % defaultLabels.length];
  }

  /**
   * Gets character count with status
   */
  function getCharacterCount(text) {
    const count = text.length;
    const maxLength = 125;
    const status = count > maxLength ? 'over' : count > 110 ? 'warning' : 'good';
    
    return { count, maxLength, status };
  }

  if (isLoading) {
    return (
      <div className="ad-copy-variations loading">
        <div className="loading-spinner" />
        <p>Generating ad copy variations...</p>
      </div>
    );
  }

  if (!variations || variations.length === 0) {
    return (
      <div className="ad-copy-variations empty">
        <div className="empty-icon">✍️</div>
        <p className="empty-text">No ad copy variations available</p>
        <p className="empty-hint">
          Generate a campaign first to receive ad copy suggestions
        </p>
      </div>
    );
  }

  return (
    <div className="ad-copy-variations">
      <div className="variations-header">
        <h3>Ad Copy Variations</h3>
        <p className="variations-description">
          AI-generated ad copy with different angles and approaches
        </p>
      </div>

      <div className="variations-list">
        {variations.map((variation, index) => {
          const variationId = `variation-${index}`;
          const isSelected = selectedVariation === variation || selectedVariation === index;
          const isHovered = hoveredIndex === index;
          const { label, color } = getVariationLabel(variation, index);
          const { count, maxLength, status } = getCharacterCount(variation);

          return (
            <div
              key={variationId}
              className={`variation-card ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Card Header */}
              <div className="card-header">
                <div className="header-left">
                  <div className="variation-number">#{index + 1}</div>
                  <div className={`variation-label ${color}`}>
                    {label}
                  </div>
                </div>
                <div className="header-right">
                  <div className={`character-count ${status}`}>
                    {count}/{maxLength}
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="card-content">
                <p className="variation-text">{variation}</p>
              </div>

              {/* Card Footer */}
              <div className="card-footer">
                <button
                  className={`select-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(variation, index)}
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
                      Use This Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate More Button */}
      <div className="variations-footer">
        <button
          className="generate-more-button"
          onClick={handleGenerateMore}
          disabled={isGeneratingMore}
        >
          {isGeneratingMore ? (
            <>
              <span className="button-spinner" />
              Generating More...
            </>
          ) : (
            <>
              <span className="button-icon">✨</span>
              Generate More Variations
            </>
          )}
        </button>

        <p className="footer-hint">
          💡 Tip: Select a variation to automatically populate your ad copy field
        </p>
      </div>
    </div>
  );
}
