/**
 * Configuration Tests
 * 
 * Tests to verify that the AI Campaign Generator configuration is set up correctly.
 */

import { describe, test, expect } from 'vitest';
import {
  geminiConfig,
  pdfConfig,
  vectorDbConfig,
  scrapingConfig,
  campaignConfig,
  validationConfig,
} from '../aiConfig';

describe('AI Configuration', () => {
  test('geminiConfig should have required properties', () => {
    expect(geminiConfig).toBeDefined();
    expect(geminiConfig.baseUrl).toBe('https://generativelanguage.googleapis.com/v1beta');
    expect(geminiConfig.model).toBe('gemini-1.5-pro');
    expect(geminiConfig.embeddingModel).toBe('text-embedding-004');
    expect(geminiConfig.maxRetries).toBe(3);
    expect(geminiConfig.timeout).toBe(30000);
  });

  test('pdfConfig should have valid limits', () => {
    expect(pdfConfig).toBeDefined();
    expect(pdfConfig.maxFileSize).toBe(10 * 1024 * 1024); // 10MB
    expect(pdfConfig.chunkSize).toBe(500);
    expect(pdfConfig.supportedFormats).toContain('application/pdf');
  });

  test('vectorDbConfig should have collection names', () => {
    expect(vectorDbConfig).toBeDefined();
    expect(vectorDbConfig.collection).toBe('documents');
    expect(vectorDbConfig.draftsCollection).toBe('drafts');
    expect(vectorDbConfig.topK).toBe(10);
    expect(vectorDbConfig.similarityThreshold).toBe(0.7);
  });

  test('scrapingConfig should have timeout settings', () => {
    expect(scrapingConfig).toBeDefined();
    expect(scrapingConfig.timeout).toBe(10000);
    expect(scrapingConfig.maxRetries).toBe(2);
    expect(scrapingConfig.userAgent).toContain('CampaignGenerator');
  });

  test('campaignConfig should have variation limits', () => {
    expect(campaignConfig).toBeDefined();
    expect(campaignConfig.minAdCopyVariations).toBe(3);
    expect(campaignConfig.maxAdCopyVariations).toBe(10);
    expect(campaignConfig.minHeadlineVariations).toBe(5);
    expect(campaignConfig.maxHeadlineVariations).toBe(15);
    expect(campaignConfig.additionalInfoMaxLength).toBe(5000);
  });

  test('validationConfig should have budget constraints', () => {
    expect(validationConfig).toBeDefined();
    expect(validationConfig.minDailyBudget).toBe(1);
    expect(validationConfig.maxDailyBudget).toBe(100000);
    expect(validationConfig.minCampaignDuration).toBe(1);
    expect(validationConfig.maxCampaignDuration).toBe(365);
  });
});
