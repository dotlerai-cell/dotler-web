/**
 * Campaign Generator Service Tests
 * 
 * Tests the orchestration service that coordinates document retrieval,
 * website scraping, AI generation, and validation.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { generate, validate, applyIterationChanges } from '../campaignGenerator.js';
import * as geminiService from '../geminiService.js';
import * as vectorDatabase from '../vectorDatabase.js';
import * as webScraper from '../webScraper.js';
import * as validationService from '../validationService.js';
import * as embeddings from '../../utils/embeddings.js';

// Mock all dependencies
vi.mock('../geminiService.js');
vi.mock('../vectorDatabase.js');
vi.mock('../webScraper.js');
vi.mock('../validationService.js');
vi.mock('../../utils/embeddings.js');

describe('CampaignGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generate', () => {
    test('should orchestrate full generation flow with all context', async () => {
      // Mock document retrieval
      vi.mocked(embeddings.generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);
      vi.mocked(vectorDatabase.searchSimilar).mockResolvedValue([
        { text: 'Company info chunk 1', documentId: 'doc1', similarity: 0.9 },
        { text: 'Company info chunk 2', documentId: 'doc1', similarity: 0.8 },
      ]);

      // Mock website scraping
      vi.mocked(webScraper.scrapeUrl).mockResolvedValue({
        url: 'https://example.com',
        title: 'Example Product',
        metaTags: {
          description: 'Great product',
          ogDescription: 'Amazing product',
        },
        productInfo: {
          productNames: ['Widget Pro'],
          descriptions: ['Best widget ever'],
          features: ['Feature 1', 'Feature 2'],
          benefits: ['Benefit 1'],
          categories: ['Electronics'],
        },
        pricing: {
          prices: [99.99],
          currency: 'USD',
          hasDiscount: false,
        },
      });

      // Mock AI generation
      const mockCampaign = {
        name: 'Generated Campaign',
        objective: 'OUTCOME_SALES',
        status: 'ACTIVE',
        dailyBudget: 50,
        targeting: {
          ageMin: 18,
          ageMax: 65,
          genders: ['all'],
          locations: [],
          interests: ['Shopping'],
          behaviors: [],
        },
        adCopy: 'Buy now!',
        headlines: ['Headline 1', 'Headline 2', 'Headline 3', 'Headline 4', 'Headline 5'],
        descriptions: ['Description 1'],
        callToAction: 'SHOP_NOW',
        targetUrl: 'https://example.com',
        generatedBy: 'ai',
      };
      vi.mocked(geminiService.generateCampaign).mockResolvedValue(mockCampaign);

      // Mock validation
      vi.mocked(validationService.validateCampaignForm).mockReturnValue({
        valid: true,
        errors: {},
      });

      // Execute generation
      const result = await generate({
        userId: 'user123',
        documentIds: ['doc1'],
        websiteUrl: 'https://example.com',
        additionalInfo: 'Target young professionals',
        userPreferences: { tone: 'professional' },
      });

      // Verify result
      expect(result).toBeDefined();
      expect(result.name).toBe('Generated Campaign');
      expect(result.objective).toBe('OUTCOME_SALES');

      // Verify all services were called
      expect(embeddings.generateEmbedding).toHaveBeenCalled();
      expect(vectorDatabase.searchSimilar).toHaveBeenCalledWith('user123', expect.any(Array), 10);
      expect(webScraper.scrapeUrl).toHaveBeenCalledWith('https://example.com');
      expect(geminiService.generateCampaign).toHaveBeenCalled();
      expect(validationService.validateCampaignForm).toHaveBeenCalled();
    });

    test('should handle generation without website URL', async () => {
      // Mock document retrieval
      vi.mocked(embeddings.generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);
      vi.mocked(vectorDatabase.searchSimilar).mockResolvedValue([
        { text: 'Company info', documentId: 'doc1', similarity: 0.9 },
      ]);

      // Mock AI generation
      const mockCampaign = {
        name: 'Campaign',
        objective: 'OUTCOME_SALES',
        dailyBudget: 20,
        targeting: { ageMin: 18, ageMax: 65, genders: ['all'] },
        adCopy: 'Test',
        headlines: ['H1', 'H2', 'H3', 'H4', 'H5'],
        callToAction: 'LEARN_MORE',
        targetUrl: 'https://example.com',
      };
      vi.mocked(geminiService.generateCampaign).mockResolvedValue(mockCampaign);
      vi.mocked(validationService.validateCampaignForm).mockReturnValue({ valid: true, errors: {} });

      const result = await generate({
        userId: 'user123',
        additionalInfo: 'Some context',
      });

      expect(result).toBeDefined();
      expect(webScraper.scrapeUrl).not.toHaveBeenCalled();
      expect(geminiService.generateCampaign).toHaveBeenCalled();
    });

    test('should continue generation if website scraping fails', async () => {
      // Mock document retrieval
      vi.mocked(embeddings.generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);
      vi.mocked(vectorDatabase.searchSimilar).mockResolvedValue([]);

      // Mock scraping failure
      vi.mocked(webScraper.scrapeUrl).mockRejectedValue(new Error('Scraping failed'));

      // Mock AI generation
      const mockCampaign = {
        name: 'Campaign',
        objective: 'OUTCOME_SALES',
        dailyBudget: 20,
        targeting: { ageMin: 18, ageMax: 65, genders: ['all'] },
        adCopy: 'Test',
        headlines: ['H1', 'H2', 'H3', 'H4', 'H5'],
        callToAction: 'LEARN_MORE',
        targetUrl: 'https://example.com',
      };
      vi.mocked(geminiService.generateCampaign).mockResolvedValue(mockCampaign);
      vi.mocked(validationService.validateCampaignForm).mockReturnValue({ valid: true, errors: {} });

      const result = await generate({
        userId: 'user123',
        websiteUrl: 'https://example.com',
      });

      // Should still succeed
      expect(result).toBeDefined();
      expect(geminiService.generateCampaign).toHaveBeenCalled();
    });

    test('should call progress callback at each step', async () => {
      const onProgress = vi.fn();

      // Mock all services
      vi.mocked(embeddings.generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);
      vi.mocked(vectorDatabase.searchSimilar).mockResolvedValue([]);
      vi.mocked(geminiService.generateCampaign).mockResolvedValue({
        name: 'Campaign',
        objective: 'OUTCOME_SALES',
        dailyBudget: 20,
        targeting: { ageMin: 18, ageMax: 65, genders: ['all'] },
        adCopy: 'Test',
        headlines: ['H1', 'H2', 'H3', 'H4', 'H5'],
        callToAction: 'LEARN_MORE',
        targetUrl: 'https://example.com',
      });
      vi.mocked(validationService.validateCampaignForm).mockReturnValue({ valid: true, errors: {} });

      await generate({
        userId: 'user123',
        onProgress,
      });

      // Verify progress was called
      expect(onProgress).toHaveBeenCalledWith('retrieving', expect.any(String));
      expect(onProgress).toHaveBeenCalledWith('retrieved', expect.any(String));
      expect(onProgress).toHaveBeenCalledWith('generating', expect.any(String));
      expect(onProgress).toHaveBeenCalledWith('generated', expect.any(String));
      expect(onProgress).toHaveBeenCalledWith('validating', expect.any(String));
      expect(onProgress).toHaveBeenCalledWith('complete', expect.any(String));
    });

    test('should throw error if userId is missing', async () => {
      await expect(generate({})).rejects.toThrow('Valid userId is required');
    });

    test('should throw error if AI generation fails', async () => {
      vi.mocked(embeddings.generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);
      vi.mocked(vectorDatabase.searchSimilar).mockResolvedValue([]);
      vi.mocked(geminiService.generateCampaign).mockRejectedValue(new Error('AI error'));

      await expect(generate({ userId: 'user123' })).rejects.toThrow('Failed to generate campaign');
    });

    test('should attach validation warnings if campaign has issues', async () => {
      vi.mocked(embeddings.generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);
      vi.mocked(vectorDatabase.searchSimilar).mockResolvedValue([]);
      
      const mockCampaign = {
        name: 'Campaign',
        objective: 'OUTCOME_SALES',
        dailyBudget: 20,
        targeting: { ageMin: 18, ageMax: 65, genders: ['all'] },
        adCopy: 'Test',
        headlines: ['H1', 'H2', 'H3', 'H4', 'H5'],
        callToAction: 'LEARN_MORE',
        targetUrl: 'https://example.com',
      };
      vi.mocked(geminiService.generateCampaign).mockResolvedValue(mockCampaign);
      
      // Mock validation with errors
      vi.mocked(validationService.validateCampaignForm).mockReturnValue({
        valid: false,
        errors: { name: { error: 'Name too long' } },
      });

      const result = await generate({ userId: 'user123' });

      expect(result._validationWarnings).toBeDefined();
      expect(result._validationWarnings.name).toBeDefined();
    });
  });

  describe('validate', () => {
    test('should validate campaign using validation service', () => {
      const mockCampaign = {
        name: 'Test Campaign',
        objective: 'OUTCOME_SALES',
        dailyBudget: 50,
      };

      vi.mocked(validationService.validateCampaignForm).mockReturnValue({
        valid: true,
        errors: {},
      });

      const result = validate(mockCampaign);

      expect(result.valid).toBe(true);
      expect(validationService.validateCampaignForm).toHaveBeenCalledWith(mockCampaign);
    });

    test('should return invalid for null campaign', () => {
      const result = validate(null);

      expect(result.valid).toBe(false);
      expect(result.errors.general).toBeDefined();
    });

    test('should return validation errors', () => {
      const mockCampaign = { name: 'Test' };

      vi.mocked(validationService.validateCampaignForm).mockReturnValue({
        valid: false,
        errors: {
          objective: { error: 'Required' },
          dailyBudget: { error: 'Required' },
        },
      });

      const result = validate(mockCampaign);

      expect(result.valid).toBe(false);
      expect(result.errors.objective).toBeDefined();
      expect(result.errors.dailyBudget).toBeDefined();
    });
  });

  describe('applyIterationChanges', () => {
    test('should apply changes from AI iteration', async () => {
      const currentCampaign = {
        name: 'Original Campaign',
        objective: 'OUTCOME_SALES',
        dailyBudget: 50,
        targeting: {
          ageMin: 18,
          ageMax: 65,
        },
      };

      const iterationResult = {
        message: 'Updated targeting',
        changes: {
          targeting: {
            ageMin: 25,
            ageMax: 45,
          },
        },
        affectedFields: ['targeting.ageMin', 'targeting.ageMax'],
        explanation: 'Narrowed age range',
      };

      vi.mocked(geminiService.iterateCampaign).mockResolvedValue(iterationResult);
      vi.mocked(validationService.validateCampaignForm).mockReturnValue({
        valid: true,
        errors: {},
      });

      const result = await applyIterationChanges(
        currentCampaign,
        'Target younger audience',
        { userId: 'user123' }
      );

      expect(result.campaign).toBeDefined();
      expect(result.campaign.targeting.ageMin).toBe(25);
      expect(result.campaign.targeting.ageMax).toBe(45);
      expect(result.campaign.name).toBe('Original Campaign'); // Unchanged field preserved
      expect(result.message).toBe('Updated targeting');
      expect(result.affectedFields).toContain('targeting.ageMin');
    });

    test('should preserve manually edited fields', async () => {
      const currentCampaign = {
        name: 'Campaign',
        objective: 'OUTCOME_SALES',
        dailyBudget: 50,
        adCopy: 'Original copy',
        manuallyEditedFields: ['adCopy'],
      };

      const iterationResult = {
        message: 'Updated budget',
        changes: {
          dailyBudget: 100,
        },
        affectedFields: ['dailyBudget'],
        explanation: 'Increased budget',
      };

      vi.mocked(geminiService.iterateCampaign).mockResolvedValue(iterationResult);
      vi.mocked(validationService.validateCampaignForm).mockReturnValue({
        valid: true,
        errors: {},
      });

      const result = await applyIterationChanges(
        currentCampaign,
        'Increase budget',
        { userId: 'user123' }
      );

      expect(result.campaign.dailyBudget).toBe(100);
      expect(result.campaign.adCopy).toBe('Original copy'); // Preserved
    });

    test('should throw error if current campaign is invalid', async () => {
      await expect(
        applyIterationChanges(null, 'Update campaign', {})
      ).rejects.toThrow('Valid current campaign data is required');
    });

    test('should throw error if user message is empty', async () => {
      await expect(
        applyIterationChanges({ name: 'Campaign' }, '', {})
      ).rejects.toThrow('Valid user message is required');
    });

    test('should retrieve document context if message references documents', async () => {
      const currentCampaign = {
        name: 'Campaign',
        objective: 'OUTCOME_SALES',
        dailyBudget: 50,
      };

      vi.mocked(embeddings.generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);
      vi.mocked(vectorDatabase.searchSimilar).mockResolvedValue([
        { text: 'Document info', documentId: 'doc1', similarity: 0.9 },
      ]);

      vi.mocked(geminiService.iterateCampaign).mockResolvedValue({
        message: 'Updated',
        changes: {},
        affectedFields: [],
        explanation: 'Done',
      });

      vi.mocked(validationService.validateCampaignForm).mockReturnValue({
        valid: true,
        errors: {},
      });

      await applyIterationChanges(
        currentCampaign,
        'Use information from the document',
        { userId: 'user123' }
      );

      expect(embeddings.generateEmbedding).toHaveBeenCalled();
      expect(vectorDatabase.searchSimilar).toHaveBeenCalled();
    });

    test('should continue if document retrieval fails', async () => {
      const currentCampaign = {
        name: 'Campaign',
        objective: 'OUTCOME_SALES',
        dailyBudget: 50,
      };

      vi.mocked(embeddings.generateEmbedding).mockRejectedValue(new Error('Embedding failed'));

      vi.mocked(geminiService.iterateCampaign).mockResolvedValue({
        message: 'Updated',
        changes: { dailyBudget: 100 },
        affectedFields: ['dailyBudget'],
        explanation: 'Done',
      });

      vi.mocked(validationService.validateCampaignForm).mockReturnValue({
        valid: true,
        errors: {},
      });

      const result = await applyIterationChanges(
        currentCampaign,
        'Check the document and increase budget',
        { userId: 'user123' }
      );

      // Should still succeed
      expect(result.campaign.dailyBudget).toBe(100);
    });

    test('should include validation result in response', async () => {
      const currentCampaign = {
        name: 'Campaign',
        objective: 'OUTCOME_SALES',
        dailyBudget: 50,
      };

      vi.mocked(geminiService.iterateCampaign).mockResolvedValue({
        message: 'Updated',
        changes: { dailyBudget: 0.5 }, // Invalid budget
        affectedFields: ['dailyBudget'],
        explanation: 'Done',
      });

      vi.mocked(validationService.validateCampaignForm).mockReturnValue({
        valid: false,
        errors: {
          dailyBudget: { error: 'Budget too low' },
        },
      });

      const result = await applyIterationChanges(
        currentCampaign,
        'Lower budget',
        {}
      );

      expect(result.validationResult).toBeDefined();
      expect(result.validationResult.valid).toBe(false);
      expect(result.validationResult.errors.dailyBudget).toBeDefined();
    });
  });
});
