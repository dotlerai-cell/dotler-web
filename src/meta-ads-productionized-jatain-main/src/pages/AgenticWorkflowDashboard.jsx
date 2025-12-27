import { useState, useEffect } from 'react';
import { useAgenticWorkflow } from '../hooks/useAgenticWorkflow';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DocumentUploader from '../components/ai-assistant/DocumentUploader';
import '../styles/components.css';

export default function AgenticWorkflowDashboard() {
  const { runWorkflow, result, error, loading, progress } = useAgenticWorkflow();
  const { uploadDocuments, uploadedDocuments, documentUploadError } = useDocumentUpload();

  const [userPrompt, setUserPrompt] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [userPreferences, setUserPreferences] = useState({
    tone: 'professional',
    targetAudience: 'general audience',
    budgetRange: { min: 10, max: 100 }
  });

  const [workflowLogs, setWorkflowLogs] = useState([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Handle document upload
  const handleDocumentUpload = async (files) => {
    try {
      await uploadDocuments(files);
      addLog('📂 Documents uploaded successfully', 'success');
    } catch (err) {
      addLog(`❌ Document upload failed: ${err.message}`, 'error');
    }
  };

  // Add log message to workflow logs
  const addLog = (message, type = 'info') => {
    setWorkflowLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  // Handle workflow execution
  const handleRunWorkflow = async () => {
    if (!userPrompt.trim()) {
      addLog('⚠️ Please enter a campaign description', 'warning');
      return;
    }

    addLog('🚀 Starting agentic workflow...', 'info');

    try {
      await runWorkflow(userPrompt, {
        websiteUrl: websiteUrl || null,
        userPreferences,
        onProgress: (step, message) => {
          addLog(`📍 ${step}: ${message}`, 'progress');
        }
      });

      addLog('✅ Workflow completed successfully!', 'success');
    } catch (err) {
      addLog(`❌ Workflow failed: ${err.message}`, 'error');
    }
  };

  // Handle preference changes
  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setUserPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle budget range changes
  const handleBudgetChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;

    setUserPreferences(prev => ({
      ...prev,
      budgetRange: {
        ...prev.budgetRange,
        [name]: numValue
      }
    }));
  };

  // Clear all data
  const handleClearAll = () => {
    setUserPrompt('');
    setWebsiteUrl('');
    setUserPreferences({
      tone: 'professional',
      targetAudience: 'general audience',
      budgetRange: { min: 10, max: 100 }
    });
    setWorkflowLogs([]);
    setResult(null);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header title="🤖 Agentic Workflow Dashboard" />

        <section className="agentic-workflow-dashboard">
          <div className="workflow-header">
            <h2>Meta Ads Campaign Generator</h2>
            <p>Multi-agent workflow for intelligent campaign creation</p>
          </div>

          {/* Document Upload Section */}
          <div className="workflow-section">
            <h3>📄 Step 1: Upload Company Documents</h3>
            <DocumentUploader
              onUpload={handleDocumentUpload}
              maxFiles={5}
              acceptedFileTypes={['.pdf', '.doc', '.docx', '.txt']}
            />

            {uploadedDocuments.length > 0 && (
              <div className="document-summary">
                <p>📂 {uploadedDocuments.length} document(s) uploaded</p>
                <ul className="document-list">
                  {uploadedDocuments.map((doc, index) => (
                    <li key={index}>{doc.name} ({doc.size} KB)</li>
                  ))}
                </ul>
              </div>
            )}

            {documentUploadError && (
              <div className="error-message">❌ {documentUploadError}</div>
            )}
          </div>

          {/* Campaign Description Section */}
          <div className="workflow-section">
            <h3>🎯 Step 2: Describe Your Campaign</h3>
            <textarea
              className="campaign-description-input"
              placeholder="Describe your campaign goals, target audience, and any specific requirements..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={6}
            />

            <div className="form-group">
              <label>Website URL (optional)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://yourcompany.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Advanced Options Section */}
          <div className="workflow-section">
            <div className="advanced-options-header">
              <h3>⚙️ Advanced Options</h3>
              <button
                className="btn-secondary"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                {showAdvancedOptions ? 'Hide Options' : 'Show Options'}
              </button>
            </div>

            {showAdvancedOptions && (
              <div className="advanced-options-content">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tone</label>
                    <select
                      name="tone"
                      className="form-input"
                      value={userPreferences.tone}
                      onChange={handlePreferenceChange}
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="urgent">Urgent</option>
                      <option value="friendly">Friendly</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target Audience</label>
                    <select
                      name="targetAudience"
                      className="form-input"
                      value={userPreferences.targetAudience}
                      onChange={handlePreferenceChange}
                    >
                      <option value="general audience">General Audience</option>
                      <option value="young professionals">Young Professionals</option>
                      <option value="tech enthusiasts">Tech Enthusiasts</option>
                      <option value="luxury buyers">Luxury Buyers</option>
                      <option value="bargain hunters">Bargain Hunters</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Min Budget ($/day)</label>
                    <input
                      type="number"
                      name="min"
                      className="form-input"
                      value={userPreferences.budgetRange.min}
                      onChange={handleBudgetChange}
                      min="1"
                      step="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Max Budget ($/day)</label>
                    <input
                      type="number"
                      name="max"
                      className="form-input"
                      value={userPreferences.budgetRange.max}
                      onChange={handleBudgetChange}
                      min="1"
                      step="1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Workflow Controls */}
          <div className="workflow-controls">
            <button
              className="btn-secondary"
              onClick={handleClearAll}
              disabled={loading}
            >
              Clear All
            </button>

            <button
              className="btn-primary"
              onClick={handleRunWorkflow}
              disabled={loading || !userPrompt.trim()}
            >
              {loading ? '🤖 Generating...' : '🚀 Generate Campaign'}
            </button>
          </div>

          {/* Workflow Logs */}
          <div className="workflow-section">
            <h3>📋 Workflow Logs</h3>
            <div className="workflow-logs">
              {workflowLogs.length === 0 ? (
                <p className="log-empty">Logs will appear here during execution...</p>
              ) : (
                workflowLogs.map((log, index) => (
                  <div key={index} className={`log-entry log-${log.type}`}>
                    <span className="log-timestamp">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="workflow-section">
              <h3>🎉 Generated Campaign</h3>

              <div className="campaign-result">
                <div className="campaign-header">
                  <h2>{result.campaign.name}</h2>
                  <span className="campaign-objective">
                    {result.campaign.objective.replace('OUTCOME_', '')}
                  </span>
                </div>

                <div className="campaign-details">
                  <div className="detail-section">
                    <h4>🎯 Target Audience</h4>
                    <p>{result.campaign.targeting?.description || 'General audience'}</p>
                  </div>

                  <div className="detail-section">
                    <h4>💰 Budget</h4>
                    <p>${result.campaign.dailyBudget}/day</p>
                  </div>

                  <div className="detail-section">
                    <h4>📢 Ad Copy Variations</h4>
                    <ul className="ad-copy-list">
                      {result.campaign.adCopyVariations.map((variation, index) => (
                        <li key={index}>{variation}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="detail-section">
                    <h4>🎨 Headlines</h4>
                    <ul className="headlines-list">
                      {result.campaign.headlines.map((headline, index) => (
                        <li key={index}>{headline}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="detail-section">
                    <h4>🖼️ Visual Ideas</h4>
                    <p>{result.campaign.visualIdeas || 'High-quality product images, lifestyle shots, and brand visuals'}</p>
                  </div>
                </div>

                <div className="workflow-metadata">
                  <h4>📊 Generation Metadata</h4>
                  <pre className="metadata-content">
                    {JSON.stringify(result.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-section">
              <h3>❌ Error</h3>
              <div className="error-message">{error}</div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
