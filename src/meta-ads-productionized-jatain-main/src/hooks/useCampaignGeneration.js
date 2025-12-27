/**
 * useCampaignGeneration Hook
 * 
 * Manages campaign generation state and flow including:
 * - Context gathering from documents and website
 * - Triggering AI generation
 * - Validation of generated campaigns
 * - Progress tracking
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { useState, useCallback } from 'react';
import { generate, validate } from '../services/campaignGenerator.js';

/**
 * Custom hook for managing campaign generation
 * @param {Object} options - Hook options
 * @param {Function} options.onSuccess - Callback when generation succeeds
 * @param {Function} options.onError - Callback when generation fails
 * @returns {Object} Generation state and methods
 */
export function useCampaignGeneration({ onSuccess, onError } = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ step: '', message: '' });
  const [error, setError] = useState(null);
  const [generatedCampaign, setGeneratedCampaign] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  /**
   * Generates a campaign from provided context
   * @param {Object} params - Generation parameters
   * @param {string} params.userId - The authenticated user ID
   * @param {string[]} params.documentIds - IDs of documents to use
   * @param {string} params.websiteUrl - Product website URL
   * @param {string} params.additionalInfo - Additional context
   * @param {Object} params.userPreferences - User preferences
   * @returns {Promise<Object>} Generated campaign data
   */
  const generateCampaign = useCallback(async (params) => {
    const {
      userId,
      documentIds = [],
      websiteUrl = null,
      additionalInfo = '',
      userPreferences = {},
    } = params;

    // Validate required parameters
    if (!userId) {
      const errorMsg = 'User ID is required for campaign generation';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return null;
    }

    // Reset state
    setIsGenerating(true);
    setError(null);
    setProgress({ step: 'starting', message: 'Starting campaign generation...' });
    setGeneratedCampaign(null);
    setValidationResult(null);

    try {
      // Call the generation service with progress callback
      const campaign = await generate({
        userId,
        documentIds,
        websiteUrl,
        additionalInfo,
        userPreferences,
        onProgress: (step, message) => {
          setProgress({ step, message });
        },
      });

      // Validate the generated campaign
      const validation = validate(campaign);
      setValidationResult(validation);

      // Store the generated campaign
      setGeneratedCampaign(campaign);
      setProgress({ step: 'complete', message: 'Campaign generated successfully!' });

      // Call success callback
      if (onSuccess) {
        onSuccess(campaign, validation);
      }

      return campaign;

    } catch (err) {
      console.error('Campaign generation failed:', err);
      const errorMessage = err.message || 'Failed to generate campaign';
      setError(errorMessage);
      setProgress({ step: 'error', message: errorMessage });

      // Call error callback
      if (onError) {
        onError(err);
      }

      return null;

    } finally {
      setIsGenerating(false);
    }
  }, [onSuccess, onError]);

  /**
   * Validates a campaign without generating
   * @param {Object} campaignData - Campaign data to validate
   * @returns {Object} Validation result
   */
  const validateCampaign = useCallback((campaignData) => {
    try {
      const validation = validate(campaignData);
      setValidationResult(validation);
      return validation;
    } catch (err) {
      console.error('Validation failed:', err);
      return {
        valid: false,
        errors: {
          general: {
            error: err.message || 'Validation failed',
          },
        },
      };
    }
  }, []);

  /**
   * Resets the generation state
   */
  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress({ step: '', message: '' });
    setError(null);
    setGeneratedCampaign(null);
    setValidationResult(null);
  }, []);

  /**
   * Clears any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isGenerating,
    progress,
    error,
    generatedCampaign,
    validationResult,

    // Methods
    generateCampaign,
    validateCampaign,
    reset,
    clearError,
  };
}

export default useCampaignGeneration;
