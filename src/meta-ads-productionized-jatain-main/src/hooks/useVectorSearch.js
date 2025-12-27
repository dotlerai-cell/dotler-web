/**
 * useVectorSearch Hook
 * 
 * Manages vector database queries including:
 * - Semantic search for relevant document chunks
 * - Result caching for performance
 * - Query state management
 * 
 * Requirements: 4.1, 8.3
 */

import { useState, useCallback, useRef } from 'react';
import { searchSimilar } from '../services/vectorDatabase.js';
import { generateEmbedding } from '../utils/embeddings.js';

/**
 * Custom hook for vector database search
 * @param {Object} options - Hook options
 * @param {string} options.userId - The authenticated user ID
 * @param {number} options.cacheTimeout - Cache timeout in milliseconds (default: 5 minutes)
 * @returns {Object} Search state and methods
 */
export function useVectorSearch({ userId, cacheTimeout = 5 * 60 * 1000 } = {}) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  
  // Cache for search results (Requirements 8.3 - embedding reuse)
  const cacheRef = useRef(new Map());
  const cacheTimestampsRef = useRef(new Map());

  /**
   * Generates a cache key from query text
   * @param {string} queryText - The query text
   * @param {number} topK - Number of results
   * @returns {string} Cache key
   */
  const getCacheKey = useCallback((queryText, topK) => {
    return `${queryText.toLowerCase().trim()}_${topK}`;
  }, []);

  /**
   * Checks if cached result is still valid
   * @param {string} cacheKey - The cache key
   * @returns {boolean} True if cache is valid
   */
  const isCacheValid = useCallback((cacheKey) => {
    const timestamp = cacheTimestampsRef.current.get(cacheKey);
    if (!timestamp) return false;
    
    const age = Date.now() - timestamp;
    return age < cacheTimeout;
  }, [cacheTimeout]);

  /**
   * Searches for similar document chunks using semantic search
   * @param {string} queryText - The search query text
   * @param {number} topK - Number of top results to return (default: 10)
   * @param {boolean} useCache - Whether to use cached results (default: true)
   * @returns {Promise<Array>} Array of search results
   */
  const search = useCallback(async (queryText, topK = 10, useCache = true) => {
    if (!userId) {
      const errorMsg = 'User ID is required for vector search';
      setError(errorMsg);
      return [];
    }

    if (!queryText || typeof queryText !== 'string' || queryText.trim().length === 0) {
      setSearchResults([]);
      return [];
    }

    // Check cache first (Requirements 8.3)
    const cacheKey = getCacheKey(queryText, topK);
    if (useCache && isCacheValid(cacheKey)) {
      const cachedResults = cacheRef.current.get(cacheKey);
      if (cachedResults) {
        setSearchResults(cachedResults);
        return cachedResults;
      }
    }

    setIsSearching(true);
    setError(null);

    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(queryText);

      // Search for similar chunks
      const results = await searchSimilar(userId, queryEmbedding, topK);

      // Update state
      setSearchResults(results);

      // Cache the results (Requirements 8.3)
      cacheRef.current.set(cacheKey, results);
      cacheTimestampsRef.current.set(cacheKey, Date.now());

      return results;

    } catch (err) {
      console.error('Vector search failed:', err);
      const errorMessage = err.message || 'Failed to search documents';
      setError(errorMessage);
      return [];

    } finally {
      setIsSearching(false);
    }
  }, [userId, getCacheKey, isCacheValid]);

  /**
   * Retrieves relevant chunks for campaign generation context
   * @param {string} contextText - Text to use for context retrieval
   * @param {number} topK - Number of chunks to retrieve
   * @returns {Promise<string[]>} Array of relevant text chunks
   */
  const getRelevantContext = useCallback(async (contextText, topK = 10) => {
    const results = await search(contextText, topK);
    return results.map(result => result.text);
  }, [search]);

  /**
   * Clears the search results cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    cacheTimestampsRef.current.clear();
  }, []);

  /**
   * Clears specific cache entry
   * @param {string} queryText - The query text
   * @param {number} topK - Number of results
   */
  const clearCacheEntry = useCallback((queryText, topK = 10) => {
    const cacheKey = getCacheKey(queryText, topK);
    cacheRef.current.delete(cacheKey);
    cacheTimestampsRef.current.delete(cacheKey);
  }, [getCacheKey]);

  /**
   * Resets the search state
   */
  const reset = useCallback(() => {
    setIsSearching(false);
    setSearchResults([]);
    setError(null);
  }, []);

  /**
   * Clears any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Gets cache statistics
   * @returns {Object} Cache statistics
   */
  const getCacheStats = useCallback(() => {
    return {
      size: cacheRef.current.size,
      entries: Array.from(cacheRef.current.keys()),
    };
  }, []);

  return {
    // State
    isSearching,
    searchResults,
    error,

    // Methods
    search,
    getRelevantContext,
    clearCache,
    clearCacheEntry,
    reset,
    clearError,
    getCacheStats,
  };
}

export default useVectorSearch;
