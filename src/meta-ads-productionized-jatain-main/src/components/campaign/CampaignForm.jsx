import { useState, useEffect, useRef } from 'react';
import { validateField, validateCampaignForm } from '../../services/validationService';
import './CampaignForm.css';

/**
 * CampaignForm Component
 * 
 * Displays and manages the campaign form fields matching Meta Ads Manager structure.
 * Supports auto-fill from AI generation, manual editing, and real-time validation.
 */
export default function CampaignForm({
  formData,
  onChange,
  onSubmit,
  isAutoFilling = false,
  highlightedFields = [],
  manuallyEditedFields = new Set(),
  onFieldManuallyEdited,
}) {
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState(new Set());
  const [localHighlightedFields, setLocalHighlightedFields] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const previousFormDataRef = useRef(formData);

  /**
   * Detect auto-fill changes and highlight fields
   * This effect runs when formData changes during auto-fill
   */
  useEffect(() => {
    if (isAutoFilling) {
      // Scroll to top when auto-fill starts
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Detect which fields changed during auto-fill
    if (isAutoFilling && previousFormDataRef.current) {
      const changedFields = detectChangedFields(previousFormDataRef.current, formData);
      
      // Only highlight fields that weren't manually edited
      const fieldsToHighlight = changedFields.filter(
        field => !manuallyEditedFields.has(field)
      );

      if (fieldsToHighlight.length > 0) {
        setLocalHighlightedFields(fieldsToHighlight);

        // Remove highlights after animation completes (1 second)
        const timer = setTimeout(() => {
          setLocalHighlightedFields([]);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }

    // Update previous form data reference
    previousFormDataRef.current = formData;
  }, [formData, isAutoFilling, manuallyEditedFields]);

  /**
   * Detects which fields have changed between two form data objects
   */
  function detectChangedFields(oldData, newData) {
    const changedFields = [];

    // Check top-level fields
    Object.keys(newData).forEach(key => {
      if (key === 'targeting' || key === 'placements') {
        // Handle nested objects
        if (oldData[key] && newData[key]) {
          Object.keys(newData[key]).forEach(nestedKey => {
            if (JSON.stringify(oldData[key][nestedKey]) !== JSON.stringify(newData[key][nestedKey])) {
              changedFields.push(`${key}.${nestedKey}`);
            }
          });
        }
      } else if (Array.isArray(newData[key])) {
        // Handle arrays
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
          changedFields.push(key);
        }
      } else {
        // Handle primitive values
        if (oldData[key] !== newData[key]) {
          changedFields.push(key);
        }
      }
    });

    return changedFields;
  }

  /**
   * Handles field change with validation
   */
  function handleFieldChange(fieldName, value) {
    // Mark field as manually edited (only if not during auto-fill)
    if (!isAutoFilling) {
      if (onFieldManuallyEdited) {
        onFieldManuallyEdited(fieldName);
      }
    }

    // Update form data
    onChange(fieldName, value);

    // Mark field as touched
    setTouchedFields(prev => new Set([...prev, fieldName]));

    // Validate field in real-time
    const validation = validateField(fieldName, value, formData);
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: validation.valid ? null : validation,
    }));
  }

  /**
   * Handles nested field changes (e.g., targeting.ageMin)
   */
  function handleNestedFieldChange(parentField, childField, value) {
    const fieldName = `${parentField}.${childField}`;
    
    // Mark as manually edited (only if not during auto-fill)
    if (!isAutoFilling) {
      if (onFieldManuallyEdited) {
        onFieldManuallyEdited(fieldName);
      }
    }
    
    // Update nested data
    const updatedParent = {
      ...formData[parentField],
      [childField]: value,
    };

    onChange(parentField, updatedParent);

    // Mark as touched and validate
    setTouchedFields(prev => new Set([...prev, fieldName]));
    const validation = validateField(fieldName, value, formData);
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: validation.valid ? null : validation,
    }));
  }

  /**
   * Handles array field changes (e.g., headlines)
   */
  function handleArrayFieldChange(fieldName, index, value) {
    const currentArray = formData[fieldName] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    handleFieldChange(fieldName, newArray);
  }

  /**
   * Adds item to array field
   */
  function addArrayItem(fieldName, defaultValue = '') {
    const currentArray = formData[fieldName] || [];
    handleFieldChange(fieldName, [...currentArray, defaultValue]);
  }

  /**
   * Removes item from array field
   */
  function removeArrayItem(fieldName, index) {
    const currentArray = formData[fieldName] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    handleFieldChange(fieldName, newArray);
  }

  /**
   * Checks if field should show error
   */
  function shouldShowError(fieldName) {
    return touchedFields.has(fieldName) && validationErrors[fieldName];
  }

  /**
   * Gets field class names
   */
  function getFieldClassName(fieldName) {
    const classes = ['form-field'];
    
    // Combine external and local highlighted fields
    const allHighlightedFields = [...highlightedFields, ...localHighlightedFields];
    
    if (allHighlightedFields.includes(fieldName)) {
      classes.push('highlighted');
    }
    if (shouldShowError(fieldName)) {
      classes.push('error');
    }
    return classes.join(' ');
  }

  /**
   * Checks if form is valid for submission
   */
  function isFormValid() {
    const validation = validateCampaignForm(formData);
    return validation.valid;
  }

  /**
   * Handles form submission with validation
   */
  function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate entire form
    const validation = validateCampaignForm(formData);

    if (!validation.valid) {
      // Mark all invalid fields as touched
      const invalidFields = new Set(Object.keys(validation.errors));
      setTouchedFields(prev => new Set([...prev, ...invalidFields]));

      // Set all validation errors
      const errors = {};
      Object.entries(validation.errors).forEach(([field, error]) => {
        errors[field] = error;
      });
      setValidationErrors(errors);

      setIsSubmitting(false);
      
      // Scroll to first error
      const firstErrorField = Object.keys(validation.errors)[0];
      if (firstErrorField && formRef.current) {
        const errorElement = formRef.current.querySelector(`[id*="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      return;
    }

    // Form is valid, proceed with submission
    onSubmit();
    setIsSubmitting(false);
  }

  return (
    <form className="campaign-form" onSubmit={handleSubmit} ref={formRef}>
      <div className="form-header">
        <h1>Campaign Details</h1>
        <p className="form-description">
          Configure your Meta Ads campaign parameters
        </p>
      </div>

      <div className="form-content">

        {/* Basic Information Section */}
        <section className="form-section">
          <h2 className="section-title">Basic Information</h2>
          
          <div className={getFieldClassName('name')}>
            <label htmlFor="campaign-name">Campaign Name *</label>
            <input
              id="campaign-name"
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Enter campaign name"
              maxLength={100}
            />
            {shouldShowError('name') && (
              <div className="field-error">
                <span className="error-message">{validationErrors.name.error}</span>
                {validationErrors.name.suggestion && (
                  <span className="error-suggestion">{validationErrors.name.suggestion}</span>
                )}
              </div>
            )}
          </div>

          <div className={getFieldClassName('objective')}>
            <label htmlFor="campaign-objective">Campaign Objective *</label>
            <select
              id="campaign-objective"
              value={formData.objective || ''}
              onChange={(e) => handleFieldChange('objective', e.target.value)}
            >
              <option value="">Select objective</option>
              <option value="OUTCOME_SALES">Sales</option>
              <option value="OUTCOME_LEADS">Leads</option>
              <option value="OUTCOME_AWARENESS">Awareness</option>
              <option value="OUTCOME_TRAFFIC">Traffic</option>
              <option value="OUTCOME_ENGAGEMENT">Engagement</option>
              <option value="OUTCOME_APP_PROMOTION">App Promotion</option>
            </select>
            {shouldShowError('objective') && (
              <div className="field-error">
                <span className="error-message">{validationErrors.objective.error}</span>
              </div>
            )}
          </div>

          <div className={getFieldClassName('status')}>
            <label htmlFor="campaign-status">Status *</label>
            <select
              id="campaign-status"
              value={formData.status || 'PAUSED'}
              onChange={(e) => handleFieldChange('status', e.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </section>


        {/* Budget & Schedule Section */}
        <section className="form-section">
          <h2 className="section-title">Budget & Schedule</h2>
          
          <div className="form-row">
            <div className={getFieldClassName('dailyBudget')}>
              <label htmlFor="daily-budget">Daily Budget ($) *</label>
              <input
                id="daily-budget"
                type="number"
                min="1"
                step="0.01"
                value={formData.dailyBudget || ''}
                onChange={(e) => handleFieldChange('dailyBudget', parseFloat(e.target.value))}
                placeholder="0.00"
              />
              {shouldShowError('dailyBudget') && (
                <div className="field-error">
                  <span className="error-message">{validationErrors.dailyBudget.error}</span>
                  {validationErrors.dailyBudget.suggestion && (
                    <span className="error-suggestion">{validationErrors.dailyBudget.suggestion}</span>
                  )}
                </div>
              )}
            </div>

            <div className={getFieldClassName('totalBudget')}>
              <label htmlFor="total-budget">Total Budget ($)</label>
              <input
                id="total-budget"
                type="number"
                min="1"
                step="0.01"
                value={formData.totalBudget || ''}
                onChange={(e) => handleFieldChange('totalBudget', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Optional"
              />
              {shouldShowError('totalBudget') && (
                <div className="field-error">
                  <span className="error-message">{validationErrors.totalBudget.error}</span>
                  {validationErrors.totalBudget.suggestion && (
                    <span className="error-suggestion">{validationErrors.totalBudget.suggestion}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className={getFieldClassName('startDate')}>
              <label htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => handleFieldChange('startDate', e.target.value)}
              />
              {shouldShowError('startDate') && (
                <div className="field-error">
                  <span className="error-message">{validationErrors.startDate?.error}</span>
                </div>
              )}
            </div>

            <div className={getFieldClassName('endDate')}>
              <label htmlFor="end-date">End Date</label>
              <input
                id="end-date"
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => handleFieldChange('endDate', e.target.value)}
              />
              {shouldShowError('endDate') && (
                <div className="field-error">
                  <span className="error-message">{validationErrors.endDate?.error}</span>
                </div>
              )}
            </div>
          </div>

          <div className={getFieldClassName('bidStrategy')}>
            <label htmlFor="bid-strategy">Bid Strategy *</label>
            <select
              id="bid-strategy"
              value={formData.bidStrategy || 'LOWEST_COST'}
              onChange={(e) => handleFieldChange('bidStrategy', e.target.value)}
            >
              <option value="LOWEST_COST">Lowest Cost</option>
              <option value="COST_CAP">Cost Cap</option>
              <option value="BID_CAP">Bid Cap</option>
            </select>
          </div>
        </section>


        {/* Audience Targeting Section */}
        <section className="form-section">
          <h2 className="section-title">Audience Targeting</h2>
          
          <div className="form-row">
            <div className={getFieldClassName('targeting.ageMin')}>
              <label htmlFor="age-min">Minimum Age *</label>
              <input
                id="age-min"
                type="number"
                min="13"
                max="65"
                value={formData.targeting?.ageMin || 18}
                onChange={(e) => handleNestedFieldChange('targeting', 'ageMin', parseInt(e.target.value))}
              />
              {shouldShowError('targeting.ageMin') && (
                <div className="field-error">
                  <span className="error-message">{validationErrors['targeting.ageMin']?.error}</span>
                </div>
              )}
            </div>

            <div className={getFieldClassName('targeting.ageMax')}>
              <label htmlFor="age-max">Maximum Age *</label>
              <input
                id="age-max"
                type="number"
                min="13"
                max="65"
                value={formData.targeting?.ageMax || 65}
                onChange={(e) => handleNestedFieldChange('targeting', 'ageMax', parseInt(e.target.value))}
              />
              {shouldShowError('targeting.ageMax') && (
                <div className="field-error">
                  <span className="error-message">{validationErrors['targeting.ageMax']?.error}</span>
                </div>
              )}
            </div>
          </div>

          <div className={getFieldClassName('targeting.genders')}>
            <label>Gender *</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.targeting?.genders?.includes('male') || false}
                  onChange={(e) => {
                    const genders = formData.targeting?.genders || [];
                    const newGenders = e.target.checked
                      ? [...genders, 'male']
                      : genders.filter(g => g !== 'male');
                    handleNestedFieldChange('targeting', 'genders', newGenders);
                  }}
                />
                Male
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.targeting?.genders?.includes('female') || false}
                  onChange={(e) => {
                    const genders = formData.targeting?.genders || [];
                    const newGenders = e.target.checked
                      ? [...genders, 'female']
                      : genders.filter(g => g !== 'female');
                    handleNestedFieldChange('targeting', 'genders', newGenders);
                  }}
                />
                Female
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.targeting?.genders?.includes('all') || false}
                  onChange={(e) => {
                    const genders = formData.targeting?.genders || [];
                    const newGenders = e.target.checked
                      ? [...genders, 'all']
                      : genders.filter(g => g !== 'all');
                    handleNestedFieldChange('targeting', 'genders', newGenders);
                  }}
                />
                All
              </label>
            </div>
            {shouldShowError('targeting.genders') && (
              <div className="field-error">
                <span className="error-message">{validationErrors['targeting.genders']?.error}</span>
              </div>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="locations">Locations</label>
            <textarea
              id="locations"
              value={JSON.stringify(formData.targeting?.locations || [])}
              onChange={(e) => {
                try {
                  const locations = JSON.parse(e.target.value);
                  handleNestedFieldChange('targeting', 'locations', locations);
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              placeholder='[{"country": "US", "region": "California"}]'
              rows="3"
            />
            <small className="field-hint">Enter as JSON array</small>
          </div>

          <div className="form-field">
            <label htmlFor="interests">Interests</label>
            <textarea
              id="interests"
              value={JSON.stringify(formData.targeting?.interests || [])}
              onChange={(e) => {
                try {
                  const interests = JSON.parse(e.target.value);
                  handleNestedFieldChange('targeting', 'interests', interests);
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              placeholder='[{"id": "123", "name": "Technology"}]'
              rows="3"
            />
            <small className="field-hint">Enter as JSON array</small>
          </div>

          <div className="form-field">
            <label htmlFor="behaviors">Behaviors</label>
            <textarea
              id="behaviors"
              value={JSON.stringify(formData.targeting?.behaviors || [])}
              onChange={(e) => {
                try {
                  const behaviors = JSON.parse(e.target.value);
                  handleNestedFieldChange('targeting', 'behaviors', behaviors);
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              placeholder='[{"id": "456", "name": "Online Shoppers"}]'
              rows="3"
            />
            <small className="field-hint">Enter as JSON array</small>
          </div>
        </section>


        {/* Ad Creative Section */}
        <section className="form-section">
          <h2 className="section-title">Ad Creative</h2>
          
          <div className={getFieldClassName('adCopy')}>
            <label htmlFor="ad-copy">Ad Copy *</label>
            <textarea
              id="ad-copy"
              value={formData.adCopy || ''}
              onChange={(e) => handleFieldChange('adCopy', e.target.value)}
              placeholder="Enter your ad copy"
              rows="4"
              maxLength={125}
            />
            <div className="character-count">
              {(formData.adCopy || '').length} / 125 characters
            </div>
            {shouldShowError('adCopy') && (
              <div className="field-error">
                <span className="error-message">{validationErrors.adCopy.error}</span>
                {validationErrors.adCopy.suggestion && (
                  <span className="error-suggestion">{validationErrors.adCopy.suggestion}</span>
                )}
              </div>
            )}
          </div>

          <div className={getFieldClassName('headlines')}>
            <label>Headlines *</label>
            {(formData.headlines || ['']).map((headline, index) => (
              <div key={index} className="array-field-item">
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => handleArrayFieldChange('headlines', index, e.target.value)}
                  placeholder={`Headline ${index + 1}`}
                  maxLength={40}
                />
                <div className="character-count-inline">
                  {headline.length} / 40
                </div>
                {(formData.headlines || []).length > 1 && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeArrayItem('headlines', index)}
                    aria-label="Remove headline"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {(formData.headlines || []).length < 15 && (
              <button
                type="button"
                className="add-button"
                onClick={() => addArrayItem('headlines', '')}
              >
                + Add Headline
              </button>
            )}
            {shouldShowError('headlines') && (
              <div className="field-error">
                <span className="error-message">{validationErrors.headlines.error}</span>
                {validationErrors.headlines.suggestion && (
                  <span className="error-suggestion">{validationErrors.headlines.suggestion}</span>
                )}
              </div>
            )}
          </div>

          <div className={getFieldClassName('descriptions')}>
            <label>Descriptions</label>
            {(formData.descriptions || []).map((description, index) => (
              <div key={index} className="array-field-item">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => handleArrayFieldChange('descriptions', index, e.target.value)}
                  placeholder={`Description ${index + 1}`}
                  maxLength={125}
                />
                <div className="character-count-inline">
                  {description.length} / 125
                </div>
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => removeArrayItem('descriptions', index)}
                  aria-label="Remove description"
                >
                  ×
                </button>
              </div>
            ))}
            {(formData.descriptions || []).length < 5 && (
              <button
                type="button"
                className="add-button"
                onClick={() => addArrayItem('descriptions', '')}
              >
                + Add Description
              </button>
            )}
          </div>

          <div className={getFieldClassName('callToAction')}>
            <label htmlFor="call-to-action">Call to Action *</label>
            <select
              id="call-to-action"
              value={formData.callToAction || ''}
              onChange={(e) => handleFieldChange('callToAction', e.target.value)}
            >
              <option value="">Select CTA</option>
              <option value="SHOP_NOW">Shop Now</option>
              <option value="LEARN_MORE">Learn More</option>
              <option value="SIGN_UP">Sign Up</option>
              <option value="DOWNLOAD">Download</option>
              <option value="BOOK_NOW">Book Now</option>
              <option value="CONTACT_US">Contact Us</option>
              <option value="GET_QUOTE">Get Quote</option>
              <option value="APPLY_NOW">Apply Now</option>
              <option value="SUBSCRIBE">Subscribe</option>
              <option value="WATCH_MORE">Watch More</option>
            </select>
            {shouldShowError('callToAction') && (
              <div className="field-error">
                <span className="error-message">{validationErrors.callToAction.error}</span>
              </div>
            )}
          </div>

          <div className={getFieldClassName('targetUrl')}>
            <label htmlFor="target-url">Target URL *</label>
            <input
              id="target-url"
              type="url"
              value={formData.targetUrl || ''}
              onChange={(e) => handleFieldChange('targetUrl', e.target.value)}
              placeholder="https://example.com"
            />
            {shouldShowError('targetUrl') && (
              <div className="field-error">
                <span className="error-message">{validationErrors.targetUrl.error}</span>
                {validationErrors.targetUrl.suggestion && (
                  <span className="error-suggestion">{validationErrors.targetUrl.suggestion}</span>
                )}
              </div>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="images">Image URLs</label>
            <textarea
              id="images"
              value={(formData.images || []).join('\n')}
              onChange={(e) => handleFieldChange('images', e.target.value.split('\n').filter(url => url.trim()))}
              placeholder="Enter image URLs (one per line)"
              rows="3"
            />
            <small className="field-hint">One URL per line, max 10 images</small>
          </div>

          <div className="form-field">
            <label htmlFor="videos">Video URLs</label>
            <textarea
              id="videos"
              value={(formData.videos || []).join('\n')}
              onChange={(e) => handleFieldChange('videos', e.target.value.split('\n').filter(url => url.trim()))}
              placeholder="Enter video URLs (one per line)"
              rows="3"
            />
            <small className="field-hint">One URL per line, max 5 videos</small>
          </div>
        </section>


        {/* Placements Section */}
        <section className="form-section">
          <h2 className="section-title">Placements</h2>
          
          <div className="form-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.placements?.automatic !== false}
                onChange={(e) => {
                  const placements = formData.placements || {};
                  handleFieldChange('placements', {
                    ...placements,
                    automatic: e.target.checked,
                  });
                }}
              />
              Automatic Placements (Recommended)
            </label>
          </div>

          {formData.placements?.automatic === false && (
            <>
              <div className="form-field">
                <label>Facebook Placements</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    Feed
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    Stories
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    In-Stream Videos
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    Reels
                  </label>
                </div>
              </div>

              <div className="form-field">
                <label>Instagram Placements</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    Feed
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    Stories
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    Reels
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    Explore
                  </label>
                </div>
              </div>

              <div className="form-field">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Audience Network
                </label>
              </div>

              <div className="form-field">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Messenger
                </label>
              </div>
            </>
          )}
        </section>


        {/* Optimization & Delivery Section */}
        <section className="form-section">
          <h2 className="section-title">Optimization & Delivery</h2>
          
          <div className={getFieldClassName('optimizationGoal')}>
            <label htmlFor="optimization-goal">Optimization Goal *</label>
            <select
              id="optimization-goal"
              value={formData.optimizationGoal || ''}
              onChange={(e) => handleFieldChange('optimizationGoal', e.target.value)}
            >
              <option value="">Select goal</option>
              <option value="CONVERSIONS">Conversions</option>
              <option value="LINK_CLICKS">Link Clicks</option>
              <option value="IMPRESSIONS">Impressions</option>
              <option value="REACH">Reach</option>
              <option value="LANDING_PAGE_VIEWS">Landing Page Views</option>
              <option value="POST_ENGAGEMENT">Post Engagement</option>
              <option value="VIDEO_VIEWS">Video Views</option>
              <option value="LEAD_GENERATION">Lead Generation</option>
            </select>
            {shouldShowError('optimizationGoal') && (
              <div className="field-error">
                <span className="error-message">{validationErrors.optimizationGoal.error}</span>
              </div>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="conversion-event">Conversion Event</label>
            <input
              id="conversion-event"
              type="text"
              value={formData.conversionEvent || ''}
              onChange={(e) => handleFieldChange('conversionEvent', e.target.value)}
              placeholder="e.g., Purchase, Lead, AddToCart"
            />
          </div>

          <div className={getFieldClassName('attributionWindow')}>
            <label htmlFor="attribution-window">Attribution Window *</label>
            <select
              id="attribution-window"
              value={formData.attributionWindow || '7_DAY_CLICK'}
              onChange={(e) => handleFieldChange('attributionWindow', e.target.value)}
            >
              <option value="1_DAY_CLICK">1 Day Click</option>
              <option value="7_DAY_CLICK">7 Day Click</option>
              <option value="7_DAY_CLICK_1_DAY_VIEW">7 Day Click, 1 Day View</option>
              <option value="28_DAY_CLICK">28 Day Click</option>
              <option value="28_DAY_CLICK_1_DAY_VIEW">28 Day Click, 1 Day View</option>
            </select>
            {shouldShowError('attributionWindow') && (
              <div className="field-error">
                <span className="error-message">{validationErrors.attributionWindow.error}</span>
              </div>
            )}
          </div>
        </section>


        {/* Autopilot Settings Section */}
        <section className="form-section">
          <h2 className="section-title">Autopilot Settings</h2>
          <p className="section-description">
            Enable advanced automation features for your campaign
          </p>
          
          <div className="form-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.enableCreativeRefresh || false}
                onChange={(e) => handleFieldChange('enableCreativeRefresh', e.target.checked)}
              />
              Enable Creative Refresh
            </label>
            <small className="field-hint">Automatically rotate ad creatives based on performance</small>
          </div>

          <div className="form-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.enableInventorySync || false}
                onChange={(e) => handleFieldChange('enableInventorySync', e.target.checked)}
              />
              Enable Inventory Sync
            </label>
            <small className="field-hint">Sync with product inventory to pause ads for out-of-stock items</small>
          </div>

          <div className="form-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.enableArbitrage || false}
                onChange={(e) => handleFieldChange('enableArbitrage', e.target.checked)}
              />
              Enable Arbitrage Optimization
            </label>
            <small className="field-hint">Automatically adjust bids based on profit margins</small>
          </div>

          <div className="form-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.enableWeatherBidding || false}
                onChange={(e) => handleFieldChange('enableWeatherBidding', e.target.checked)}
              />
              Enable Weather-Based Bidding
            </label>
            <small className="field-hint">Adjust bids based on weather conditions in target locations</small>
          </div>
        </section>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button-primary"
            disabled={isAutoFilling || isSubmitting || !isFormValid()}
          >
            {isSubmitting ? 'Validating...' : isAutoFilling ? 'Auto-filling...' : 'Save Campaign'}
          </button>
        </div>
      </div>
    </form>
  );
}
