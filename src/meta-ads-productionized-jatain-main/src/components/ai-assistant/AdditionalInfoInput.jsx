import { useState } from 'react';
import DOMPurify from 'dompurify';
import './AdditionalInfoInput.css';

/**
 * AdditionalInfoInput Component
 * 
 * Handles additional context input with character limit enforcement,
 * character counter display, and input sanitization.
 */
export default function AdditionalInfoInput({ onInfoChange, initialValue = '' }) {
  const [info, setInfo] = useState(initialValue);
  const MAX_CHARACTERS = 5000;
  const SHOW_COUNTER_THRESHOLD = 4500; // Show counter when within 500 chars of limit

  /**
   * Sanitizes input to prevent injection attacks
   */
  function sanitizeInput(input) {
    // Use DOMPurify to sanitize the input
    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true, // Keep text content
    });
    return sanitized;
  }

  /**
   * Handles input change with character limit enforcement
   */
  function handleChange(e) {
    let newValue = e.target.value;

    // Enforce character limit
    if (newValue.length > MAX_CHARACTERS) {
      newValue = newValue.substring(0, MAX_CHARACTERS);
    }

    // Sanitize input
    const sanitized = sanitizeInput(newValue);
    
    setInfo(sanitized);

    // Notify parent component
    if (onInfoChange) {
      onInfoChange(sanitized);
    }
  }

  /**
   * Calculates remaining characters
   */
  const remainingChars = MAX_CHARACTERS - info.length;
  const showCounter = info.length >= SHOW_COUNTER_THRESHOLD;
  const isNearLimit = remainingChars <= 500;
  const isAtLimit = remainingChars === 0;

  return (
    <div className="additional-info-input">
      <div className="input-header">
        <h3>Additional Information</h3>
        {showCounter && (
          <span 
            className={`character-counter ${isNearLimit ? 'near-limit' : ''} ${isAtLimit ? 'at-limit' : ''}`}
          >
            {remainingChars} characters remaining
          </span>
        )}
      </div>

      <textarea
        className="info-textarea"
        placeholder="Add any additional context about your campaign goals, target audience, budget constraints, or specific requirements that aren't covered in your documents or website. For example: 'We want to target young professionals aged 25-35 in urban areas. Our budget is flexible but we prefer to start conservatively. We're launching a new product line next month and want to build awareness.'"
        value={info}
        onChange={handleChange}
        rows={8}
        maxLength={MAX_CHARACTERS}
      />

      <p className="input-hint">
        Optional: Provide any additional context to help generate a more targeted campaign.
        {!showCounter && ` (${MAX_CHARACTERS} character limit)`}
      </p>
    </div>
  );
}
