/**
 * Tests for Error Handling Utilities
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
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
} from '../errorHandling.js';

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
    // Clear console mocks
    vi.clearAllMocks();
  });

  describe('classifyError', () => {
    test('should classify document processing errors', () => {
      const error = new Error('Failed to extract PDF content');
      expect(classifyError(error)).toBe(ErrorCategory.DOCUMENT_PROCESSING);
    });

    test('should classify network errors', () => {
      const error = new Error('Network request failed');
      expect(classifyError(error)).toBe(ErrorCategory.NETWORK);
    });

    test('should classify timeout errors', () => {
      const error = new Error('Request timeout');
      expect(classifyError(error)).toBe(ErrorCategory.NETWORK);
    });

    test('should classify validation errors', () => {
      const error = new Error('Invalid form data');
      expect(classifyError(error)).toBe(ErrorCategory.VALIDATION);
    });

    test('should classify AI generation errors', () => {
      const error = new Error('Gemini API failed');
      expect(classifyError(error)).toBe(ErrorCategory.AI_GENERATION);
    });

    test('should classify database errors', () => {
      const error = new Error('Firestore write failed');
      expect(classifyError(error)).toBe(ErrorCategory.DATABASE);
    });

    test('should classify unknown errors', () => {
      const error = new Error('Something went wrong');
      expect(classifyError(error)).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('getUserFriendlyMessage', () => {
    test('should return friendly message for PDF format errors', () => {
      const error = new Error('Invalid file format');
      const message = getUserFriendlyMessage(error);
      expect(message).toBe(UserFriendlyMessages.INVALID_PDF_FORMAT);
    });

    test('should return friendly message for timeout errors', () => {
      const error = new Error('Request timeout');
      const message = getUserFriendlyMessage(error);
      expect(message).toBe(UserFriendlyMessages.API_TIMEOUT);
    });

    test('should return friendly message for CORS errors', () => {
      const error = new Error('CORS policy blocked');
      const message = getUserFriendlyMessage(error);
      expect(message).toBe(UserFriendlyMessages.CORS_ERROR);
    });

    test('should return original message if user-friendly', () => {
      const error = new Error('Please try again');
      const message = getUserFriendlyMessage(error);
      expect(message).toBe('Please try again');
    });

    test('should return generic message for unknown errors', () => {
      const error = new Error('Error: Internal server error with stack trace...');
      const message = getUserFriendlyMessage(error);
      expect(message).toBe(UserFriendlyMessages.UNKNOWN_ERROR);
    });
  });

  describe('logError', () => {
    test('should log error with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      const context = { userId: '123', action: 'upload' };
      
      logError(error, context);
      
      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall[0]).toBe('[Error Handler]');
      expect(logCall[1]).toMatchObject({
        category: expect.any(String),
        message: 'Test error',
        context,
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('retryWithBackoff', () => {
    test('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
      });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('should throw error after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(
        retryWithBackoff(fn, { maxRetries: 2, initialDelay: 10 })
      ).rejects.toThrow('Network error');
      
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    test('should not retry if shouldRetry returns false', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Validation error'));
      
      await expect(
        retryWithBackoff(fn, {
          maxRetries: 3,
          shouldRetry: () => false,
        })
      ).rejects.toThrow('Validation error');
      
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should call onRetry callback', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const onRetry = vi.fn();
      
      await retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelay: 10,
        onRetry,
      });
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, 10, expect.any(Error));
    });

    test('should use exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const delays = [];
      const onRetry = vi.fn((attempt, delay) => {
        delays.push(delay);
      });
      
      await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 100,
        onRetry,
      });
      
      // Delays should be exponential: 100, 200
      expect(delays[0]).toBe(100);
      expect(delays[1]).toBe(200);
    });

    test('should respect maxDelay', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const delays = [];
      const onRetry = vi.fn((attempt, delay) => {
        delays.push(delay);
      });
      
      await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 1500,
        onRetry,
      });
      
      // Second delay would be 2000, but should be capped at 1500
      expect(delays[1]).toBe(1500);
    });
  });

  describe('shouldRetryError', () => {
    test('should not retry validation errors', () => {
      const error = new Error('Invalid input');
      expect(shouldRetryError(error)).toBe(false);
    });

    test('should not retry permission errors', () => {
      const error = new Error('Permission denied');
      expect(shouldRetryError(error)).toBe(false);
    });

    test('should not retry API key errors', () => {
      const error = new Error('Invalid API key');
      expect(shouldRetryError(error)).toBe(false);
    });

    test('should not retry CORS errors', () => {
      const error = new Error('CORS policy blocked');
      expect(shouldRetryError(error)).toBe(false);
    });

    test('should retry network errors', () => {
      const error = new Error('Network request failed');
      expect(shouldRetryError(error)).toBe(true);
    });

    test('should retry timeout errors', () => {
      const error = new Error('Request timeout');
      expect(shouldRetryError(error)).toBe(true);
    });

    test('should retry rate limiting errors', () => {
      const error = new Error('Rate limit exceeded');
      expect(shouldRetryError(error)).toBe(true);
    });

    test('should retry 5xx server errors', () => {
      const error = new Error('500 Internal Server Error');
      expect(shouldRetryError(error)).toBe(true);
    });
  });

  describe('useCachedFallback', () => {
    test('should return fresh data and cache it', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'fresh' });
      
      const result = await useCachedFallback('test-key', fetchFn);
      
      expect(result).toEqual({ data: 'fresh' });
      expect(fetchFn).toHaveBeenCalledTimes(1);
      
      // Check cache
      const stats = getCacheStats();
      expect(stats.size).toBe(1);
    });

    test('should return cached data on error', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'fresh' });
      
      // First call succeeds and caches
      await useCachedFallback('test-key', fetchFn);
      
      // Second call fails but returns cached data
      fetchFn.mockRejectedValue(new Error('Network error'));
      const result = await useCachedFallback('test-key', fetchFn);
      
      expect(result).toEqual({ data: 'fresh' });
    });

    test('should throw error if no cache available', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(
        useCachedFallback('test-key', fetchFn)
      ).rejects.toThrow('Network error');
    });

    test('should respect maxAge option', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'fresh' });
      
      // Cache data
      await useCachedFallback('test-key', fetchFn, { maxAge: 100 });
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should throw error because cache is too old
      fetchFn.mockRejectedValue(new Error('Network error'));
      await expect(
        useCachedFallback('test-key', fetchFn, { 
          maxAge: 100,
          returnStaleOnError: false 
        })
      ).rejects.toThrow('Network error');
    });

    test('should return stale cache if returnStaleOnError is true', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'fresh' });
      
      // Cache data
      await useCachedFallback('test-key', fetchFn, { maxAge: 100 });
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should return stale cache
      fetchFn.mockRejectedValue(new Error('Network error'));
      const result = await useCachedFallback('test-key', fetchFn, { 
        maxAge: 100,
        returnStaleOnError: true 
      });
      
      expect(result).toEqual({ data: 'fresh' });
    });
  });

  describe('clearCache', () => {
    test('should clear specific cache entry', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      
      await useCachedFallback('key1', fetchFn);
      await useCachedFallback('key2', fetchFn);
      
      expect(getCacheStats().size).toBe(2);
      
      clearCache('key1');
      
      expect(getCacheStats().size).toBe(1);
    });

    test('should clear all cache entries', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      
      await useCachedFallback('key1', fetchFn);
      await useCachedFallback('key2', fetchFn);
      
      expect(getCacheStats().size).toBe(2);
      
      clearCache();
      
      expect(getCacheStats().size).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    test('should return cache statistics', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });
      
      await useCachedFallback('key1', fetchFn);
      await useCachedFallback('key2', fetchFn);
      
      const stats = getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.entries).toHaveLength(2);
      expect(stats.entries[0]).toMatchObject({
        key: expect.any(String),
        age: expect.any(Number),
        timestamp: expect.any(Number),
      });
    });
  });

  describe('handlePartialSuccess', () => {
    test('should handle all successful results', () => {
      const results = [
        { success: true, data: 'result1', id: '1' },
        { success: true, data: 'result2', id: '2' },
        { success: true, data: 'result3', id: '3' },
      ];
      
      const result = handlePartialSuccess(results);
      
      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.summary.successRate).toBe(100);
      expect(result.summary.allSucceeded).toBe(true);
      expect(result.summary.hasFailures).toBe(false);
      expect(result.successful).toEqual(['result1', 'result2', 'result3']);
      expect(result.failed).toEqual([]);
    });

    test('should handle all failed results', () => {
      const results = [
        { success: false, error: new Error('Error 1'), id: '1' },
        { success: false, error: new Error('Error 2'), id: '2' },
      ];
      
      const result = handlePartialSuccess(results);
      
      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(0);
      expect(result.summary.failed).toBe(2);
      expect(result.summary.successRate).toBe(0);
      expect(result.summary.allFailed).toBe(true);
      expect(result.summary.hasFailures).toBe(true);
      expect(result.successful).toEqual([]);
      expect(result.failed).toHaveLength(2);
    });

    test('should handle mixed results', () => {
      const results = [
        { success: true, data: 'result1', id: '1' },
        { success: false, error: new Error('Network error'), id: '2' },
        { success: true, data: 'result3', id: '3' },
        { success: false, error: new Error('Validation error'), id: '4' },
      ];
      
      const result = handlePartialSuccess(results);
      
      expect(result.summary.total).toBe(4);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(2);
      expect(result.summary.successRate).toBe(50);
      expect(result.summary.hasFailures).toBe(true);
      expect(result.summary.allSucceeded).toBe(false);
      expect(result.summary.allFailed).toBe(false);
      expect(result.successful).toEqual(['result1', 'result3']);
      expect(result.failed).toHaveLength(2);
      expect(result.failed[0]).toMatchObject({
        id: '2',
        error: expect.any(Error),
        message: expect.any(String),
        category: expect.any(String),
      });
    });

    test('should handle empty results', () => {
      const results = [];
      
      const result = handlePartialSuccess(results);
      
      expect(result.summary.total).toBe(0);
      expect(result.summary.successful).toBe(0);
      expect(result.summary.failed).toBe(0);
      expect(result.summary.successRate).toBe(0);
    });
  });

  describe('createUserError', () => {
    test('should create user-friendly error object', () => {
      const error = new Error('Network request failed');
      const context = { action: 'upload', userId: '123' };
      
      const userError = createUserError(error, context);
      
      expect(userError).toMatchObject({
        message: expect.any(String),
        category: ErrorCategory.NETWORK,
        originalError: 'Network request failed',
        context,
        timestamp: expect.any(String),
        canRetry: true,
      });
    });

    test('should indicate if error can be retried', () => {
      const retryableError = new Error('Network timeout');
      const nonRetryableError = new Error('Invalid API key');
      
      const userError1 = createUserError(retryableError);
      const userError2 = createUserError(nonRetryableError);
      
      expect(userError1.canRetry).toBe(true);
      expect(userError2.canRetry).toBe(false);
    });
  });

  describe('withErrorHandling', () => {
    test('should execute function normally', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const wrapped = withErrorHandling(fn);
      
      const result = await wrapped('arg1', 'arg2');
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('should wrap errors with user-friendly messages', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'));
      const wrapped = withErrorHandling(fn);
      
      await expect(wrapped()).rejects.toThrow();
      
      try {
        await wrapped();
      } catch (error) {
        expect(error.category).toBe(ErrorCategory.NETWORK);
        expect(error.canRetry).toBe(true);
        expect(error.originalError).toBeInstanceOf(Error);
      }
    });

    test('should use retry logic when enabled', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const wrapped = withErrorHandling(fn, {
        retry: true,
        retryOptions: { maxRetries: 2, initialDelay: 10 },
      });
      
      const result = await wrapped();
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('should use cache fallback when enabled', async () => {
      const fn = vi.fn().mockResolvedValue({ data: 'fresh' });
      
      const wrapped = withErrorHandling(fn, {
        cache: true,
        cacheKey: 'test-key',
      });
      
      // First call
      await wrapped();
      
      // Second call should use cache on error
      fn.mockRejectedValue(new Error('Network error'));
      const result = await wrapped();
      
      expect(result).toEqual({ data: 'fresh' });
    });

    test('should call onError callback', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Test error'));
      const onError = vi.fn();
      
      const wrapped = withErrorHandling(fn, { onError });
      
      await expect(wrapped()).rejects.toThrow();
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
