/**
 * Vector Database Service
 * 
 * Manages storage and retrieval of document embeddings in Firestore
 * for semantic search and document management.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { cosineSimilarity } from '../utils/embeddings.js';

/**
 * Stores document embeddings in Firestore
 * @param {string} userId - The user ID who owns the document
 * @param {string} documentId - Unique identifier for the document
 * @param {Array<{text: string, chunkIndex: number, pageNumber?: number}>} chunks - Text chunks with metadata
 * @param {number[][]} embeddings - Array of embedding vectors corresponding to chunks
 * @param {Object} metadata - Optional document metadata (name, fileSize, etc.)
 * @returns {Promise<void>}
 * @throws {Error} If storage fails or parameters are invalid
 */
export async function storeEmbeddings(userId, documentId, chunks, embeddings, metadata = {}) {
  // Validate inputs
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided');
  }

  if (!documentId || typeof documentId !== 'string') {
    throw new Error('Invalid documentId provided');
  }

  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('Invalid chunks array provided');
  }

  if (!Array.isArray(embeddings) || embeddings.length === 0) {
    throw new Error('Invalid embeddings array provided');
  }

  if (chunks.length !== embeddings.length) {
    throw new Error('Number of chunks must match number of embeddings');
  }

  try {
    // Prepare chunks with embeddings
    const chunksWithEmbeddings = chunks.map((chunk, index) => ({
      text: chunk.text || chunk,
      embedding: embeddings[index],
      chunkIndex: chunk.chunkIndex !== undefined ? chunk.chunkIndex : index,
      pageNumber: chunk.pageNumber || null,
    }));

    // Create document reference
    const docRef = doc(db, 'users', userId, 'documents', documentId);

    // Store document with chunks and embeddings
    await setDoc(docRef, {
      name: metadata.name || documentId,
      uploadedAt: Timestamp.now(),
      pageCount: metadata.pageCount || (chunks[0]?.pageNumber ? Math.max(...chunks.map(c => c.pageNumber || 0)) : 0),
      chunkCount: chunks.length,
      fileSize: metadata.fileSize || null,
      chunks: chunksWithEmbeddings,
      updatedAt: Timestamp.now(),
    });

  } catch (error) {
    console.error('Error storing embeddings:', error);
    throw new Error(`Failed to store embeddings: ${error.message}`);
  }
}

/**
 * Searches for similar document chunks using semantic search
 * @param {string} userId - The user ID to search within
 * @param {number[]} queryEmbedding - The query embedding vector
 * @param {number} topK - Number of top results to return (default: 10)
 * @returns {Promise<Array<{text: string, similarity: number, documentId: string, chunkIndex: number}>>}
 * @throws {Error} If search fails or parameters are invalid
 */
export async function searchSimilar(userId, queryEmbedding, topK = 10) {
  // Validate inputs
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided');
  }

  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    throw new Error('Invalid queryEmbedding provided');
  }

  if (typeof topK !== 'number' || topK <= 0) {
    throw new Error('Invalid topK value');
  }

  try {
    // Get all documents for the user
    const documentsRef = collection(db, 'users', userId, 'documents');
    const querySnapshot = await getDocs(documentsRef);

    if (querySnapshot.empty) {
      return [];
    }

    // Collect all chunks with their embeddings
    const allChunks = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const docData = docSnapshot.data();
      const documentId = docSnapshot.id;
      
      if (docData.chunks && Array.isArray(docData.chunks)) {
        docData.chunks.forEach((chunk) => {
          if (chunk.embedding && chunk.text) {
            allChunks.push({
              text: chunk.text,
              embedding: chunk.embedding,
              documentId: documentId,
              chunkIndex: chunk.chunkIndex,
              pageNumber: chunk.pageNumber,
            });
          }
        });
      }
    });

    if (allChunks.length === 0) {
      return [];
    }

    // Calculate similarities for all chunks
    const results = allChunks.map((chunk) => {
      try {
        const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
        return {
          text: chunk.text,
          similarity: similarity,
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          pageNumber: chunk.pageNumber,
        };
      } catch (error) {
        console.error('Error calculating similarity for chunk:', error);
        return null;
      }
    }).filter(result => result !== null);

    // Sort by similarity (highest first) and return top K
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, topK);

  } catch (error) {
    console.error('Error searching similar documents:', error);
    throw new Error(`Failed to search similar documents: ${error.message}`);
  }
}

/**
 * Deletes a document and all its embeddings
 * @param {string} userId - The user ID who owns the document
 * @param {string} documentId - The document ID to delete
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails or parameters are invalid
 */
export async function deleteDocument(userId, documentId) {
  // Validate inputs
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided');
  }

  if (!documentId || typeof documentId !== 'string') {
    throw new Error('Invalid documentId provided');
  }

  try {
    const docRef = doc(db, 'users', userId, 'documents', documentId);
    
    // Check if document exists
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Delete the document
    await deleteDoc(docRef);

  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

/**
 * Lists all documents for a user
 * @param {string} userId - The user ID to list documents for
 * @returns {Promise<Array<{id: string, name: string, uploadedAt: Date, pageCount: number, chunkCount: number, fileSize: number}>>}
 * @throws {Error} If listing fails or userId is invalid
 */
export async function listDocuments(userId) {
  // Validate input
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided');
  }

  try {
    const documentsRef = collection(db, 'users', userId, 'documents');
    const querySnapshot = await getDocs(documentsRef);

    if (querySnapshot.empty) {
      return [];
    }

    const documents = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      documents.push({
        id: docSnapshot.id,
        name: data.name || docSnapshot.id,
        uploadedAt: data.uploadedAt?.toDate() || new Date(),
        pageCount: data.pageCount || 0,
        chunkCount: data.chunkCount || (data.chunks?.length || 0),
        fileSize: data.fileSize || null,
        updatedAt: data.updatedAt?.toDate() || data.uploadedAt?.toDate() || new Date(),
      });
    });

    // Sort by upload date (most recent first)
    documents.sort((a, b) => b.uploadedAt - a.uploadedAt);

    return documents;

  } catch (error) {
    console.error('Error listing documents:', error);
    throw new Error(`Failed to list documents: ${error.message}`);
  }
}

/**
 * Gets a specific document with all its chunks and embeddings
 * @param {string} userId - The user ID who owns the document
 * @param {string} documentId - The document ID to retrieve
 * @returns {Promise<Object|null>} Document data or null if not found
 */
export async function getDocument(userId, documentId) {
  // Validate inputs
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided');
  }

  if (!documentId || typeof documentId !== 'string') {
    throw new Error('Invalid documentId provided');
  }

  try {
    const docRef = doc(db, 'users', userId, 'documents', documentId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      return null;
    }

    const data = docSnapshot.data();
    
    return {
      id: docSnapshot.id,
      name: data.name || docSnapshot.id,
      uploadedAt: data.uploadedAt?.toDate() || new Date(),
      pageCount: data.pageCount || 0,
      chunkCount: data.chunkCount || (data.chunks?.length || 0),
      fileSize: data.fileSize || null,
      chunks: data.chunks || [],
      updatedAt: data.updatedAt?.toDate() || data.uploadedAt?.toDate() || new Date(),
    };

  } catch (error) {
    console.error('Error getting document:', error);
    throw new Error(`Failed to get document: ${error.message}`);
  }
}

export default {
  storeEmbeddings,
  searchSimilar,
  deleteDocument,
  listDocuments,
  getDocument,
};
