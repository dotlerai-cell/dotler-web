import { useState } from 'react';
import DraftManager from '../components/ai-assistant/DraftManager';
import { saveDraft, loadDraft } from '../services/draftService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Demo page for DraftManager component
 * Shows how to integrate the DraftManager with campaign form
 */
export default function DraftManagerDemo() {
  const { currentUser } = useAuth();
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    objective: 'OUTCOME_SALES',
    dailyBudget: 50,
  });
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState('');

  /**
   * Handles saving the current form as a draft
   */
  async function handleSaveDraft() {
    if (!currentUser) {
      alert('Please log in to save drafts');
      return;
    }

    try {
      const draftData = {
        campaignName: formData.name || 'Untitled Campaign',
        formData,
        chatHistory,
        uploadedDocuments: [],
        websiteUrl: null,
        additionalInfo: null,
      };

      const draftId = await saveDraft(currentUser.uid, currentDraftId, draftData);
      setCurrentDraftId(draftId);
      setMessage('Draft saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving draft:', error);
      setMessage('Failed to save draft');
      setTimeout(() => setMessage(''), 3000);
    }
  }

  /**
   * Handles loading a draft
   */
  async function handleLoadDraft(draftId) {
    if (!currentUser) {
      alert('Please log in to load drafts');
      return;
    }

    try {
      const draft = await loadDraft(currentUser.uid, draftId);
      if (draft) {
        setFormData(draft.formData);
        setChatHistory(draft.chatHistory || []);
        setCurrentDraftId(draftId);
        setMessage(`Loaded draft: ${draft.campaignName}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      setMessage('Failed to load draft');
      setTimeout(() => setMessage(''), 3000);
    }
  }

  /**
   * Handles form field changes
   */
  function handleFieldChange(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Draft Manager Demo</h1>
      
      {message && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          backgroundColor: '#e7f3ff',
          border: '1px solid #1877f2',
          borderRadius: '6px',
          color: '#333',
        }}>
          {message}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginTop: '20px',
      }}>
        {/* Left Column: Campaign Form */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <h2>Campaign Form</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Enter campaign name"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Objective
            </label>
            <select
              value={formData.objective}
              onChange={(e) => handleFieldChange('objective', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="OUTCOME_SALES">Sales</option>
              <option value="OUTCOME_LEADS">Leads</option>
              <option value="OUTCOME_TRAFFIC">Traffic</option>
              <option value="OUTCOME_AWARENESS">Awareness</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Daily Budget ($)
            </label>
            <input
              type="number"
              value={formData.dailyBudget}
              onChange={(e) => handleFieldChange('dailyBudget', parseFloat(e.target.value))}
              min="1"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
          }}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>Current Form Data</h3>
            <pre style={{
              fontSize: '12px',
              overflow: 'auto',
              backgroundColor: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
            }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>

        {/* Right Column: Draft Manager */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <DraftManager
            onLoadDraft={handleLoadDraft}
            onSaveDraft={handleSaveDraft}
            currentDraftId={currentDraftId}
          />

          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
          }}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>Instructions</h3>
            <ol style={{ fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
              <li>Fill in the campaign form fields</li>
              <li>Click "Save Draft" to save the current state</li>
              <li>Create multiple drafts with different values</li>
              <li>Click "Load" on any draft to restore it</li>
              <li>Click the delete icon to remove a draft</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
