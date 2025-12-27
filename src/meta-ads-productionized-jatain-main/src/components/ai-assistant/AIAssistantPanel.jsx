import { useState } from 'react';
import DocumentUploader from './DocumentUploader';
import WebsiteInput from './WebsiteInput';
import AdditionalInfoInput from './AdditionalInfoInput';
import ChatInterface from './ChatInterface';
import './AIAssistantPanel.css';

/**
 * AIAssistantPanel Component
 * 
 * Container component for the AI assistant interface.
 * Integrates document upload, website input, additional info, and chat interface.
 * Manages panel state and visibility, and orchestrates campaign generation.
 */
export default function AIAssistantPanel({
  onGenerate,
  onChatMessage,
  uploadedDocuments = [],
  chatHistory = [],
  isGenerating = false,
  generationComplete = false,
  isIterating = false,
}) {
  const [documents, setDocuments] = useState(uploadedDocuments);
  const [scrapedData, setScrapedData] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  /**
   * Handles document list changes from DocumentUploader
   */
  function handleDocumentsChange(newDocuments) {
    setDocuments(newDocuments);
  }

  /**
   * Handles scraped website data
   */
  function handleScrapedData(data) {
    setScrapedData(data);
  }

  /**
   * Handles manual website entry
   */
  function handleManualEntry(data) {
    setScrapedData(data);
  }

  /**
   * Handles additional info changes
   */
  function handleAdditionalInfoChange(info) {
    setAdditionalInfo(info);
  }

  /**
   * Handles Generate Campaign button click
   */
  function handleGenerateClick() {
    if (isGenerating) return;

    // Prepare generation context
    const context = {
      documentIds: documents.map(doc => doc.id),
      websiteUrl: scrapedData?.url,
      websiteData: scrapedData,
      additionalInfo: additionalInfo.trim() || undefined,
    };

    // Notify parent component
    if (onGenerate) {
      onGenerate(context);
    }
  }

  /**
   * Handles chat message sending
   */
  function handleChatMessageSend(message) {
    if (onChatMessage) {
      onChatMessage(message);
    }
  }

  /**
   * Toggles panel collapse state
   */
  function togglePanelCollapse() {
    setIsPanelCollapsed(!isPanelCollapsed);
  }

  /**
   * Checks if generate button should be enabled
   */
  const canGenerate = !isGenerating && (
    documents.length > 0 || 
    scrapedData !== null || 
    additionalInfo.trim().length > 0
  );

  return (
    <div className={`ai-assistant-panel ${isPanelCollapsed ? 'collapsed' : ''}`}>
      {/* Panel Header */}
      <div className="panel-header">
        <h2>AI Campaign Assistant</h2>
        <button
          className="collapse-button"
          onClick={togglePanelCollapse}
          aria-label={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
          title={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isPanelCollapsed ? '◀' : '▶'}
        </button>
      </div>

      {/* Panel Content */}
      {!isPanelCollapsed && (
        <div className="panel-content">
          {/* Input Section - Only show before generation or when not iterating */}
          {!generationComplete && (
            <div className="input-section">
              <p className="panel-description">
                Provide information about your business to generate an optimized campaign.
              </p>

              {/* Document Uploader */}
              <DocumentUploader onDocumentsChange={handleDocumentsChange} />

              {/* Website Input */}
              <WebsiteInput 
                onScrapedData={handleScrapedData}
                onManualEntry={handleManualEntry}
              />

              {/* Additional Info Input */}
              <AdditionalInfoInput 
                onInfoChange={handleAdditionalInfoChange}
              />

              {/* Generate Button */}
              <div className="generate-section">
                <button
                  className="generate-button"
                  onClick={handleGenerateClick}
                  disabled={!canGenerate}
                >
                  {isGenerating ? (
                    <>
                      <span className="button-spinner" />
                      Generating Campaign...
                    </>
                  ) : (
                    <>
                      <span className="button-icon">✨</span>
                      Generate Campaign
                    </>
                  )}
                </button>

                {!canGenerate && !isGenerating && (
                  <p className="generate-hint">
                    Please upload a document, provide a website URL, or add additional information to generate a campaign.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Chat Interface - Show after generation completes */}
          {generationComplete && (
            <div className="chat-section">
              <ChatInterface
                chatHistory={chatHistory}
                onSendMessage={handleChatMessageSend}
                isProcessing={isIterating}
                disabled={false}
              />
            </div>
          )}

          {/* Loading State During Generation */}
          {isGenerating && (
            <div className="generation-loading">
              <div className="loading-spinner" />
              <h3>Generating Your Campaign</h3>
              <p>Analyzing your business information and creating optimized campaign parameters...</p>
              <div className="loading-steps">
                <div className="loading-step">
                  <span className="step-icon">📄</span>
                  <span>Retrieving document context</span>
                </div>
                <div className="loading-step">
                  <span className="step-icon">🌐</span>
                  <span>Processing website information</span>
                </div>
                <div className="loading-step">
                  <span className="step-icon">🤖</span>
                  <span>Generating campaign parameters</span>
                </div>
                <div className="loading-step">
                  <span className="step-icon">✓</span>
                  <span>Validating and optimizing</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed State */}
      {isPanelCollapsed && (
        <div className="collapsed-content">
          <p className="collapsed-text">AI Assistant</p>
        </div>
      )}
    </div>
  );
}
