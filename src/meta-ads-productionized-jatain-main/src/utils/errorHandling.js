/**
 * Error Handling Utilities
 * 
 * Provides robust error handling, retry logic, caching fallbacks,
 * and partial success handling for the AI Campaign Generator system.
 */

/**
 * Error categories for classification
 */
export const ErrorCategory = {
  DOCUMENT_PROCESSING: 'document_processing',
  NETWORK: 'network',
  VALIDATION: 'validation',
  AI_GENERATION: 'ai_generation',
  DATABASE: 'database',
  UNKNOWN: 'unknown',
};

/**
 * User-friendly error messages mapped to error types
 */
export const UserFriendlyMessages = {
  // Document Processing Errors
  INVALID_PDF_FORMAT: 'The file format is not supported. Please upload a valid PDF file.',
  CORRUPTED_FILE: 'The file appears to be corrupted. Please try uploading a different file.',
  FILE_TOO_LARGE: 'The file is too large. Please upload a file smaller than 10MB.',
  TEXT_EXTRACTION_FAILED: 'Unable to extract text from the PDF. The file may be password-protected or corrupted.',
  EMBEDDING_GENERATION_FAILED: 'Failed to process the document. Please try again.',
  
  // Network Errors
  API_TIMEOUT: 'The request took too long. Please check your connection and try again.',
  RATE_LIMITING: 'Too many requests. Please wait a moment and try again.',
  CONNECTION_FAILURE: 'Unable to connect to the server. Please check your internet connection.',
  CORS_ERROR: 'Unable to access the website due to security restrictions. Please enter information manually.',
  
  // Validation Errors
  INVALID_FORM_DATA: 'Some form fields contain invalid data. Please review and correct them.',
  META_API_CONSTRAINT_VIOLATION: 'The campaign data does not meet Meta Ads requirements. Please adjust your settings.',
  MISSING_REQUIRED_FIELDS: 'Please fill in all required fields before submitting.',
  BUDGET_OUT_OF_RANGE: 'The budget must be between the minimum and maximum allowed values.',
  
  // AI Generation Errors
  GEMINI_API_FAILURE: 'The AI service is temporarily unavailable. Please try again in a moment.',
  INVALID_JSON_RESPONSE: 'Received an unexpected response from the AI. Please try generating again.',
  INCOMPLETE_GENERATION: 'The campaign generation was incomplete. Please try again.',
  CONTEXT_TOO_LARGE: 'Too much context provided. Please reduce the amount of information and try again.',
  
  // Database Errors
  FIRESTORE_WRITE_FAILURE: 'Failed to save data. Please check your connection and try again.',
  VECTOR_STORAGE_FAILURE: 'Failed to store document embeddings. Please try uploading again.',
  QUERY_TIMEOUT: 'The database query took too long. Please try again.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

/**
 * Classifies an error into a category
 * @param {Error} error - The error to classify
 * @returns {string} Error category
 */
export function classifyError(error) {
  const message = error.message?.toLowerCase() || '';
  
  // Document processing errors
  if (message.includes('pdf') || message.includes('file') || message.includes('extract')) {
    return ErrorCategory.DOCUMENT_PROCESSING;
  }
  
  // Network errors
  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('cors') ||
    message.includes('rate limit') ||
    error.name === 'AbortError' ||
    error.name === 'TypeError'
  ) {
    return ErrorCategory.NETWORK;
  }
  
  // Validation errors
  if (message.includes('invalid') || message.includes('validation') || message.includes('required')) {
    return ErrorCategory.VALIDATION;
  }
  
  // AI generation errors
  if (message.includes('gemini') || message.includes('api') || message.includes('json')) {
    return ErrorCategory.AI_GENERATION;
  }
  
  // Database errors
  if (
    message.includes('firestore') ||
    message.includes('database') ||
    message.includes('permission') ||
    message.includes('query')
  ) {
    return ErrorCategory.DATABASE;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Gets a user-friendly error message for an error
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error) {
  const message = error.message?.toLowerCase() || '';
  
  // Check for specific error patterns
  if (message.includes('invalid file format') || message.includes('not a pdf')) {
    return UserFriendlyMessages.INVALID_PDF_FORMAT;
  }
  if (message.includes('corrupted') || message.includes('damaged')) {
    return UserFriendlyMessages.CORRUPTED_FILE;
  }
  if (message.includes('file size') || message.includes('too large')) {
    return UserFriendlyMessages.FILE_TOO_LARGE;
  }
  if (message.includes('extract text') || message.includes('password')) {
    return UserFriendlyMessages.TEXT_EXTRACTION_FAILED;
  }
  if (message.includes('embedding')) {
    return UserFriendlyMessages.EMBEDDING_GENERATION_FAILED;
  }
  if (message.includes('timeout') || message.includes('took too long')) {
    return UserFriendlyMessages.API_TIMEOUT;
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return UserFriendlyMessages.RATE_LIMITING;
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return UserFriendlyMessages.CONNECTION_FAILURE;
  }
  if (message.includes('cors')) {
    return UserFriendlyMessages.CORS_ERROR;
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return UserFriendlyMessages.INVALID_FORM_DATA;
  }
  if (message.includes('constraint') || message.includes('meta ads')) {
    return UserFriendlyMessages.META_API_CONSTRAINT_VIOLATION;
  }
  if (message.includes('required field')) {
    return UserFriendlyMessages.MISSING_REQUIRED_FIELDS;
  }
  if (message.includes('budget')) {
    return UserFriendlyMessages.BUDGET_OUT_OF_RANGE;
  }
  if (message.includes('gemini') || message.includes('ai service')) {
    return UserFriendlyMessages.GEMINI_API_FAILURE;
  }
  if (message.includes('json') || message.includes('parse')) {
    return UserFriendlyMessages.INVALID_JSON_RESPONSE;
  }
  if (message.includes('incomplete')) {
    return UserFriendlyMessages.INCOMPLETE_GENERATION;
  }
  if (message.includes('context') || message.includes('too large')) {
    return UserFriendlyMessages.CONTEXT_TOO_LARGE;
  }
  if (message.includes('firestore') || message.includes('write')) {
    return UserFriendlyMessages.FIRESTORE_WRITE_FAILURE;
  }
  if (message.includes('vector') || message.includes('storage')) {
    return UserFriendlyMessages.VECTOR_STORAGE_FAILURE;
  }
  if (message.includes('query timeout')) {
    return UserFriendlyMessages.QUERY_TIMEOUT;
  }
  if (message.includes('permission')) {
    return UserFriendlyMessages.PERMISSION_DENIED;
  }
  
  // Fallback to original message if it's user-friendly enough, otherwise use generic
  if (error.message && error.message.length < 150 && !error.message.includes('Error:')) {
    return error.message;
  }
  
  return UserFriendlyMessages.UNKNOWN_ERROR;
}

/**
 * Logs an error with context information
 * @param {Error} error - The error to log
 * @param {Object} context - Additional context information
 */
export function logError(error, context = {}) {
  const category = classifyError(error);
  const timestamp = new Date().toISOString();
  
  console.error('[Error Handler]', {
    timestamp,
    category,
    message: error.message,
    stack: error.stack,
    context,
  });
  
  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or similar
}

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @param {Function} options.onRetry - Callback called before each retry
 * @returns {Promise<any>} Result of the function
 * @throws {Error} Last error if all retries fail
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
    onRetry = null,
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (!shouldRetry(error)) {
        logError(error, { attempt, reason: 'non-retryable' });
        throw error;
      }
      
      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        logError(error, { attempt, reason: 'max-retries-exceeded' });
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      
      // Log retry attempt
      logError(error, { 
        attempt: attempt + 1, 
        maxRetries, 
        nextRetryIn: delay,
        reason: 'retrying'
      });
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, delay, error);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Determines if an error should be retried
 * @param {Error} error - The error to check
 * @returns {boolean} True if error should be retried
 */
