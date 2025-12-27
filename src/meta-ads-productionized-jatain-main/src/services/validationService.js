/**
 * Validation Service
 * 
 * Provides comprehensive validation for campaign form fields,
 * including Meta Ads API constraint checking, budget validation,
 * date range validation, and real-time validation support.
 */

import { validationConfig } from '../config/aiConfig.js';

/**
 * Meta Ads API Constraints
 * Based on Meta's official API documentation
 */
const META_CONSTRAINTS = {
  // Campaign objectives
  validObjectives: [
    'OUTCOME_SALES',
    'OUTCOME_LEADS',
    'OUTCOME_AWARENESS',
    'OUTCOME_TRAFFIC',
    'OUTCOME_ENGAGEMENT',
    'OUTCOME_APP_PROMOTION'
  ],
  
  // Campaign status
  validStatuses: ['ACTIVE', 'PAUSED', 'ARCHIVED'],
  
  // Bid strategies
  validBidStrategies: ['LOWEST_COST', 'COST_CAP', 'BID_CAP'],
  
  // Budget constraints
  minDailyBudget: validationConfig.minDailyBudget,
  maxDailyBudget: validationConfig.maxDailyBudget,
  minTotalBudget: 1,
  
  // Age constraints
  minAge: 13,
  maxAge: 65,
  
  // Gender options
  validGenders: ['male', 'female', 'all'],
  
  // Text length constraints
  maxCampaignNameLength: 100,
  maxAdCopyLength: 125,
  maxHeadlineLength: 40,
  maxDescriptionLength: 125,
  maxUrlLength: 2048,
  
  // Call to action options
  validCallToActions: [
    'SHOP_NOW',
    'LEARN_MORE',
    'SIGN_UP',
    'DOWNLOAD',
    'BOOK_NOW',
    'CONTACT_US',
    'GET_QUOTE',
    'APPLY_NOW',
    'SUBSCRIBE',
    'WATCH_MORE'
  ],
  
  // Optimization goals
  validOptimizationGoals: [
    'CONVERSIONS',
    'LINK_CLICKS',
    'IMPRESSIONS',
    'REACH',
    'LANDING_PAGE_VIEWS',
    'POST_ENGAGEMENT',
    'VIDEO_VIEWS',
    'LEAD_GENERATION'
  ],
  
  // Attribution windows
  validAttributionWindows: [
    '1_DAY_CLICK',
    '7_DAY_CLICK',
    '7_DAY_CLICK_1_DAY_VIEW',
    '28_DAY_CLICK',
    '28_DAY_CLICK_1_DAY_VIEW'
  ],
  
  // Array limits
  maxHeadlines: 15,
  maxDescriptions: 5,
  maxImages: 10,
  maxVideos: 5,
};

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the field is valid
 * @property {string} [error] - Error message if invalid
 * @property {string} [suggestion] - Suggestion for fixing the error
 */

/**
 * Validates campaign name
 * @param {string} name - Campaign name
 * @returns {ValidationResult}
 */
export function validateCampaignName(name) {
  if (!name || typeof name !== 'string') {
    return {
      valid: false,
      error: 'Campaign name is required',
    };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return {
      valid: false,
      error: 'Campaign name cannot be empty',
    };
  }

  if (trimmedName.length > META_CONSTRAINTS.maxCampaignNameLength) {
    return {
      valid: false,
      error: `Campaign name must be ${META_CONSTRAINTS.maxCampaignNameLength} characters or less`,
      suggestion: `Current length: ${trimmedName.length}. Please shorten by ${trimmedName.length - META_CONSTRAINTS.maxCampaignNameLength} characters.`,
    };
  }

  return { valid: true };
}

/**
 * Validates campaign objective
 * @param {string} objective - Campaign objective
 * @returns {ValidationResult}
 */
