/**
 * Embeddings Utility Tests
 */

import { describe, test, expect } from 'vitest';
import { cosineSimilarity, findMostSimilar } from '../embeddings.js';

describe('Embeddings Utility', () => {
  describe('cosineSimilarity', () => {
    test('should return 1 for identical vectors', () => {
      const vec1 = [1, 2, 3, 4, 5];
      const vec2 = [1, 2, 3, 4, 5];
      
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(1, 5);
    });

    test('should return -1 for opposite vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [-1, -2, -3];
      
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(-1, 5);
    });

    test('should return 0 for orthogonal vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];
      
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(0, 5);
    });

    test('should throw error for invalid embeddings', () => {
      expect(() => cosineSimilarity(null, [1, 2, 3])).toThrow();
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
    });

    test('should handle zero vectors', () => {
      const vec1 = [0, 0, 0];
      const vec2 = [1, 2, 3];
      
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBe(0);
    });
  });

  describe('findMostSimilar', () => {
    test('should find most similar embeddings', () => {
      const query = [1, 0, 0];
      const candidates = [
        { embedding: [1, 0, 0], data: 'exact match' },
        { embedding: [0.9, 0.1, 0], data: 'close match' },
        { embedding: [0, 1, 0], data: 'orthogonal' },
        { embedding: [-1, 0, 0], data: 'opposite' },
      ];

      const results = findMostSimilar(query, candidates, 2);
      
      expect(results.length).toBe(2);
      expect(results[0].data).toBe('exact match');
      expect(results[0].similarity).toBeCloseTo(1, 5);
      expect(results[1].data).toBe('close match');
    });

    test('should respect topK parameter', () => {
      const query = [1, 1, 1];
      const candidates = Array.from({ length: 10 }, (_, i) => ({
        embedding: [i, i, i],
        data: `item-${i}`,
      }));

      const results = findMostSimilar(query, candidates, 3);
      
      expect(results.length).toBe(3);
    });

    test('should handle empty candidates', () => {
      const query = [1, 0, 0];
      const results = findMostSimilar(query, [], 5);
      
      expect(results.length).toBe(0);
    });

    test('should throw error for invalid parameters', () => {
      expect(() => findMostSimilar(null, [])).toThrow();
      expect(() => findMostSimilar([1, 2], null)).toThrow();
    });

    test('should sort results by similarity descending', () => {
      const query = [1, 0, 0];
      const candidates = [
        { embedding: [0.5, 0.5, 0], data: 'medium' },
        { embedding: [1, 0, 0], data: 'high' },
        { embedding: [0.1, 0.9, 0], data: 'low' },
      ];

      const results = findMostSimilar(query, candidates, 3);
      
      expect(results[0].data).toBe('high');
      expect(results[1].data).toBe('medium');
      expect(results[2].data).toBe('low');
      expect(results[0].similarity).toBeGreaterThan(results[1].similarity);
      expect(results[1].similarity).toBeGreaterThan(results[2].similarity);
    });
  });
});