export function shouldRetryError(error) {
  const message = error.message?.toLowerCase() || '';
  
  // Don't retry validation errors
  if (message.includes('invalid') || message.includes('validation')) {
    return false;
  }
  
  // Don't retry permission errors
  if (message.includes('permission') || message.includes('unauthorized')) {
    return false;
  }
  
  // Don't retry API key errors
  if (message.includes('api key') || message.includes('authentication')) {
    return false;
  }
  
  // Don't retry CORS errors (they won't succeed on retry)
  if (message.includes('cors')) {
    return false;
  }
  
  // Retry network errors
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    error.name === 'AbortError'
  ) {
    return true;
  }
  
  // Retry rate limiting errors
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return true;
  }
  
  // Retry temporary server errors (5xx)
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return true;
  }
  
  // Default: don't retry
  return false;
}

/**
 * Cache for storing fallback data
 */
const cache = new Map();

/**
 * Uses cached data as fallback when function fails
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data
 * @param {Object} options - Options
 * @param {number} options.maxAge - Maximum age of cached data in ms (default: 5 minutes)
 * @param {boolean} options.returnStaleOnError - Return stale cache on error (default: true)
 * @returns {Promise<any>} Fresh or cached data
 */
export async function useCachedFallback(key, fetchFn, options = {}) {
  const {
    maxAge = 5 * 60 * 1000, // 5 minutes
    returnStaleOnError = true,
  } = options;
  
  try {
    // Try to fetch fresh data
    const data = await fetchFn();
    
    // Store in cache with timestamp
    cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    
    return data;
  } catch (error) {
    logError(error, { key, action: 'fetch-failed-checking-cache' });
    
    // Check if we have cached data
    const cached = cache.get(key);
    
    if (!cached) {
      // No cache available, throw error
      throw error;
    }
    
    const age = Date.now() - cached.timestamp;
    
    // Return cached data if it's fresh enough or if we allow stale data
    if (age <= maxAge || returnStaleOnError) {
      console.warn(`[Cache Fallback] Using cached data for key: ${key} (age: ${age}ms)`);
      return cached.data;
    }
    
    // Cache is too old and we don't allow stale data
    throw error;
  }
}

