/**
 * Document Processor Service Tests
 * 
 * Note: extractText and extractMetadata tests require PDF.js which needs
 * a browser environment with DOM APIs. These are tested in browser-based
 * integration tests. Here we test the pure text processing functions.
 */

import { describe, test, expect, vi } from 'vitest';

// Mock pdfjs-dist to avoid DOMMatrix errors in Node environment
vi.mock('pdfjs-dist', () => ({
  default: {},
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

import { chunkText, cleanText } from '../documentProcessor.js';

describe('DocumentProcessor', () => {
  describe('chunkText', () => {
    test('should return empty array for empty text', () => {
      expect(chunkText('')).toEqual([]);
      expect(chunkText('   ')).toEqual([]);
    });

    test('should chunk text into segments', () => {
      const text = 'word '.repeat(1000); // Create a long text
      const chunks = chunkText(text, 100);
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0]).toBeTruthy();
    });

    test('should handle text shorter than chunk size', () => {
      const text = 'This is a short text';
      const chunks = chunkText(text, 500);
      
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe(text);
    });

    test('should not create empty chunks', () => {
      const text = 'word '.repeat(100);
      const chunks = chunkText(text, 50);
      
      chunks.forEach(chunk => {
        expect(chunk.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('cleanText', () => {
    test('should return empty string for null or undefined', () => {
      expect(cleanText(null)).toBe('');
      expect(cleanText(undefined)).toBe('');
      expect(cleanText('')).toBe('');
    });

    test('should remove excessive whitespace', () => {
      const text = 'This   has    too     much      whitespace';
      const cleaned = cleanText(text);
      
      expect(cleaned).toBe('This has too much whitespace');
    });

    test('should normalize line breaks', () => {
      const text = 'Line 1\r\nLine 2\rLine 3\nLine 4';
      const cleaned = cleanText(text);
      
      expect(cleaned).not.toContain('\r');
      expect(cleaned.split('\n').length).toBe(4);
    });

    test('should remove excessive newlines', () => {
      const text = 'Paragraph 1\n\n\n\n\nParagraph 2';
      const cleaned = cleanText(text);
      
      expect(cleaned).toBe('Paragraph 1\n\nParagraph 2');
    });

    test('should trim whitespace from start and end', () => {
      const text = '   Some text with spaces   ';
      const cleaned = cleanText(text);
      
      expect(cleaned).toBe('Some text with spaces');
    });

    test('should remove control characters', () => {
      const text = 'Text\x00with\x01control\x02chars';
      const cleaned = cleanText(text);
      
      expect(cleaned).not.toContain('\x00');
      expect(cleaned).not.toContain('\x01');
      expect(cleaned).not.toContain('\x02');
    });
  });
});
