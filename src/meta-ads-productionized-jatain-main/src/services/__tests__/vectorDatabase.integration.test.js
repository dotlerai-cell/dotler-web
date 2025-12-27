/**
 * Integration tests for Vector Database Service
 * Tests the complete document persistence workflow
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  storeEmbeddings,
  listDocuments,
  getDocument,
  deleteDocument,
  searchSimilar,
} from '../vectorDatabase.js';

// Mock Firestore
vi.mock('../../firebase.js', () => ({
  db: {},
}));

const mockFirestore = {
  documents: new Map(),
};

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, ...path) => ({ path: path.join('/') })),
  doc: vi.fn((db, ...path) => ({ path: path.join('/') })),
  setDoc: vi.fn(async (docRef, data) => {
    const key = docRef.path;
    mockFirestore.documents.set(key, data);
  }),
  getDoc: vi.fn(async (docRef) => {
    const key = docRef.path;
    const data = mockFirestore.documents.get(key);
    return {
      exists: () => !!data,
      id: key.split('/').pop(),
      data: () => data,
    };
  }),
  getDocs: vi.fn(async (collectionRef) => {
    const docs = [];
    const prefix = collectionRef.path + '/';
    
    for (const [key, data] of mockFirestore.documents.entries()) {
      if (key.startsWith(prefix)) {
        const id = key.split('/').pop();
        docs.push({
          id,
          data: () => data,
        });
      }
    }
    
    return {
      empty: docs.length === 0,
      forEach: (callback) => docs.forEach(callback),
    };
  }),
  deleteDoc: vi.fn(async (docRef) => {
    const key = docRef.path;
    mockFirestore.documents.delete(key);
  }),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date('2024-01-01') })),
  },
}));

vi.mock('../../utils/embeddings.js', () => ({
  cosineSimilarity: vi.fn((emb1, emb2) => {
    let sum = 0;
    for (let i = 0; i < Math.min(emb1.length, emb2.length); i++) {
      sum += emb1[i] * emb2[i];
    }
    return sum / Math.min(emb1.length, emb2.length);
  }),
}));

describe('VectorDatabase Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFirestore.documents.clear();
  });

  test('complete document lifecycle: store, list, retrieve, delete', async () => {
    const userId = 'test-user-123';
    const documentId = 'test-doc-1';
    
    // Step 1: Store document with embeddings
    const chunks = [
      { text: 'This is chunk 1', chunkIndex: 0 },
      { text: 'This is chunk 2', chunkIndex: 1 },
    ];
    const embeddings = [
      [0.1, 0.2, 0.3],
      [0.4, 0.5, 0.6],
    ];
    const metadata = {
      name: 'test-document.pdf',
      fileSize: 1024,
      pageCount: 2,
    };

    await storeEmbeddings(userId, documentId, chunks, embeddings, metadata);
    
    // Verify document was stored
    expect(mockFirestore.documents.size).toBe(1);
    
    // Step 2: List documents
    const documents = await listDocuments(userId);
    expect(documents).toHaveLength(1);
    expect(documents[0].id).toBe(documentId);
    expect(documents[0].name).toBe('test-document.pdf');
    expect(documents[0].chunkCount).toBe(2);
    
    // Step 3: Retrieve specific document
    const doc = await getDocument(userId, documentId);
    expect(doc).not.toBeNull();
    expect(doc.id).toBe(documentId);
    expect(doc.chunks).toHaveLength(2);
    expect(doc.chunks[0].text).toBe('This is chunk 1');
    
    // Step 4: Search similar chunks
    const queryEmbedding = [0.15, 0.25, 0.35];
    const results = await searchSimilar(userId, queryEmbedding, 2);
    expect(results).toHaveLength(2);
    expect(results[0]).toHaveProperty('text');
    expect(results[0]).toHaveProperty('similarity');
    expect(results[0]).toHaveProperty('documentId', documentId);
    
    // Step 5: Delete document
    await deleteDocument(userId, documentId);
    
    // Verify document was deleted
    const documentsAfterDelete = await listDocuments(userId);
    expect(documentsAfterDelete).toHaveLength(0);
  });

  test('multiple documents for same user', async () => {
    const userId = 'test-user-456';
    
    // Store multiple documents
    for (let i = 1; i <= 3; i++) {
      const documentId = `doc-${i}`;
      const chunks = [{ text: `Document ${i} content`, chunkIndex: 0 }];
      const embeddings = [[0.1 * i, 0.2 * i, 0.3 * i]];
      const metadata = { name: `document-${i}.pdf`, fileSize: 1024 * i, pageCount: i };
      
      await storeEmbeddings(userId, documentId, chunks, embeddings, metadata);
    }
    
    // List all documents
    const documents = await listDocuments(userId);
    expect(documents).toHaveLength(3);
    
    // Verify each document
    expect(documents.map(d => d.id).sort()).toEqual(['doc-1', 'doc-2', 'doc-3']);
  });

  test('document isolation between users', async () => {
    const user1 = 'user-1';
    const user2 = 'user-2';
    
    // Store document for user 1
    await storeEmbeddings(
      user1,
      'doc-1',
      [{ text: 'User 1 content', chunkIndex: 0 }],
      [[0.1, 0.2, 0.3]],
      { name: 'user1-doc.pdf' }
    );
    
    // Store document for user 2
    await storeEmbeddings(
      user2,
      'doc-2',
      [{ text: 'User 2 content', chunkIndex: 0 }],
      [[0.4, 0.5, 0.6]],
      { name: 'user2-doc.pdf' }
    );
    
    // Verify user 1 only sees their document
    const user1Docs = await listDocuments(user1);
    expect(user1Docs).toHaveLength(1);
    expect(user1Docs[0].name).toBe('user1-doc.pdf');
    
    // Verify user 2 only sees their document
    const user2Docs = await listDocuments(user2);
    expect(user2Docs).toHaveLength(1);
    expect(user2Docs[0].name).toBe('user2-doc.pdf');
  });

  test('document replacement with same ID', async () => {
    const userId = 'test-user-789';
    const documentId = 'replaceable-doc';
    
    // Store initial document
    await storeEmbeddings(
      userId,
      documentId,
      [{ text: 'Original content', chunkIndex: 0 }],
      [[0.1, 0.2, 0.3]],
      { name: 'original.pdf', fileSize: 1024 }
    );
    
    // Replace with new document
    await storeEmbeddings(
      userId,
      documentId,
      [{ text: 'Updated content', chunkIndex: 0 }],
      [[0.4, 0.5, 0.6]],
      { name: 'updated.pdf', fileSize: 2048 }
    );
    
    // Verify only one document exists
    const documents = await listDocuments(userId);
    expect(documents).toHaveLength(1);
    
    // Verify it has the updated content
    const doc = await getDocument(userId, documentId);
    expect(doc.name).toBe('updated.pdf');
    expect(doc.fileSize).toBe(2048);
    expect(doc.chunks[0].text).toBe('Updated content');
  });
});