/**
 * Clears cached data for a specific key or all keys
 * @param {string} [key] - Cache key to clear, or undefined to clear all
 */
export function clearCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Gets cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  const entries = Array.from(cache.entries());
  const now = Date.now();
  
  return {
    size: cache.size,
    entries: entries.map(([key, value]) => ({
      key,
      age: now - value.timestamp,
      timestamp: value.timestamp,
    })),
  };
}

/**
 * Handles partial success in batch operations
 * @param {Array<{success: boolean, data?: any, error?: Error, id?: string}>} results - Array of operation results
 * @returns {Object} Partial success result with summary
 */
export function handlePartialSuccess(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const summary = {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: results.length > 0 ? (successful.length / results.length) * 100 : 0,
    hasFailures: failed.length > 0,
    allSucceeded: failed.length === 0,
    allFailed: successful.length === 0,
  };
  
  // Collect error information
  const errors = failed.map(r => ({
    id: r.id,
    error: r.error,
    message: getUserFriendlyMessage(r.error),
    category: classifyError(r.error),
  }));
  
  // Log partial failures
  if (failed.length > 0) {
    console.warn('[Partial Success]', {
      summary,
      failedCount: failed.length,
      errors: errors.map(e => e.message),
    });
  }
  
  return {
    summary,
    successful: successful.map(r => r.data),
    failed: errors,
    results,
  };
}

/**
 * Creates a user-friendly error object
 * @param {Error} error - Original error
 * @param {Object} context - Additional context
 * @returns {Object} User-friendly error object
 */
export function createUserError(error, context = {}) {
  const category = classifyError(error);
  const message = getUserFriendlyMessage(error);
  
  return {
    message,
    category,
    originalError: error.message,
    context,
    timestamp: new Date().toISOString(),
    canRetry: shouldRetryError(error),
  };
}

/**
 * Wraps an async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, options = {}) {
  const {
    retry = false,
    retryOptions = {},
    cache = false,
    cacheKey = null,
    cacheOptions = {},
    onError = null,
  } = options;
  
  return async function(...args) {
    try {
      let result;
      
      if (retry) {
        // Use retry logic
        result = await retryWithBackoff(() => fn(...args), retryOptions);
      } else if (cache && cacheKey) {
        // Use cache fallback
        result = await useCachedFallback(cacheKey, () => fn(...args), cacheOptions);
      } else {
        // Execute normally
        result = await fn(...args);
      }
      
      return result;
    } catch (error) {
      // Log error
      logError(error, { function: fn.name, args });
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
      
      // Create user-friendly error
      const userError = createUserError(error, { function: fn.name });
      
      // Throw user-friendly error
      const enhancedError = new Error(userError.message);
      enhancedError.category = userError.category;
      enhancedError.canRetry = userError.canRetry;
      enhancedError.originalError = error;
      
      throw enhancedError;
    }
  };
}

export default {
  ErrorCategory,
  UserFriendlyMessages,
  classifyError,
  getUserFriendlyMessage,
  logError,
  retryWithBackoff,
  shouldRetryError,
  useCachedFallback,
  clearCache,
  getCacheStats,
  handlePartialSuccess,
  createUserError,
  withErrorHandling,
};