export function validateObjective(objective) {
  if (!objective) {
    return {
      valid: false,
      error: 'Campaign objective is required',
    };
  }

  if (!META_CONSTRAINTS.validObjectives.includes(objective)) {
    return {
      valid: false,
      error: 'Invalid campaign objective',
      suggestion: `Must be one of: ${META_CONSTRAINTS.validObjectives.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates campaign status
 * @param {string} status - Campaign status
 * @returns {ValidationResult}
 */
export function validateStatus(status) {
  if (!status) {
    return {
      valid: false,
      error: 'Campaign status is required',
    };
  }

  if (!META_CONSTRAINTS.validStatuses.includes(status)) {
    return {
      valid: false,
      error: 'Invalid campaign status',
      suggestion: `Must be one of: ${META_CONSTRAINTS.validStatuses.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates daily budget with suggestions
 * @param {number} budget - Daily budget amount
 * @returns {ValidationResult}
 */
export function validateDailyBudget(budget) {
  if (budget === null || budget === undefined) {
    return {
      valid: false,
      error: 'Daily budget is required',
    };
  }

  const numericBudget = Number(budget);

  if (isNaN(numericBudget)) {
    return {
      valid: false,
      error: 'Daily budget must be a valid number',
    };
  }

  if (numericBudget < META_CONSTRAINTS.minDailyBudget) {
    return {
      valid: false,
      error: `Daily budget must be at least $${META_CONSTRAINTS.minDailyBudget}`,
      suggestion: `Minimum daily budget: $${META_CONSTRAINTS.minDailyBudget}. Consider starting with $10-20 for testing.`,
    };
  }

  if (numericBudget > META_CONSTRAINTS.maxDailyBudget) {
    return {
      valid: false,
      error: `Daily budget cannot exceed $${META_CONSTRAINTS.maxDailyBudget}`,
      suggestion: `Maximum daily budget: $${META_CONSTRAINTS.maxDailyBudget}. Consider splitting into multiple campaigns.`,
    };
  }

  return { valid: true };
}

/**
 * Validates total budget
 * @param {number} totalBudget - Total budget amount
 * @param {number} dailyBudget - Daily budget amount (for comparison)
 * @returns {ValidationResult}
 */
export function validateTotalBudget(totalBudget, dailyBudget) {
  // Total budget is optional
  if (totalBudget === null || totalBudget === undefined || totalBudget === '') {
    return { valid: true };
  }

  const numericTotal = Number(totalBudget);

  if (isNaN(numericTotal)) {
    return {
      valid: false,
      error: 'Total budget must be a valid number',
    };
  }

  if (numericTotal < META_CONSTRAINTS.minTotalBudget) {
    return {
      valid: false,
      error: `Total budget must be at least $${META_CONSTRAINTS.minTotalBudget}`,
    };
  }

  // If daily budget is set, total should be at least equal to daily
  if (dailyBudget && numericTotal < dailyBudget) {
    return {
      valid: false,
      error: 'Total budget must be at least equal to daily budget',
      suggestion: `Daily budget is $${dailyBudget}. Total budget should be at least $${dailyBudget}.`,
    };
  }

  return { valid: true };
}

/**
 * Validates bid strategy
 * @param {string} bidStrategy - Bid strategy
 * @returns {ValidationResult}
 */
export function validateBidStrategy(bidStrategy) {
  if (!bidStrategy) {
    return {
      valid: false,
      error: 'Bid strategy is required',
    };
  }

  if (!META_CONSTRAINTS.validBidStrategies.includes(bidStrategy)) {
    return {
      valid: false,
      error: 'Invalid bid strategy',
      suggestion: `Must be one of: ${META_CONSTRAINTS.validBidStrategies.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates date range with specific error messages
 * @param {string} startDate - Start date (ISO format or null)
 * @param {string} endDate - End date (ISO format or null)
 * @returns {ValidationResult}
 */
export function validateDateRange(startDate, endDate) {
  // Both dates are optional (campaign can run indefinitely)
  if (!startDate && !endDate) {
    return { valid: true };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today

  // Validate start date
  if (startDate) {
    const start = new Date(startDate);
    
    if (isNaN(start.getTime())) {
      return {
        valid: false,
        error: 'Invalid start date format',
        suggestion: 'Please select a valid date',
      };
    }

    // Start date cannot be in the past
    if (start < now) {
      return {
        valid: false,
        error: 'Start date cannot be in the past',
        suggestion: 'Please select today or a future date',
      };
    }
  }

  // Validate end date
  if (endDate) {
    const end = new Date(endDate);
    
    if (isNaN(end.getTime())) {
      return {
        valid: false,
        error: 'Invalid end date format',
        suggestion: 'Please select a valid date',
      };
    }

    // End date must be in the future
    if (end < now) {
      return {
        valid: false,
        error: 'End date cannot be in the past',
        suggestion: 'Please select a future date',
      };
    }
  }

  // If both dates are set, validate the range
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return {
        valid: false,
        error: 'End date must be after start date',
        suggestion: 'Please select an end date that comes after the start date',
      };
    }

    // Calculate duration
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (durationDays < validationConfig.minCampaignDuration) {
      return {
        valid: false,
        error: `Campaign must run for at least ${validationConfig.minCampaignDuration} day(s)`,
        suggestion: `Current duration: ${durationDays} day(s). Minimum: ${validationConfig.minCampaignDuration} day(s).`,
      };
    }

    if (durationDays > validationConfig.maxCampaignDuration) {
      return {
        valid: false,
        error: `Campaign duration cannot exceed ${validationConfig.maxCampaignDuration} days`,
        suggestion: `Current duration: ${durationDays} days. Maximum: ${validationConfig.maxCampaignDuration} days.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validates age range
 * @param {number} ageMin - Minimum age
 * @param {number} ageMax - Maximum age
 * @returns {ValidationResult}
 */
export function validateAgeRange(ageMin, ageMax) {
  if (ageMin === null || ageMin === undefined) {
    return {
      valid: false,
      error: 'Minimum age is required',
    };
  }

  if (ageMax === null || ageMax === undefined) {
    return {
      valid: false,
      error: 'Maximum age is required',
    };
  }

  const minAge = Number(ageMin);
  const maxAge = Number(ageMax);

  if (isNaN(minAge) || isNaN(maxAge)) {
    return {
      valid: false,
      error: 'Age values must be valid numbers',
    };
  }

  if (minAge < META_CONSTRAINTS.minAge) {
    return {
      valid: false,
      error: `Minimum age must be at least ${META_CONSTRAINTS.minAge}`,
      suggestion: `Meta Ads requires a minimum age of ${META_CONSTRAINTS.minAge}`,
    };
  }

  if (maxAge > META_CONSTRAINTS.maxAge) {
    return {
      valid: false,
      error: `Maximum age cannot exceed ${META_CONSTRAINTS.maxAge}`,
      suggestion: `Meta Ads allows a maximum age of ${META_CONSTRAINTS.maxAge}`,
    };
  }

  if (minAge > maxAge) {
    return {
      valid: false,
      error: 'Minimum age cannot be greater than maximum age',
      suggestion: `Current range: ${minAge}-${maxAge}. Please adjust the values.`,
    };
  }

  return { valid: true };
}

/**
 * Validates genders array
 * @param {string[]} genders - Array of gender values
 * @returns {ValidationResult}
 */
export function validateGenders(genders) {
  if (!Array.isArray(genders) || genders.length === 0) {
    return {
      valid: false,
      error: 'At least one gender must be selected',
    };
  }

  const invalidGenders = genders.filter(g => !META_CONSTRAINTS.validGenders.includes(g));
  
  if (invalidGenders.length > 0) {
    return {
      valid: false,
      error: 'Invalid gender value(s)',
      suggestion: `Valid options: ${META_CONSTRAINTS.validGenders.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates ad copy text
 * @param {string} adCopy - Ad copy text
 * @returns {ValidationResult}
 */
export function validateAdCopy(adCopy) {
  if (!adCopy || typeof adCopy !== 'string') {
    return {
      valid: false,
      error: 'Ad copy is required',
    };
  }

  const trimmedCopy = adCopy.trim();
  
  if (trimmedCopy.length === 0) {
    return {
      valid: false,
      error: 'Ad copy cannot be empty',
    };
  }

  if (trimmedCopy.length > META_CONSTRAINTS.maxAdCopyLength) {
    return {
      valid: false,
      error: `Ad copy must be ${META_CONSTRAINTS.maxAdCopyLength} characters or less`,
      suggestion: `Current length: ${trimmedCopy.length}. Please shorten by ${trimmedCopy.length - META_CONSTRAINTS.maxAdCopyLength} characters.`,
    };
  }

  return { valid: true };
}

/**
 * Validates headlines array
 * @param {string[]} headlines - Array of headline strings
 * @returns {ValidationResult}
 */
export function validateHeadlines(headlines) {
  if (!Array.isArray(headlines) || headlines.length === 0) {
    return {
      valid: false,
      error: 'At least one headline is required',
    };
  }

  if (headlines.length > META_CONSTRAINTS.maxHeadlines) {
    return {
      valid: false,
      error: `Maximum ${META_CONSTRAINTS.maxHeadlines} headlines allowed`,
      suggestion: `You have ${headlines.length} headlines. Please remove ${headlines.length - META_CONSTRAINTS.maxHeadlines}.`,
    };
  }

  // Check each headline
  for (let i = 0; i < headlines.length; i++) {
    const headline = headlines[i];
    
    if (!headline || typeof headline !== 'string') {
      return {
        valid: false,
        error: `Headline ${i + 1} is invalid`,
      };
    }

    const trimmed = headline.trim();
    
    if (trimmed.length === 0) {
      return {
        valid: false,
        error: `Headline ${i + 1} cannot be empty`,
      };
    }

    if (trimmed.length > META_CONSTRAINTS.maxHeadlineLength) {
      return {
        valid: false,
        error: `Headline ${i + 1} exceeds ${META_CONSTRAINTS.maxHeadlineLength} characters`,
        suggestion: `Current length: ${trimmed.length}. Please shorten by ${trimmed.length - META_CONSTRAINTS.maxHeadlineLength} characters.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validates descriptions array
 * @param {string[]} descriptions - Array of description strings
 * @returns {ValidationResult}
 */
export function validateDescriptions(descriptions) {
  // Descriptions are optional
  if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) {
    return { valid: true };
  }

  if (descriptions.length > META_CONSTRAINTS.maxDescriptions) {
    return {
      valid: false,
      error: `Maximum ${META_CONSTRAINTS.maxDescriptions} descriptions allowed`,
      suggestion: `You have ${descriptions.length} descriptions. Please remove ${descriptions.length - META_CONSTRAINTS.maxDescriptions}.`,
    };
  }

  // Check each description
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i];
    
    if (!description || typeof description !== 'string') {
      continue; // Skip empty descriptions
    }

    const trimmed = description.trim();
    
    if (trimmed.length > META_CONSTRAINTS.maxDescriptionLength) {
      return {
        valid: false,
        error: `Description ${i + 1} exceeds ${META_CONSTRAINTS.maxDescriptionLength} characters`,
        suggestion: `Current length: ${trimmed.length}. Please shorten by ${trimmed.length - META_CONSTRAINTS.maxDescriptionLength} characters.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validates call to action
 * @param {string} callToAction - Call to action value
 * @returns {ValidationResult}
 */
export function validateCallToAction(callToAction) {
  if (!callToAction) {
    return {
      valid: false,
      error: 'Call to action is required',
    };
  }

  if (!META_CONSTRAINTS.validCallToActions.includes(callToAction)) {
    return {
      valid: false,
      error: 'Invalid call to action',
      suggestion: `Must be one of: ${META_CONSTRAINTS.validCallToActions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates target URL
 * @param {string} url - Target URL
 * @returns {ValidationResult}
 */
export function validateTargetUrl(url) {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'Target URL is required',
    };
  }

  const trimmedUrl = url.trim();
  
  if (trimmedUrl.length === 0) {
    return {
      valid: false,
      error: 'Target URL cannot be empty',
    };
  }

  if (trimmedUrl.length > META_CONSTRAINTS.maxUrlLength) {
    return {
      valid: false,
      error: `URL exceeds maximum length of ${META_CONSTRAINTS.maxUrlLength} characters`,
    };
  }

  // Basic URL format validation
  try {
    new URL(trimmedUrl);
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format',
      suggestion: 'URL must start with http:// or https://',
    };
  }

  return { valid: true };
}

/**
 * Validates optimization goal
 * @param {string} goal - Optimization goal
 * @returns {ValidationResult}
 */
export function validateOptimizationGoal(goal) {
  if (!goal) {
    return {
      valid: false,
      error: 'Optimization goal is required',
    };
  }

  if (!META_CONSTRAINTS.validOptimizationGoals.includes(goal)) {
    return {
      valid: false,
      error: 'Invalid optimization goal',
      suggestion: `Must be one of: ${META_CONSTRAINTS.validOptimizationGoals.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates attribution window
 * @param {string} window - Attribution window
 * @returns {ValidationResult}
 */
export function validateAttributionWindow(window) {
  if (!window) {
    return {
      valid: false,
      error: 'Attribution window is required',
    };
  }

  if (!META_CONSTRAINTS.validAttributionWindows.includes(window)) {
    return {
      valid: false,
      error: 'Invalid attribution window',
      suggestion: `Must be one of: ${META_CONSTRAINTS.validAttributionWindows.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates a complete campaign form
 * @param {Object} formData - Complete campaign form data
 * @returns {Object} Validation results for all fields
 */
export function validateCampaignForm(formData) {
  const results = {
    valid: true,
    errors: {},
  };

  // Validate all fields
  const validations = {
    name: validateCampaignName(formData.name),
    objective: validateObjective(formData.objective),
    status: validateStatus(formData.status),
    dailyBudget: validateDailyBudget(formData.dailyBudget),
    totalBudget: validateTotalBudget(formData.totalBudget, formData.dailyBudget),
    bidStrategy: validateBidStrategy(formData.bidStrategy),
    dateRange: validateDateRange(formData.startDate, formData.endDate),
    ageRange: validateAgeRange(formData.targeting?.ageMin, formData.targeting?.ageMax),
    genders: validateGenders(formData.targeting?.genders),
    adCopy: validateAdCopy(formData.adCopy),
    headlines: validateHeadlines(formData.headlines),
    descriptions: validateDescriptions(formData.descriptions),
    callToAction: validateCallToAction(formData.callToAction),
    targetUrl: validateTargetUrl(formData.targetUrl),
    optimizationGoal: validateOptimizationGoal(formData.optimizationGoal),
    attributionWindow: validateAttributionWindow(formData.attributionWindow),
  };

  // Collect errors
  Object.entries(validations).forEach(([field, result]) => {
    if (!result.valid) {
      results.valid = false;
      results.errors[field] = {
        error: result.error,
        suggestion: result.suggestion,
      };
    }
  });

  return results;
}

/**
 * Validates a single field in real-time
 * @param {string} fieldName - Name of the field to validate
 * @param {any} value - Value to validate
 * @param {Object} formData - Complete form data (for context-dependent validation)
 * @returns {ValidationResult}
 */
export function validateField(fieldName, value, formData = {}) {
  switch (fieldName) {
    case 'name':
      return validateCampaignName(value);
    
    case 'objective':
      return validateObjective(value);
    
    case 'status':
      return validateStatus(value);
    
    case 'dailyBudget':
      return validateDailyBudget(value);
    
    case 'totalBudget':
      return validateTotalBudget(value, formData.dailyBudget);
    
    case 'bidStrategy':
      return validateBidStrategy(value);
    
    case 'startDate':
    case 'endDate':
      return validateDateRange(
        fieldName === 'startDate' ? value : formData.startDate,
        fieldName === 'endDate' ? value : formData.endDate
      );
    
    case 'targeting.ageMin':
    case 'targeting.ageMax':
      return validateAgeRange(
        fieldName === 'targeting.ageMin' ? value : formData.targeting?.ageMin,
        fieldName === 'targeting.ageMax' ? value : formData.targeting?.ageMax
      );
    
    case 'targeting.genders':
      return validateGenders(value);
    
    case 'adCopy':
      return validateAdCopy(value);
    
    case 'headlines':
      return validateHeadlines(value);
    
    case 'descriptions':
      return validateDescriptions(value);
    
    case 'callToAction':
      return validateCallToAction(value);
    
    case 'targetUrl':
      return validateTargetUrl(value);
    
    case 'optimizationGoal':
      return validateOptimizationGoal(value);
    
    case 'attributionWindow':
      return validateAttributionWindow(value);
    
    default:
      return { valid: true };
  }
}

export default {
  validateCampaignName,
  validateObjective,
  validateStatus,
  validateDailyBudget,
  validateTotalBudget,
  validateBidStrategy,
  validateDateRange,
  validateAgeRange,
  validateGenders,
  validateAdCopy,
  validateHeadlines,
  validateDescriptions,
  validateCallToAction,
  validateTargetUrl,
  validateOptimizationGoal,
  validateAttributionWindow,
  validateCampaignForm,
  validateField,
  META_CONSTRAINTS,
};
