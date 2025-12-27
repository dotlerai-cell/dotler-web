/**
 * Draft Service
 * 
 * Manages saving, loading, and managing campaign drafts in Firestore.
 * Drafts include all form data and chat history for resuming work later.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * Saves a campaign draft to Firestore
 * @param {string} userId - The user ID who owns the draft
 * @param {string} draftId - Unique identifier for the draft (optional, will be generated if not provided)
 * @param {Object} draftData - The draft data to save
 * @param {Object} draftData.formData - Campaign form data
 * @param {Array} draftData.chatHistory - Chat conversation history
 * @param {string} draftData.campaignName - Name of the campaign
 * @param {Array} draftData.uploadedDocuments - List of document IDs used
 * @param {string} draftData.websiteUrl - Website URL if provided
 * @param {string} draftData.additionalInfo - Additional context information
 * @returns {Promise<string>} The draft ID
 * @throws {Error} If save fails or parameters are invalid
 */
export async function saveDraft(userId, draftId, draftData) {
  // Validate inputs
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided');
  }

  if (!draftData || typeof draftData !== 'object') {
    throw new Error('Invalid draftData provided');
  }

  if (!draftData.formData) {
    throw new Error('Draft must include formData');
  }

  try {
    // Generate draft ID if not provided
    const finalDraftId = draftId || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create document reference
    const draftRef = doc(db, 'users', userId, 'drafts', finalDraftId);

    // Prepare draft document
    const draftDocument = {
      campaignName: draftData.campaignName || draftData.formData?.name || 'Untitled Campaign',
      formData: draftData.formData,
      chatHistory: draftData.chatHistory || [],
      uploadedDocuments: draftData.uploadedDocuments || [],
      websiteUrl: draftData.websiteUrl || null,
      additionalInfo: draftData.additionalInfo || null,
      savedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Store draft
    await setDoc(draftRef, draftDocument);

    return finalDraftId;

  } catch (error) {
    console.error('Error saving draft:', error);
    throw new Error(`Failed to save draft: ${error.message}`);
  }
}

/**
 * Loads a campaign draft from Firestore
 * @param {string} userId - The user ID who owns the draft
 * @param {string} draftId - The draft ID to load
 * @returns {Promise<Object|null>} Draft data or null if not found
 * @throws {Error} If load fails or parameters are invalid
 */
export async function loadDraft(userId, draftId) {
  // Validate inputs
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided');
  }

  if (!draftId || typeof draftId !== 'string') {
    throw new Error('Invalid draftId provided');
  }

  try {
    const draftRef = doc(db, 'users', userId, 'drafts', draftId);
    const draftSnapshot = await getDoc(draftRef);

    if (!draftSnapshot.exists()) {
      return null;
    }

    const data = draftSnapshot.data();
    
    return {
      id: draftSnapshot.id,
      campaignName: data.campaignName || 'Untitled Campaign',
      formData: data.formData || {},
      chatHistory: data.chatHistory || [],
      uploadedDocuments: data.uploadedDocuments || [],
      websiteUrl: data.websiteUrl || null,
      additionalInfo: data.additionalInfo || null,
      savedAt: data.savedAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || data.savedAt?.toDate() || new Date(),
    };

  } catch (error) {
    console.error('Error loading draft:', error);
    throw new Error(`Failed to load draft: ${error.message}`);
  }
}

/**
 * Lists all drafts for a user
 * @param {string} userId - The user ID to list drafts for
 * @returns {Promise<Array<{id: string, campaignName: string, savedAt: Date, updatedAt: Date}>>}
 * @throws {Error} If listing fails or userId is invalid
 */
export async function listDrafts(userId) {
  // Validate input
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided');
  }

  try {
    const draftsRef = collection(db, 'users', userId, 'drafts');
    const q = query(draftsRef, orderBy('savedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    const drafts = [];
    
    querySnapshot.forEach((draftSnapshot) => {
      const data = draftSnapshot.data();
      drafts.push({
        id: draftSnapshot.id,
        campaignName: data.campaignName || 'Untitled Campaign',
        savedAt: data.savedAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || data.savedAt?.toDate() || new Date(),
        // Include preview data for UI
        objective: data.formData?.objective || null,
        budget: data.formData?.dailyBudget || data.formData?.totalBudget || null,
      });
    });

    return drafts;

  } catch (error) {
    console.error('Error listing drafts:', error);
    throw new Error(`Failed to list drafts: ${error.message}`);
  }
}

/**
 * Deletes a draft from Firestore
 * @param {string} userId - The user ID who owns the draft
 * @param {string} draftId - The draft ID to delete
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails or parameters are invalid
 */
export async function deleteDraft(userId, draftId) {
  // Validate inputs
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided');
  }

  if (!draftId || typeof draftId !== 'string') {
    throw new Error('Invalid draftId provided');
  }

  try {
    const draftRef = doc(db, 'users', userId, 'drafts', draftId);
    
    // Check if draft exists
    const draftSnapshot = await getDoc(draftRef);
    if (!draftSnapshot.exists()) {
      throw new Error(`Draft ${draftId} not found`);
    }

    // Delete the draft
    await deleteDoc(draftRef);

  } catch (error) {
    console.error('Error deleting draft:', error);
    throw new Error(`Failed to delete draft: ${error.message}`);
  }
}

/**
 * Updates an existing draft (convenience method that uses saveDraft)
 * @param {string} userId - The user ID who owns the draft
 * @param {string} draftId - The draft ID to update
 * @param {Object} draftData - The updated draft data
 * @returns {Promise<string>} The draft ID
 * @throws {Error} If update fails or parameters are invalid
 */
export async function updateDraft(userId, draftId, draftData) {
  // Validate that draft exists first
  const existingDraft = await loadDraft(userId, draftId);
  
  if (!existingDraft) {
    throw new Error(`Draft ${draftId} not found`);
  }

  // Use saveDraft to update (it will overwrite)
  return await saveDraft(userId, draftId, draftData);
}

/**
 * Gets a specific draft with full details
 * @param {string} userId - The user ID who owns the draft
 * @param {string} draftId - The draft ID to retrieve
 * @returns {Promise<Object|null>} Draft data or null if not found
 */
export async function getDraft(userId, draftId) {
  return await loadDraft(userId, draftId);
}

export default {
  saveDraft,
  loadDraft,
  listDrafts,
  deleteDraft,
  updateDraft,
  getDraft,
};
