import { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';

/**
 * ChatInterface Component
 * 
 * Handles conversational AI interaction for campaign iteration.
 * Displays message history with user/assistant distinction, shows typing indicator,
 * and highlights affected fields in messages.
 */
export default function ChatInterface({ 
  chatHistory = [], 
  onSendMessage, 
  isProcessing = false,
  disabled = false 
}) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isProcessing]);

  /**
   * Auto-resize textarea based on content
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  /**
   * Scrolls to the bottom of the message list
   */
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Handles message input change
   */
  function handleMessageChange(e) {
    setMessage(e.target.value);
  }

  /**
   * Handles sending a message
   */
  function handleSend() {
    if (!message.trim() || isProcessing || disabled) {
      return;
    }

    // Notify parent component
    if (onSendMessage) {
      onSendMessage(message.trim());
    }

    // Clear input
    setMessage('');
  }

  /**
   * Handles Enter key press (Shift+Enter for new line)
   */
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /**
   * Formats timestamp for display
   */
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Renders a chat message
   */
  function renderMessage(msg, index) {
    const isUser = msg.role === 'user';
    const isAssistant = msg.role === 'assistant';

    return (
      <div 
        key={msg.id || index} 
        className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}
      >
        <div className="message-avatar">
          {isUser ? '👤' : '🤖'}
        </div>
        <div className="message-content">
          <div className="message-header">
            <span className="message-role">
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            <span className="message-timestamp">
              {formatTimestamp(msg.timestamp)}
            </span>
          </div>
          <div className="message-text">
            {msg.content}
          </div>
          {msg.affectedFields && msg.affectedFields.length > 0 && (
            <div className="affected-fields">
              <span className="affected-fields-label">Updated fields:</span>
              <div className="affected-fields-list">
                {msg.affectedFields.map((field, idx) => (
                  <span key={idx} className="affected-field-tag">
                    {formatFieldName(field)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /**
   * Formats field names for display
   */
  function formatFieldName(fieldName) {
    // Convert camelCase or snake_case to Title Case
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>Campaign Iteration Chat</h3>
        <p className="chat-subtitle">
          Ask questions or request changes to refine your campaign
        </p>
      </div>

      {/* Messages Container */}
      <div className="chat-messages">
        {chatHistory.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-state-icon">💬</div>
            <p className="empty-state-text">
              Start a conversation to refine your campaign
            </p>
            <p className="empty-state-hint">
              Try asking: "Make the ad copy more casual" or "Increase the budget to $500/day"
            </p>
          </div>
        ) : (
          <>
            {chatHistory.map((msg, index) => renderMessage(msg, index))}
            
            {/* Typing Indicator */}
            {isProcessing && (
              <div className="chat-message assistant-message typing-indicator">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-role">AI Assistant</span>
                  </div>
                  <div className="typing-dots">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder={disabled ? "Generate a campaign first to start chatting..." : "Type your message... (Shift+Enter for new line)"}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          disabled={isProcessing || disabled}
          rows={1}
        />
        <button
          className="chat-send-button"
          onClick={handleSend}
          disabled={!message.trim() || isProcessing || disabled}
          aria-label="Send message"
        >
          {isProcessing ? (
            <span className="button-spinner" />
          ) : (
            '➤'
          )}
        </button>
      </div>

      {/* Input Hint */}
      <p className="chat-input-hint">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
