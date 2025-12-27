import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { processDocument } from '../../services/documentProcessor';
import { storeEmbeddings, deleteDocument, listDocuments } from '../../services/vectorDatabase';
import { generateEmbeddings } from '../../utils/embeddings';
import './DocumentUploader.css';

/**
 * DocumentUploader Component
 * 
 * Handles PDF document uploads with drag-and-drop support, displays uploaded documents,
 * and manages document deletion. Processes documents and stores embeddings in vector database.
 */
export default function DocumentUploader({ onDocumentsChange }) {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const fileInputRef = useRef(null);

  // Load existing documents on mount
  useEffect(() => {
    loadDocuments();
  }, [currentUser]);

  /**
   * Loads the list of documents for the current user
   */
  async function loadDocuments() {
    if (!currentUser) {
      setLoadingDocuments(false);
      return;
    }

    try {
      setLoadingDocuments(true);
      const docs = await listDocuments(currentUser.uid);
      setDocuments(docs);
      if (onDocumentsChange) {
        onDocumentsChange(docs);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents. Please refresh the page.');
    } finally {
      setLoadingDocuments(false);
    }
  }

  /**
   * Handles file selection from input or drag-and-drop
   */
  async function handleFileSelect(files) {
    if (!files || files.length === 0) return;
    if (!currentUser) {
      setError('You must be logged in to upload documents.');
      return;
    }

    const file = files[0]; // Handle one file at a time
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Process document (extract text, chunk, metadata)
      setUploadProgress(20);
      const { text, chunks, metadata } = await processDocument(file);

      if (!chunks || chunks.length === 0) {
        throw new Error('No text content could be extracted from the PDF.');
      }

      // Step 2: Generate embeddings for chunks
      setUploadProgress(40);
      const embeddings = await generateEmbeddings(chunks, {
        batchSize: 5,
        delayMs: 100,
        onProgress: (current, total) => {
          const embeddingProgress = 40 + (current / total) * 40;
          setUploadProgress(Math.round(embeddingProgress));
        },
      });

      // Filter out any null embeddings
      const validChunks = [];
      const validEmbeddings = [];
      for (let i = 0; i < chunks.length; i++) {
        if (embeddings[i]) {
          validChunks.push({
            text: chunks[i],
            chunkIndex: i,
          });
          validEmbeddings.push(embeddings[i]);
        }
      }

      if (validChunks.length === 0) {
        throw new Error('Failed to generate embeddings for document chunks.');
      }

      // Step 3: Store embeddings in vector database
      setUploadProgress(85);
      const documentId = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      
      await storeEmbeddings(
        currentUser.uid,
        documentId,
        validChunks,
        validEmbeddings,
        {
          name: file.name,
          fileSize: file.size,
          pageCount: metadata.pageCount,
        }
      );

      // Step 4: Reload documents list
      setUploadProgress(100);
      await loadDocuments();

      // Reset state
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload document. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  }

  /**
   * Handles file input change
   */
  function handleInputChange(e) {
    handleFileSelect(e.target.files);
  }

  /**
   * Handles drag events
   */
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  /**
   * Handles drop event
   */
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }

  /**
   * Handles document deletion
   */
  async function handleDelete(documentId) {
    if (!currentUser) return;
    
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await deleteDocument(currentUser.uid, documentId);
      await loadDocuments();
      setError(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete document. Please try again.');
    }
  }

  /**
   * Opens file picker
   */
  function openFilePicker() {
    fileInputRef.current?.click();
  }

  return (
    <div className="document-uploader">
      <h3>Upload Documents</h3>
      
      {/* Upload Area */}
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!uploading ? openFilePicker : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="progress-text">Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📄</div>
            <p className="upload-text">
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p className="upload-hint">PDF files only (max 10MB)</p>
          </>
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

      {/* Documents List */}
      <div className="documents-list">
        <h4>Uploaded Documents</h4>
        
        {loadingDocuments ? (
          <div className="loading-documents">
            <div className="spinner" />
            <p>Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <p className="no-documents">No documents uploaded yet.</p>
        ) : (
          <ul className="document-items">
            {documents.map((doc) => (
              <li key={doc.id} className="document-item">
                <div className="document-info">
                  <div className="document-icon">📄</div>
                  <div className="document-details">
                    <p className="document-name">{doc.name}</p>
                    <p className="document-meta">
                      {doc.pageCount} pages • {doc.chunkCount} chunks • 
                      {' '}{new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(doc.id)}
                  aria-label={`Delete ${doc.name}`}
                  title="Delete document"
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
