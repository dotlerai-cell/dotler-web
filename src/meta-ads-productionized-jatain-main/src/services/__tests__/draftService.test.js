/**
 * Unit tests for Draft Service
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  saveDraft,
  loadDraft,
  listDrafts,
  deleteDraft,
  updateDraft,
  getDraft,
} from '../draftService.js';

// Mock Firestore
vi.mock('../../firebase.js', () => ({
  db: {},
}));

// Create mock data store outside the mock
const mockData = new Map();

vi.mock('firebase/firestore', () => {
  const mockTimestamp = {
    now: vi.fn(() => ({ toDate: () => new Date('2024-01-01T00:00:00Z') })),
  };

  return {
    collection: vi.fn((db, ...path) => ({ path: path.join('/') })),
    doc: vi.fn((db, ...path) => ({ path: path.join('/'), id: path[path.length - 1] })),
    setDoc: vi.fn(async (docRef, data) => {
      mockData.set(docRef.path, data);
      return Promise.resolve();
    }),
    getDoc: vi.fn(async (docRef) => {
      const data = mockData.get(docRef.path);
      return Promise.resolve({
        exists: () => !!data,
        data: () => data,
        id: docRef.id,
      });
    }),
    getDocs: vi.fn(async (queryRef) => {
      const drafts = [];
      mockData.forEach((data, path) => {
        if (path.includes('drafts')) {
          const id = path.split('/').pop();
          drafts.push({
            id,
            data: () => data,
          });
        }
      });
      return Promise.resolve({
        empty: drafts.length === 0,
        forEach: (callback) => drafts.forEach(callback),
      });
    }),
    deleteDoc: vi.fn(async (docRef) => {
      mockData.delete(docRef.path);
      return Promise.resolve();
    }),
    query: vi.fn((ref, ...constraints) => ref),
    orderBy: vi.fn(() => ({})),
    Timestamp: mockTimestamp,
  };
});

describe('Draft Service', () => {
  const mockUserId = 'test-user-123';
  const mockDraftId = 'draft-123';
  
  const mockFormData = {
    name: 'Test Campaign',
    objective: 'OUTCOME_SALES',
    dailyBudget: 50,
    targeting: {
      ageMin: 18,
      ageMax: 65,
    },
  };

  const mockChatHistory = [
    { id: '1', role: 'user', content: 'Generate a campaign', timestamp: new Date() },
    { id: '2', role: 'assistant', content: 'Campaign generated', timestamp: new Date() },
  ];

  const mockDraftData = {
    campaignName: 'Test Campaign',
    formData: mockFormData,
    chatHistory: mockChatHistory,
    uploadedDocuments: ['doc1', 'doc2'],
    websiteUrl: 'https://example.com',
    additionalInfo: 'Additional context',
  };

  beforeEach(() => {
    // Clear mock data before each test
    mockData.clear();
    vi.clearAllMocks();
  });

  describe('saveDraft', () => {
    test('should save a draft with all data', async () => {
      const draftId = await saveDraft(mockUserId, mockDraftId, mockDraftData);

      expect(draftId).toBe(mockDraftId);
    });

    test('should generate draft ID if not provided', async () => {
      const draftId = await saveDraft(mockUserId, null, mockDraftData);

      expect(draftId).toBeTruthy();
      expect(draftId).toMatch(/^draft_/);
    });

    test('should save draft with minimal data', async () => {
      const minimalData = {
        formData: mockFormData,
      };

      const draftId = await saveDraft(mockUserId, mockDraftId, minimalData);

      expect(draftId).toBe(mockDraftId);
    });

    test('should use campaign name from formData if not provided', async () => {
      const dataWithoutName = {
        formData: mockFormData,
      };

      await saveDraft(mockUserId, mockDraftId, dataWithoutName);
      const loaded = await loadDraft(mockUserId, mockDraftId);

      expect(loaded.campaignName).toBe('Test Campaign');
    });

    test('should throw error for invalid userId', async () => {
      await expect(saveDraft('', mockDraftId, mockDraftData)).rejects.toThrow('Invalid userId');
      await expect(saveDraft(null, mockDraftId, mockDraftData)).rejects.toThrow('Invalid userId');
    });

    test('should throw error for invalid draftData', async () => {
      await expect(saveDraft(mockUserId, mockDraftId, null)).rejects.toThrow('Invalid draftData');
      await expect(saveDraft(mockUserId, mockDraftId, {})).rejects.toThrow('Draft must include formData');
    });
  });

  describe('loadDraft', () => {
    test('should load an existing draft', async () => {
      await saveDraft(mockUserId, mockDraftId, mockDraftData);
      const loaded = await loadDraft(mockUserId, mockDraftId);

      expect(loaded).toBeTruthy();
      expect(loaded.id).toBe(mockDraftId);
      expect(loaded.campaignName).toBe(mockDraftData.campaignName);
      expect(loaded.formData).toEqual(mockDraftData.formData);
      expect(loaded.chatHistory).toEqual(mockDraftData.chatHistory);
      expect(loaded.uploadedDocuments).toEqual(mockDraftData.uploadedDocuments);
      expect(loaded.websiteUrl).toBe(mockDraftData.websiteUrl);
      expect(loaded.additionalInfo).toBe(mockDraftData.additionalInfo);
    });

    test('should return null for non-existent draft', async () => {
      const loaded = await loadDraft(mockUserId, 'non-existent');

      expect(loaded).toBeNull();
    });

    test('should handle drafts with missing optional fields', async () => {
      const minimalData = {
        formData: mockFormData,
      };

      await saveDraft(mockUserId, mockDraftId, minimalData);
      const loaded = await loadDraft(mockUserId, mockDraftId);

      expect(loaded.chatHistory).toEqual([]);
      expect(loaded.uploadedDocuments).toEqual([]);
      expect(loaded.websiteUrl).toBeNull();
      expect(loaded.additionalInfo).toBeNull();
    });

    test('should throw error for invalid userId', async () => {
      await expect(loadDraft('', mockDraftId)).rejects.toThrow('Invalid userId');
      await expect(loadDraft(null, mockDraftId)).rejects.toThrow('Invalid userId');
    });

    test('should throw error for invalid draftId', async () => {
      await expect(loadDraft(mockUserId, '')).rejects.toThrow('Invalid draftId');
      await expect(loadDraft(mockUserId, null)).rejects.toThrow('Invalid draftId');
    });
  });

  describe('listDrafts', () => {
    test('should list all drafts for a user', async () => {
      await saveDraft(mockUserId, 'draft1', mockDraftData);
      await saveDraft(mockUserId, 'draft2', { ...mockDraftData, campaignName: 'Campaign 2' });

      const drafts = await listDrafts(mockUserId);

      expect(drafts).toHaveLength(2);
      expect(drafts[0].id).toBeTruthy();
      expect(drafts[0].campaignName).toBeTruthy();
      expect(drafts[0].savedAt).toBeInstanceOf(Date);
    });

    test('should return empty array when no drafts exist', async () => {
      const drafts = await listDrafts(mockUserId);

      expect(drafts).toEqual([]);
    });

    test('should include preview data in list', async () => {
      await saveDraft(mockUserId, mockDraftId, mockDraftData);

      const drafts = await listDrafts(mockUserId);

      expect(drafts[0].objective).toBe(mockFormData.objective);
      expect(drafts[0].budget).toBe(mockFormData.dailyBudget);
    });

    test('should throw error for invalid userId', async () => {
      await expect(listDrafts('')).rejects.toThrow('Invalid userId');
      await expect(listDrafts(null)).rejects.toThrow('Invalid userId');
    });
  });

  describe('deleteDraft', () => {
    test('should delete an existing draft', async () => {
      await saveDraft(mockUserId, mockDraftId, mockDraftData);
      
      await deleteDraft(mockUserId, mockDraftId);
      
      const loaded = await loadDraft(mockUserId, mockDraftId);
      expect(loaded).toBeNull();
    });

    test('should throw error when deleting non-existent draft', async () => {
      await expect(deleteDraft(mockUserId, 'non-existent')).rejects.toThrow('not found');
    });

    test('should throw error for invalid userId', async () => {
      await expect(deleteDraft('', mockDraftId)).rejects.toThrow('Invalid userId');
      await expect(deleteDraft(null, mockDraftId)).rejects.toThrow('Invalid userId');
    });

    test('should throw error for invalid draftId', async () => {
      await expect(deleteDraft(mockUserId, '')).rejects.toThrow('Invalid draftId');
      await expect(deleteDraft(mockUserId, null)).rejects.toThrow('Invalid draftId');
    });
  });

  describe('updateDraft', () => {
    test('should update an existing draft', async () => {
      await saveDraft(mockUserId, mockDraftId, mockDraftData);

      const updatedData = {
        ...mockDraftData,
        campaignName: 'Updated Campaign',
        formData: { ...mockFormData, dailyBudget: 100 },
      };

      await updateDraft(mockUserId, mockDraftId, updatedData);
      const loaded = await loadDraft(mockUserId, mockDraftId);

      expect(loaded.campaignName).toBe('Updated Campaign');
      expect(loaded.formData.dailyBudget).toBe(100);
    });

    test('should throw error when updating non-existent draft', async () => {
      await expect(updateDraft(mockUserId, 'non-existent', mockDraftData)).rejects.toThrow('not found');
    });
  });

  describe('getDraft', () => {
    test('should get a draft (alias for loadDraft)', async () => {
      await saveDraft(mockUserId, mockDraftId, mockDraftData);
      const draft = await getDraft(mockUserId, mockDraftId);

      expect(draft).toBeTruthy();
      expect(draft.id).toBe(mockDraftId);
    });
  });

  describe('Draft round-trip', () => {
    test('should preserve all data through save/load cycle', async () => {
      const draftId = await saveDraft(mockUserId, null, mockDraftData);
      const loaded = await loadDraft(mockUserId, draftId);

      expect(loaded.campaignName).toBe(mockDraftData.campaignName);
      expect(loaded.formData).toEqual(mockDraftData.formData);
      expect(loaded.chatHistory).toEqual(mockDraftData.chatHistory);
      expect(loaded.uploadedDocuments).toEqual(mockDraftData.uploadedDocuments);
      expect(loaded.websiteUrl).toBe(mockDraftData.websiteUrl);
      expect(loaded.additionalInfo).toBe(mockDraftData.additionalInfo);
    });

    test('should handle multiple save/load cycles', async () => {
      let draftId = await saveDraft(mockUserId, null, mockDraftData);
      
      for (let i = 0; i < 3; i++) {
        const loaded = await loadDraft(mockUserId, draftId);
        const updated = {
          ...loaded,
          formData: { ...loaded.formData, dailyBudget: loaded.formData.dailyBudget + 10 },
        };
        await updateDraft(mockUserId, draftId, updated);
      }

      const final = await loadDraft(mockUserId, draftId);
      expect(final.formData.dailyBudget).toBe(80); // 50 + 10 + 10 + 10
    });
  });
});
