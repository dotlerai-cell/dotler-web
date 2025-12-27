/**
 * Unit tests for Vector Database Service
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  storeEmbeddings,
  searchSimilar,
  deleteDocument,
  listDocuments,
  getDocument,
} from '../vectorDatabase.js';

// Mock Firestore
vi.mock('../../firebase.js', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date('2024-01-01') })),
  },
}));

vi.mock('../../utils/embeddings.js', () => ({
  cosineSimilarity: vi.fn((emb1, emb2) => {
    // Simple mock similarity calculation
    let sum = 0;
    for (let i = 0; i < Math.min(emb1.length, emb2.length); i++) {
      sum += emb1[i] * emb2[i];
    }
    return sum / Math.min(emb1.length, emb2.length);
  }),
}));

describe('VectorDatabase Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('storeEmbeddings', () => {
    test('should validate userId parameter', async () => {
      await expect(
        storeEmbeddings(null, 'doc1', ['chunk1'], [[0.1, 0.2]])
      ).rejects.toThrow('Invalid userId');
    });

    test('should validate documentId parameter', async () => {
      await expect(
        storeEmbeddings('user1', null, ['chunk1'], [[0.1, 0.2]])
      ).rejects.toThrow('Invalid documentId');
    });

    test('should validate chunks array', async () => {
      await expect(
        storeEmbeddings('user1', 'doc1', [], [[0.1, 0.2]])
      ).rejects.toThrow('Invalid chunks array');
    });

    test('should validate embeddings array', async () => {
      await expect(
        storeEmbeddings('user1', 'doc1', ['chunk1'], [])
      ).rejects.toThrow('Invalid embeddings array');
    });

    test('should validate chunks and embeddings length match', async () => {
      await expect(
        storeEmbeddings('user1', 'doc1', ['chunk1', 'chunk2'], [[0.1, 0.2]])
      ).rejects.toThrow('Number of chunks must match number of embeddings');
    });

    test('should store embeddings with valid parameters', async () => {
      const { setDoc, doc } = await import('firebase/firestore');
      
      setDoc.mockResolvedValue(undefined);
      doc.mockReturnValue({ path: 'users/user1/documents/doc1' });

      const chunks = [
        { text: 'chunk1', chunkIndex: 0 },
        { text: 'chunk2', chunkIndex: 1 },
      ];
      const embeddings = [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ];
      const metadata = {
        name: 'test.pdf',
        fileSize: 1024,
        pageCount: 2,
      };

      await expect(
        storeEmbeddings('user1', 'doc1', chunks, embeddings, metadata)
      ).resolves.toBeUndefined();

      expect(setDoc).toHaveBeenCalled();
    });

    test('should store embeddings without metadata (backward compatibility)', async () => {
      const { setDoc, doc } = await import('firebase/firestore');
      
      setDoc.mockResolvedValue(undefined);
      doc.mockReturnValue({ path: 'users/user1/documents/doc1' });

      const chunks = [
        { text: 'chunk1', chunkIndex: 0 },
      ];
      const embeddings = [
        [0.1, 0.2, 0.3],
      ];

      await expect(
        storeEmbeddings('user1', 'doc1', chunks, embeddings)
      ).resolves.toBeUndefined();

      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe('searchSimilar', () => {
    test('should validate userId parameter', async () => {
      await expect(
        searchSimilar(null, [0.1, 0.2], 10)
      ).rejects.toThrow('Invalid userId');
    });

    test('should validate queryEmbedding parameter', async () => {
      await expect(
        searchSimilar('user1', [], 10)
      ).rejects.toThrow('Invalid queryEmbedding');
    });

    test('should validate topK parameter', async () => {
      await expect(
        searchSimilar('user1', [0.1, 0.2], -1)
      ).rejects.toThrow('Invalid topK value');
    });

    test('should return empty array when no documents exist', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      getDocs.mockResolvedValue({
        empty: true,
        forEach: vi.fn(),
      });

      const results = await searchSimilar('user1', [0.1, 0.2], 10);
      expect(results).toEqual([]);
    });

    test('should search and return similar chunks', async () => {
      const { getDocs, collection } = await import('firebase/firestore');
      
      const mockDocs = [
        {
          id: 'doc1',
          data: () => ({
            chunks: [
              { text: 'chunk1', embedding: [0.1, 0.2], chunkIndex: 0 },
              { text: 'chunk2', embedding: [0.3, 0.4], chunkIndex: 1 },
            ],
          }),
        },
      ];

      getDocs.mockResolvedValue({
        empty: false,
        forEach: (callback) => mockDocs.forEach(callback),
      });

      collection.mockReturnValue({ path: 'users/user1/documents' });

      const results = await searchSimilar('user1', [0.1, 0.2], 2);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('text');
      expect(results[0]).toHaveProperty('similarity');
      expect(results[0]).toHaveProperty('documentId');
    });
  });

  describe('deleteDocument', () => {
    test('should validate userId parameter', async () => {
      await expect(
        deleteDocument(null, 'doc1')
      ).rejects.toThrow('Invalid userId');
    });

    test('should validate documentId parameter', async () => {
      await expect(
        deleteDocument('user1', null)
      ).rejects.toThrow('Invalid documentId');
    });

    test('should throw error if document does not exist', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(
        deleteDocument('user1', 'doc1')
      ).rejects.toThrow('Document doc1 not found');
    });

    test('should delete document when it exists', async () => {
      const { getDoc, deleteDoc, doc } = await import('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
      });
      
      deleteDoc.mockResolvedValue(undefined);
      doc.mockReturnValue({ path: 'users/user1/documents/doc1' });

      await expect(
        deleteDocument('user1', 'doc1')
      ).resolves.toBeUndefined();

      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('listDocuments', () => {
    test('should validate userId parameter', async () => {
      await expect(
        listDocuments(null)
      ).rejects.toThrow('Invalid userId');
    });

    test('should return empty array when no documents exist', async () => {
      const { getDocs } = await import('firebase/firestore');
      
      getDocs.mockResolvedValue({
        empty: true,
        forEach: vi.fn(),
      });

      const results = await listDocuments('user1');
      expect(results).toEqual([]);
    });

    test('should list all documents for a user', async () => {
      const { getDocs, collection } = await import('firebase/firestore');
      
      const mockDocs = [
        {
          id: 'doc1',
          data: () => ({
            name: 'Document 1',
            uploadedAt: { toDate: () => new Date('2024-01-01') },
            pageCount: 5,
            chunkCount: 10,
            fileSize: 1024,
          }),
        },
        {
          id: 'doc2',
          data: () => ({
            name: 'Document 2',
            uploadedAt: { toDate: () => new Date('2024-01-02') },
            pageCount: 3,
            chunkCount: 6,
            fileSize: 2048,
          }),
        },
      ];

      getDocs.mockResolvedValue({
        empty: false,
        forEach: (callback) => mockDocs.forEach(callback),
      });

      collection.mockReturnValue({ path: 'users/user1/documents' });

      const results = await listDocuments('user1');
      
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('name');
      expect(results[0]).toHaveProperty('uploadedAt');
      expect(results[0]).toHaveProperty('pageCount');
      expect(results[0]).toHaveProperty('chunkCount');
      expect(results[0]).toHaveProperty('fileSize');
    });
  });

  describe('getDocument', () => {
    test('should validate userId parameter', async () => {
      await expect(
        getDocument(null, 'doc1')
      ).rejects.toThrow('Invalid userId');
    });

    test('should validate documentId parameter', async () => {
      await expect(
        getDocument('user1', null)
      ).rejects.toThrow('Invalid documentId');
    });

    test('should return null when document does not exist', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getDocument('user1', 'doc1');
      expect(result).toBeNull();
    });

    test('should return document data when it exists', async () => {
      const { getDoc, doc } = await import('firebase/firestore');
      
      getDoc.mockResolvedValue({
        exists: () => true,
        id: 'doc1',
        data: () => ({
          name: 'Document 1',
          uploadedAt: { toDate: () => new Date('2024-01-01') },
          pageCount: 5,
          chunkCount: 10,
          chunks: [
            { text: 'chunk1', embedding: [0.1, 0.2], chunkIndex: 0 },
          ],
        }),
      });

      doc.mockReturnValue({ path: 'users/user1/documents/doc1' });

      const result = await getDocument('user1', 'doc1');
      
      expect(result).not.toBeNull();
      expect(result.id).toBe('doc1');
      expect(result.name).toBe('Document 1');
      expect(result.chunks).toHaveLength(1);
    });
  });
});
