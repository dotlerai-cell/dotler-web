import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CampaignForm from '../components/campaign/CampaignForm';
import AIAssistantPanel from '../components/ai-assistant/AIAssistantPanel';
import { generate, applyIterationChanges } from '../services/campaignGenerator';
import { useMetaAPI } from '../hooks/useMetaAPI';
import { validateCampaignForm } from '../services/validationService';
import './CampaignGenerator.css';

/**
 * CampaignGenerator Page Component
 * 
 * Main page for AI-powered campaign generation.
 * Features a two-column layout with CampaignForm on the left and AIAssistantPanel on the right.
 * Manages state between form and AI panel, handles generation and iteration.
 */
export default function CampaignGenerator() {
  const { currentUser } = useAuth();
  const { createCampaign, isConfigured, connectedAccount } = useMetaAPI();

  // Form data state
  const [formData, setFormData] = useState(getInitialFormData());
  
  // Generation state
  const [generationStatus, setGenerationStatus] = useState('idle'); // 'idle' | 'generating' | 'complete' | 'error'
  const [generationError, setGenerationError] = useState(null);
  
  // Submission state
  const [submissionStatus, setSubmissionStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [submissionError, setSubmissionError] = useState(null);
  const [submittedCampaignId, setSubmittedCampaignId] = useState(null);
  
  // Document and context state
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  
  // Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [isIterating, setIsIterating] = useState(false);
  
  // Auto-fill state
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState([]);
  const [manuallyEditedFields, setManuallyEditedFields] = useState(new Set());

  /**
   * Handles form field changes
   */
  function handleFormChange(field, value) {
    setFormData(prev => {
      // Handle nested fields (e.g., 'targeting.ageMin')
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      
      return {
        ...prev,
        [field]: value
      };
    });
  }

  /**
   * Handles marking a field as manually edited
   */
  function handleFieldManuallyEdited(fieldName) {
    setManuallyEditedFields(prev => new Set([...prev, fieldName]));
  }

  /**
   * Handles campaign generation trigger
   */
  async function handleGenerate(context) {
    if (!currentUser) {
      setGenerationError('User not authenticated');
      return;
    }

    setGenerationStatus('generating');
    setGenerationError(null);
    setIsAutoFilling(true);

    try {
      // Generate campaign with progress tracking
      const campaignData = await generate({
        userId: currentUser.uid,
        documentIds: context.documentIds || [],
        websiteUrl: context.websiteUrl,
        additionalInfo: context.additionalInfo,
        userPreferences: {},
        onProgress: (step, message) => {
          console.log(`Generation progress: ${step} - ${message}`);
        }
      });

      // Update form data with generated campaign
      setFormData(campaignData);
      
      // Mark generation as complete
      setGenerationStatus('complete');
      
      // Add initial message to chat history
      setChatHistory([{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I\'ve generated your campaign based on the information provided. Feel free to ask me to make any changes or answer questions about the campaign.',
        timestamp: new Date(),
        metadata: {
          type: 'generation'
        }
      }]);

      // Highlight all fields briefly
      const allFields = Object.keys(campaignData);
      setHighlightedFields(allFields);
      
      // Remove highlights after animation
      setTimeout(() => {
        setHighlightedFields([]);
        setIsAutoFilling(false);
      }, 1000);

    } catch (error) {
      console.error('Campaign generation failed:', error);
      setGenerationStatus('error');
      setGenerationError(error.message || 'Failed to generate campaign');
      setIsAutoFilling(false);
    }
  }

  /**
   * Handles chat message from user (iteration)
   */
  async function handleChatMessage(message) {
    if (!currentUser || !message.trim()) {
      return;
    }

    // Add user message to chat history
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setIsIterating(true);
    setIsAutoFilling(true);

    try {
      // Apply iteration changes
      const iterationResult = await applyIterationChanges(
        formData,
        message,
        {
          userId: currentUser.uid,
          additionalInfo: ''
        }
      );

      // Update form data with changes
      setFormData(iterationResult.campaign);

      // Highlight affected fields
      if (iterationResult.affectedFields && iterationResult.affectedFields.length > 0) {
        setHighlightedFields(iterationResult.affectedFields);
        
        // Remove highlights after animation
        setTimeout(() => {
          setHighlightedFields([]);
          setIsAutoFilling(false);
        }, 1000);
      } else {
        setIsAutoFilling(false);
      }

      // Add assistant response to chat history
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: iterationResult.message || iterationResult.explanation,
        timestamp: new Date(),
        affectedFields: iterationResult.affectedFields,
        metadata: {
          type: 'iteration'
        }
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Campaign iteration failed:', error);
      
      // Add error message to chat
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm sorry, I encountered an error while processing your request: ${error.message}. Please try rephrasing your request.`,
        timestamp: new Date(),
        metadata: {
          type: 'error'
        }
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
      setIsAutoFilling(false);
    } finally {
      setIsIterating(false);
    }
  }

  /**
   * Handles form submission
   */
  async function handleFormSubmit() {
    // Check if Meta API is configured
    if (!isConfigured()) {
      setSubmissionError('Meta API is not configured. Please connect your Meta account first.');
      setSubmissionStatus('error');
      return;
    }

    // Validate form before submission (Requirements 13.1)
    const validation = validateCampaignForm(formData);
    
    if (!validation.valid) {
      // Show validation errors
      const errorMessages = Object.entries(validation.errors)
        .map(([field, error]) => `${field}: ${error.error}`)
        .join('\n');
      
      setSubmissionError(`Please fix the following validation errors:\n${errorMessages}`);
      setSubmissionStatus('error');
      return;
    }

    // Start submission
    setSubmissionStatus('submitting');
    setSubmissionError(null);
    setSubmittedCampaignId(null);

    try {
      // Submit campaign to Meta API
      const result = await createCampaign(formData);
      
      // Handle submission success (Requirements 13.5)
      setSubmissionStatus('success');
      setSubmittedCampaignId(result.id);
      
      // Add success message to chat history
      const successMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Campaign "${formData.name}" has been successfully created! Campaign ID: ${result.id}`,
        timestamp: new Date(),
        metadata: {
          type: 'submission_success',
          campaignId: result.id
        }
      };
      
      setChatHistory(prev => [...prev, successMessage]);

      // Reset submission status after 3 seconds
      setTimeout(() => {
        setSubmissionStatus('idle');
      }, 3000);

    } catch (error) {
      // Handle submission failure (Requirements 13.5)
      console.error('Campaign submission failed:', error);
      
      const errorMessage = error.message || 'Failed to submit campaign to Meta API';
      setSubmissionError(errorMessage);
      setSubmissionStatus('error');
      
      // Add error message to chat history
      const errorChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Failed to create campaign: ${errorMessage}. Please check your campaign details and try again.`,
        timestamp: new Date(),
        metadata: {
          type: 'submission_error'
        }
      };
      
      setChatHistory(prev => [...prev, errorChatMessage]);
    }
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header title="AI Campaign Generator" />

        {/* Page Description */}
        <div className="page-intro">
          <p className="page-description">
            Create optimized Meta Ads campaigns with AI assistance
          </p>
          
          {/* Meta API Connection Status */}
          {!isConfigured() && (
            <div className="alert alert-warning">
              <span className="warning-icon">⚠️</span>
              <span>Meta API not connected. Please connect your Meta account to submit campaigns.</span>
            </div>
          )}
        </div>

        {/* Two-Column Layout */}
        <div className="campaign-generator-layout">
          {/* Left Column: Campaign Form */}
          <div className="campaign-form-column">
          <CampaignForm
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleFormSubmit}
            isAutoFilling={isAutoFilling}
            highlightedFields={highlightedFields}
            manuallyEditedFields={manuallyEditedFields}
            onFieldManuallyEdited={handleFieldManuallyEdited}
          />
          
          {/* Submission Status Display */}
          {submissionStatus === 'submitting' && (
            <div className="submission-status submitting">
              <div className="status-spinner"></div>
              <p>Submitting campaign to Meta Ads...</p>
            </div>
          )}
          
          {submissionStatus === 'success' && (
            <div className="submission-status success">
              <span className="status-icon">✓</span>
              <p>Campaign created successfully!</p>
              {submittedCampaignId && (
                <p className="campaign-id">Campaign ID: {submittedCampaignId}</p>
              )}
            </div>
          )}
          
          {submissionStatus === 'error' && submissionError && (
            <div className="submission-status error">
              <span className="status-icon">✗</span>
              <p>Submission Failed</p>
              <p className="error-details">{submissionError}</p>
              <button 
                className="retry-button"
                onClick={() => setSubmissionStatus('idle')}
              >
                Dismiss
              </button>
            </div>
          )}
          </div>

          {/* Right Column: AI Assistant Panel */}
          <div className="ai-assistant-column">
          <AIAssistantPanel
            onGenerate={handleGenerate}
            onChatMessage={handleChatMessage}
            uploadedDocuments={uploadedDocuments}
            chatHistory={chatHistory}
            isGenerating={generationStatus === 'generating'}
            generationComplete={generationStatus === 'complete'}
            isIterating={isIterating}
          />
          
          {/* Error Display */}
          {generationStatus === 'error' && generationError && (
            <div className="generation-error">
              <h3>Generation Error</h3>
              <p>{generationError}</p>
              <button 
                className="retry-button"
                onClick={() => setGenerationStatus('idle')}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
      </main>
    </div>
  );
}

/**
 * Returns initial form data structure
 */
function getInitialFormData() {
  return {
    name: '',
    objective: '',
    status: 'PAUSED',
    dailyBudget: 10,
    totalBudget: null,
    startDate: null,
    endDate: null,
    bidStrategy: 'LOWEST_COST',
    targeting: {
      ageMin: 18,
      ageMax: 65,
      genders: ['all'],
      locations: [],
      interests: [],
      behaviors: [],
      customAudiences: [],
      lookalikesAudiences: []
    },
    adCopy: '',
    headlines: [''],
    descriptions: [],
    callToAction: '',
    targetUrl: '',
    images: [],
    videos: [],
    placements: {
      automatic: true,
      facebook: { feed: true, stories: true, reels: true },
      instagram: { feed: true, stories: true, reels: true },
      audience_network: true,
      messenger: false
    },
    optimizationGoal: '',
    conversionEvent: '',
    attributionWindow: '7_DAY_CLICK',
    enableCreativeRefresh: false,
    enableInventorySync: false,
    enableArbitrage: false,
    enableWeatherBidding: false,
    generatedBy: 'manual',
    lastModified: new Date(),
    manuallyEditedFields: []
  };
}
