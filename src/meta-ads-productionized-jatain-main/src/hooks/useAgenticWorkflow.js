/**
 * useAgenticWorkflow Hook
 *
 * Provides access to the agentic workflow for Meta Ads campaign generation
 * Integrates with the dashboard UI to handle user input and display results
 */

import { useState, useCallback } from 'react';
import { executeAgenticWorkflow } from '../services/agenticWorkflow';
import { useDocumentUpload } from './useDocumentUpload';

export function useAgenticWorkflow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);
  const { uploadedDocuments } = useDocumentUpload();

  /**
   * Execute the complete agentic workflow
   */
  const runWorkflow = useCallback(async (userPrompt, options = {}) => {
    const {
      websiteUrl = null,
      userPreferences = {},
      onProgress = null
    } = options;

    // Reset previous state
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      // Get document IDs from uploaded documents
      const documentIds = uploadedDocuments.map(doc => doc.id);

      // Execute the workflow
      const workflowResult = await executeAgenticWorkflow(userPrompt, {
        websiteUrl,
        documentIds,
        userPreferences,
        onProgress: (step, message) => {
          setProgress({ step, message });
          if (onProgress) onProgress(step, message);
        }
      });

      if (workflowResult.success) {
        setResult(workflowResult);
        return workflowResult;
      } else {
        throw new Error(workflowResult.error || 'Workflow execution failed');
      }

    } catch (err) {
      console.error('Agentic workflow error:', err);
      setError(err.message || 'Failed to execute agentic workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [uploadedDocuments]);

  /**
   * Execute individual agent steps for debugging/advanced use
   */
  const runAgentStep = useCallback(async (agentName, params) => {
    setLoading(true);
    setError(null);

    try {
      let result;
      switch (agentName) {
        case 'promptBuilder':
          // Import dynamically to avoid circular dependencies
          const { buildPrompt } = await import('../services/agenticWorkflow');
          result = await buildPrompt(params.userPrompt, params.additionalContext);
          break;

        case 'ragAgent':
          const { retrieveContext } = await import('../services/agenticWorkflow');
          result = await retrieveContext(params.generationContext);
          break;

        case 'adGenerator':
          const { generateAdCampaign } = await import('../services/agenticWorkflow');
          result = await generateAdCampaign(
            params.generationContext,
            params.retrievedContext
          );
          break;

        default:
          throw new Error(`Unknown agent: ${agentName}`);
      }

      return result;
    } catch (err) {
      console.error(`Agent ${agentName} error:`, err);
      setError(err.message || `Failed to execute ${agentName}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get workflow status information
   */
  const getWorkflowStatus = useCallback(() => {
    return {
      isLoading: loading,
      hasError: !!error,
      hasResult: !!result,
      currentProgress: progress,
      uploadedDocumentCount: uploadedDocuments.length
    };
  }, [loading, error, result, progress, uploadedDocuments]);

  return {
    runWorkflow,
    runAgentStep,
    getWorkflowStatus,
    result,
    error,
    loading,
    progress
  };
}
