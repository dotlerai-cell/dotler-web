/**
 * Gemini Service Tests
 * 
 * Tests the AI-powered campaign generation, iteration, audience suggestions,
 * and ad copy variation functions.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  generateCampaign,
  iterateCampaign,
  generateAudienceSuggestions,
  generateAdCopyVariations
} from '../geminiService.js';

// Mock the fetch API
global.fetch = vi.fn();

describe('GeminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set a mock API key
    import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';
  });

  describe('generateCampaign', () => {
    test('should generate campaign with valid context', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                name: 'Test Campaign',
                objective: 'OUTCOME_SALES',
                dailyBudget: 50,
                targeting: {
                  ageMin: 18,
                  ageMax: 65,
                  genders: ['all'],
                  locations: [],
                  interests: ['Shopping'],
                  behaviors: []
                },
                adCopy: 'Test ad copy',
                headlines: ['Headline 1', 'Headline 2', 'Headline 3', 'Headline 4', 'Headline 5'],
                descriptions: ['Description 1'],
                callToAction: 'SHOP_NOW'
              })
            }]
          }
        }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const context = {
        documentChunks: ['Company sells widgets'],
        websiteContent: { productInfo: 'Premium widgets' },
        additionalInfo: 'Target young professionals'
      };

      const result = await generateCampaign(context);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Campaign');
      expect(result.objective).toBe('OUTCOME_SALES');
      expect(result.dailyBudget).toBe(50);
      expect(result.generatedBy).toBe('ai');
    });

    test('should handle empty context', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                name: 'Default Campaign',
                objective: 'OUTCOME_SALES',
                dailyBudget: 10
              })
            }]
          }
        }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await generateCampaign({});

      expect(result).toBeDefined();
      expect(result.name).toBeDefined();
    });

    test('should throw error when API key is missing', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = '';

      await expect(generateCampaign({})).rejects.toThrow();
    });
  });

  describe('iterateCampaign', () => {
    test('should iterate campaign with user message', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                message: 'Updated targeting',
                changes: {
                  targeting: {
                    ageMin: 25,
                    ageMax: 45
                  }
                },
                affectedFields: ['targeting.ageMin', 'targeting.ageMax'],
                explanation: 'Adjusted age range'
              })
            }]
          }
        }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const currentCampaign = {
        name: 'Test Campaign',
        targeting: { ageMin: 18, ageMax: 65 }
      };

      const result = await iterateCampaign(
        currentCampaign,
        'Target younger audience',
        {}
      );

      expect(result).toBeDefined();
      expect(result.message).toBe('Updated targeting');
      expect(result.changes).toBeDefined();
      expect(result.affectedFields).toContain('targeting.ageMin');
    });
  });

  describe('generateAudienceSuggestions', () => {
    test('should generate audience suggestions', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                audiences: [
                  {
                    name: 'Tech Enthusiasts',
                    description: 'People interested in technology',
                    interests: ['Technology', 'Gadgets'],
                    demographics: 'Ages 18-45',
                    behaviors: ['Early adopters'],
                    rationale: 'High engagement',
                    ranking: 1
                  }
                ]
              })
            }]
          }
        }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const campaignData = {
        name: 'Tech Campaign',
        objective: 'OUTCOME_SALES'
      };

      const result = await generateAudienceSuggestions(campaignData, {});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe('Tech Enthusiasts');
    });

    test('should return fallback suggestions on API error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'));

      const campaignData = {
        objective: 'OUTCOME_SALES'
      };

      const result = await generateAudienceSuggestions(campaignData, {});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateAdCopyVariations', () => {
    test('should generate ad copy variations', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                variations: [
                  'Variation 1 - benefit focused',
                  'Variation 2 - feature focused',
                  'Variation 3 - urgency driven'
                ]
              })
            }]
          }
        }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await generateAdCopyVariations(
        'Premium widgets for professionals',
        'professional',
        3
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    test('should enforce minimum variations count', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                variations: [
                  'Variation 1',
                  'Variation 2',
                  'Variation 3'
                ]
              })
            }]
          }
        }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await generateAdCopyVariations('Product info', 'casual', 1);

      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    test('should return fallback variations on API error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await generateAdCopyVariations(
        'Product info',
        'professional',
        3
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });
  });
});
