import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listDrafts, deleteDraft } from '../../services/draftService';
import './DraftManager.css';

/**
 * DraftManager Component
 * 
 * Displays a list of saved campaign drafts with options to load or delete them.
 * Shows campaign names, timestamps, and preview information.
 */
export default function DraftManager({ onLoadDraft, onSaveDraft, currentDraftId }) {
  const { currentUser } = useAuth();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load drafts on mount and when user changes
  useEffect(() => {
    loadDrafts();
  }, [currentUser]);

  /**
   * Loads the list of drafts for the current user
   */
  async function loadDrafts() {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const draftsList = await listDrafts(currentUser.uid);
      setDrafts(draftsList);
    } catch (err) {
      console.error('Error loading drafts:', err);
      setError('Failed to load drafts. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles loading a draft
   */
  async function handleLoadDraft(draftId) {
    if (onLoadDraft) {
      try {
        setError(null);
        await onLoadDraft(draftId);
      } catch (err) {
        console.error('Error loading draft:', err);
        setError('Failed to load draft. Please try again.');
      }
    }
  }

  /**
   * Handles deleting a draft
   */
  async function handleDeleteDraft(draftId, campaignName) {
    if (!currentUser) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${campaignName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(draftId);
      setError(null);
      await deleteDraft(currentUser.uid, draftId);
      await loadDrafts();
    } catch (err) {
      console.error('Error deleting draft:', err);
      setError('Failed to delete draft. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  /**
   * Handles saving the current draft
   */
  async function handleSaveDraft() {
    if (onSaveDraft) {
      try {
        setSaving(true);
        setError(null);
        await onSaveDraft();
        await loadDrafts();
      } catch (err) {
        console.error('Error saving draft:', err);
        setError('Failed to save draft. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  }

  /**
   * Formats a date for display
   */
  function formatDate(date) {
    const now = new Date();
    const draftDate = new Date(date);
    const diffMs = now - draftDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return draftDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: draftDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * Formats budget for display
   */
  function formatBudget(budget) {
    if (!budget) return null;
    return `$${budget.toLocaleString()}`;
  }

  if (!currentUser) {
    return (
      <div className="draft-manager">
        <div className="draft-manager-header">
          <h3>Campaign Drafts</h3>
        </div>
        <div className="no-auth-message">
          <p>Please log in to save and manage drafts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="draft-manager">
      {/* Header with Save Button */}
      <div className="draft-manager-header">
        <h3>Campaign Drafts</h3>
        {onSaveDraft && (
          <button
            className="save-draft-button"
            onClick={handleSaveDraft}
            disabled={saving}
            title="Save current campaign as draft"
          >
            {saving ? (
              <>
                <span className="button-spinner" />
                Saving...
              </>
            ) : (
              <>
                <span className="save-icon">💾</span>
                Save Draft
              </>
            )}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button
            className="error-close"
            onClick={() => setError(null)}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* Drafts List */}
      <div className="drafts-list">
        {loading ? (
          <div className="loading-drafts">
            <div className="spinner" />
            <p>Loading drafts...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="no-drafts">
            <div className="no-drafts-icon">📝</div>
            <p className="no-drafts-text">No saved drafts yet.</p>
            <p className="no-drafts-hint">
              Click "Save Draft" to save your current campaign.
            </p>
          </div>
        ) : (
          <ul className="draft-items">
            {drafts.map((draft) => (
              <li
                key={draft.id}
                className={`draft-item ${currentDraftId === draft.id ? 'current-draft' : ''}`}
              >
                <div className="draft-content">
                  <div className="draft-header">
                    <h4 className="draft-name">{draft.campaignName}</h4>
                    {currentDraftId === draft.id && (
                      <span className="current-badge">Current</span>
                    )}
                  </div>
                  
                  <div className="draft-meta">
                    <span className="draft-timestamp">
                      <span className="meta-icon">🕒</span>
                      {formatDate(draft.savedAt)}
                    </span>
                    
                    {draft.objective && (
                      <span className="draft-objective">
                        <span className="meta-icon">🎯</span>
                        {draft.objective.replace('OUTCOME_', '')}
                      </span>
                    )}
                    
                    {draft.budget && (
                      <span className="draft-budget">
                        <span className="meta-icon">💰</span>
                        {formatBudget(draft.budget)}/day
                      </span>
                    )}
                  </div>
                </div>

                <div className="draft-actions">
                  <button
                    className="load-button"
                    onClick={() => handleLoadDraft(draft.id)}
                    disabled={deletingId === draft.id}
                    title="Load this draft"
                  >
                    <span className="button-icon">📂</span>
                    Load
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteDraft(draft.id, draft.campaignName)}
                    disabled={deletingId === draft.id}
                    title="Delete this draft"
                  >
                    {deletingId === draft.id ? (
                      <span className="button-spinner small" />
                    ) : (
                      <span className="button-icon">🗑️</span>
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
