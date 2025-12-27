/**
 * useDocumentUpload Hook
 * 
 * Manages document upload state including:
 * - File processing and validation
 * - Text extraction from PDFs
 * - Embedding generation and storage
 * - Error handling
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import { useState, useCallback } from 'react';
import { processDocument } from '../services/documentProcessor.js';
import { storeEmbeddings, listDocuments, deleteDocument } from '../services/vectorDatabase.js';
import { generateEmbedding } from '../utils/embeddings.js';

/**
 * Custom hook for managing document uploads
 * @param {Object} options - Hook options
 * @param {string} options.userId - The authenticated user ID
 * @param {Function} options.onUploadSuccess - Callback when upload succeeds
 * @param {Function} options.onUploadError - Callback when upload fails
 * @returns {Object} Upload state and methods
 */
export function useDocumentUpload({ userId, onUploadSuccess, onUploadError } = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  /**
   * Uploads and processes a PDF document
   * @param {File} file - The PDF file to upload
   * @returns {Promise<Object>} Document metadata
   */
  const uploadDocument = useCallback(async (file) => {
    if (!userId) {
      const errorMsg = 'User ID is required for document upload';
      setError(errorMsg);
      if (onUploadError) onUploadError(new Error(errorMsg));
      return null;
    }

    if (!file) {
      const errorMsg = 'No file provided';
      setError(errorMsg);
      if (onUploadError) onUploadError(new Error(errorMsg));
      return null;
    }

    // Reset state
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setUploadStatus('Processing PDF...');

    try {
      // Step 1: Extract text and metadata from PDF (Requirements 1.1)
      setUploadProgress(10);
      setUploadStatus('Extracting text from PDF...');
      
      const { text, chunks, metadata } = await processDocument(file);
      
      if (!chunks || chunks.length === 0) {
        throw new Error('No text content could be extracted from the PDF');
      }

      setUploadProgress(40);
      setUploadStatus(`Extracted ${chunks.length} text chunks...`);

      // Step 2: Generate embeddings for each chunk (Requirements 1.2)
      setUploadProgress(50);
      setUploadStatus('Generating embeddings...');
      
      const embeddings = [];
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);
        embeddings.push(embedding);
        
        // Update progress
        const progress = 50 + Math.floor((i / chunks.length) * 30);
        setUploadProgress(progress);
        setUploadStatus(`Generating embeddings... (${i + 1}/${chunks.length})`);
      }

      setUploadProgress(80);
      setUploadStatus('Storing document...');

      // Step 3: Store embeddings in vector database (Requirements 1.2)
      const documentId = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      const chunksWithMetadata = chunks.map((chunk, index) => ({
        text: chunk,
        chunkIndex: index,
        pageNumber: null, // Could be enhanced to track page numbers
      }));

      await storeEmbeddings(userId, documentId, chunksWithMetadata, embeddings, {
        name: file.name,
        fileSize: file.size,
        pageCount: metadata.pageCount,
      });

      setUploadProgress(100);
      setUploadStatus('Upload complete!');

      // Create document metadata object
      const documentMetadata = {
        id: documentId,
        name: file.name,
        uploadedAt: new Date(),
        pageCount: metadata.pageCount,
        chunkCount: chunks.length,
        fileSize: file.size,
      };

      // Update documents list
      setDocuments(prev => [documentMetadata, ...prev]);

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(documentMetadata);
      }

      return documentMetadata;

    } catch (err) {
      console.error('Document upload failed:', err);
      const errorMessage = err.message || 'Failed to upload document';
      setError(errorMessage);
      setUploadStatus('Upload failed');

      // Call error callback (Requirements 1.3)
      if (onUploadError) {
        onUploadError(err);
      }

      return null;

    } finally {
      setIsUploading(false);
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus('');
      }, 2000);
    }
  }, [userId, onUploadSuccess, onUploadError]);

  /**
   * Loads the list of uploaded documents for the user
   * @returns {Promise<Array>} List of documents
   */
  const loadDocuments = useCallback(async () => {
    if (!userId) {
      return [];
    }

    setIsLoadingDocuments(true);
    setError(null);

    try {
      const docs = await listDocuments(userId);
      setDocuments(docs);
      return docs;

    } catch (err) {
      console.error('Failed to load documents:', err);
      setError(err.message || 'Failed to load documents');
      return [];

    } finally {
      setIsLoadingDocuments(false);
    }
  }, [userId]);

  /**
   * Deletes a document and its embeddings
   * @param {string} documentId - The document ID to delete
   * @returns {Promise<boolean>} Success status
   */
  const removeDocument = useCallback(async (documentId) => {
    if (!userId) {
      const errorMsg = 'User ID is required to delete document';
      setError(errorMsg);
      return false;
    }

    if (!documentId) {
      const errorMsg = 'Document ID is required';
      setError(errorMsg);
      return false;
    }

    try {
      await deleteDocument(userId, documentId);
      
      // Update documents list
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      return true;

    } catch (err) {
      console.error('Failed to delete document:', err);
      setError(err.message || 'Failed to delete document');
      return false;
    }
  }, [userId]);

  /**
   * Resets the upload state
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus('');
    setError(null);
  }, []);

  /**
   * Clears any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isUploading,
    uploadProgress,
    uploadStatus,
    error,
    documents,
    isLoadingDocuments,

    // Methods
    uploadDocument,
    loadDocuments,
    removeDocument,
    reset,
    clearError,
  };
}

export default useDocumentUpload;
