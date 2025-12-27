/**
 * useChatIteration Hook
 * 
 * Manages chat-based campaign iteration including:
 * - Chat message state and history
 * - Sending messages with full campaign context
 * - Applying field updates from AI responses
 * - Maintaining conversation history
 * 
 * Requirements: 7.2, 7.3, 7.4, 7.5
 */

import { useState, useCallback } from 'react';
import { applyIterationChanges } from '../services/campaignGenerator.js';

/**
 * Custom hook for managing chat-based campaign iteration
 * @param {Object} options - Hook options
 * @param {Object} options.initialCampaign - Initial campaign data
 * @param {Array} options.initialHistory - Initial chat history
 * @param {Function} options.onIterationSuccess - Callback when iteration succeeds
 * @param {Function} options.onIterationError - Callback when iteration fails
 * @returns {Object} Chat state and methods
 */
export function useChatIteration({
  initialCampaign = null,
  initialHistory = [],
  onIterationSuccess,
  onIterationError,
} = {}) {
  const [currentCampaign, setCurrentCampaign] = useState(initialCampaign);
  const [chatHistory, setChatHistory] = useState(initialHistory);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [lastAffectedFields, setLastAffectedFields] = useState([]);

  /**
   * Sends a chat message and applies iteration changes
   * @param {string} userMessage - The user's message
   * @param {Object} context - Additional context
   * @param {string} context.userId - User ID for document retrieval
   * @param {string} context.additionalInfo - Additional context information
   * @returns {Promise<Object>} Updated campaign data
   */
  const sendMessage = useCallback(async (userMessage, context = {}) => {
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      const errorMsg = 'Message cannot be empty';
      setError(errorMsg);
      if (onIterationError) onIterationError(new Error(errorMsg));
      return null;
    }

    if (!currentCampaign) {
      const errorMsg = 'No campaign data available for iteration';
      setError(errorMsg);
      if (onIterationError) onIterationError(new Error(errorMsg));
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Add user message to chat history (Requirements 7.4, 7.5)
      const userChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };

      setChatHistory(prev => [...prev, userChatMessage]);

      // Send message with full campaign context (Requirements 7.2)
      const iterationResult = await applyIterationChanges(
        currentCampaign,
        userMessage,
        context
      );

      // Update only the affected fields (Requirements 7.3)
      const updatedCampaign = iterationResult.campaign;
      setCurrentCampaign(updatedCampaign);
      setLastAffectedFields(iterationResult.affectedFields || []);

      // Add assistant response to chat history (Requirements 7.4, 7.5)
      const assistantChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: iterationResult.message || iterationResult.explanation,
        timestamp: new Date(),
        affectedFields: iterationResult.affectedFields,
        metadata: {
          type: 'iteration',
          validationResult: iterationResult.validationResult,
        },
      };

      setChatHistory(prev => [...prev, assistantChatMessage]);

      // Call success callback
      if (onIterationSuccess) {
        onIterationSuccess(updatedCampaign, iterationResult);
      }

      return updatedCampaign;

    } catch (err) {
      console.error('Chat iteration failed:', err);
      const errorMessage = err.message || 'Failed to process message';
      setError(errorMessage);

      // Add error message to chat history
      const errorChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `I encountered an error: ${errorMessage}. Please try rephrasing your request.`,
        timestamp: new Date(),
        metadata: {
          type: 'error',
          error: errorMessage,
        },
      };

      setChatHistory(prev => [...prev, errorChatMessage]);

      // Call error callback
      if (onIterationError) {
        onIterationError(err);
      }

      return null;

    } finally {
      setIsProcessing(false);
    }
  }, [currentCampaign, onIterationSuccess, onIterationError]);

  /**
   * Updates the current campaign data
   * @param {Object} campaignData - New campaign data
   */
  const updateCampaign = useCallback((campaignData) => {
    setCurrentCampaign(campaignData);
  }, []);

  /**
   * Adds a message to chat history without processing
   * @param {Object} message - Chat message object
   */
  const addMessage = useCallback((message) => {
    if (!message || !message.role || !message.content) {
      console.warn('Invalid message format');
      return;
    }

    const chatMessage = {
      id: message.id || `${message.role}_${Date.now()}`,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || new Date(),
      affectedFields: message.affectedFields || [],
      metadata: message.metadata || {},
    };

    setChatHistory(prev => [...prev, chatMessage]);
  }, []);

  /**
   * Clears the chat history
   */
  const clearHistory = useCallback(() => {
    setChatHistory([]);
    setLastAffectedFields([]);
  }, []);

  /**
   * Resets chat history to initial state
   */
  const resetToInitial = useCallback(() => {
    setChatHistory(initialHistory);
    setCurrentCampaign(initialCampaign);
    setLastAffectedFields([]);
    setError(null);
  }, [initialHistory, initialCampaign]);

  /**
   * Loads chat history and campaign from saved state
   * @param {Object} savedState - Saved state object
   * @param {Array} savedState.chatHistory - Saved chat history
   * @param {Object} savedState.campaign - Saved campaign data
   */
  const loadState = useCallback((savedState) => {
    if (savedState.chatHistory) {
      setChatHistory(savedState.chatHistory);
    }
    if (savedState.campaign) {
      setCurrentCampaign(savedState.campaign);
    }
  }, []);

  /**
   * Gets the current state for saving
   * @returns {Object} Current state
   */
  const getState = useCallback(() => {
    return {
      chatHistory,
      campaign: currentCampaign,
    };
  }, [chatHistory, currentCampaign]);

  /**
   * Resets the iteration state
   */
  const reset = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setLastAffectedFields([]);
  }, []);

  /**
   * Clears any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Removes the last message from chat history (undo)
   */
  const undoLastMessage = useCallback(() => {
    setChatHistory(prev => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  /**
   * Gets messages filtered by role
   * @param {string} role - 'user' or 'assistant'
   * @returns {Array} Filtered messages
   */
  const getMessagesByRole = useCallback((role) => {
    return chatHistory.filter(msg => msg.role === role);
  }, [chatHistory]);

  return {
    // State
    currentCampaign,
    chatHistory,
    isProcessing,
    error,
    lastAffectedFields,

    // Methods
    sendMessage,
    updateCampaign,
    addMessage,
    clearHistory,
    resetToInitial,
    loadState,
    getState,
    reset,
    clearError,
    undoLastMessage,
    getMessagesByRole,
  };
}

export default useChatIteration;
