/**
 * Web Scraper Service Tests
 * 
 * Tests the web scraping functionality including URL validation,
 * HTML parsing, product information extraction, pricing detection,
 * and meta tag extraction.
 * 
 * @vitest-environment jsdom
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { extractProductInfo, extractPricing, extractMetaTags } from '../webScraper.js';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (text, options) => {
      if (options?.ALLOWED_TAGS?.length === 0) {
        // Strip all HTML tags
        return text.replace(/<[^>]*>/g, '');
      }
      return text;
    },
  },
}));

describe('WebScraper', () => {
  describe('extractProductInfo', () => {
    test('should extract product descriptions from meta tags', () => {
      const html = `
        <html>
          <head>
            <meta property="og:description" content="Amazing product description" />
            <meta name="description" content="Standard meta description" />
          </head>
          <body></body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractProductInfo(doc);
      
      expect(result.descriptions).toContain('Amazing product description');
      expect(result.descriptions).toContain('Standard meta description');
    });

    test('should extract product features from lists', () => {
      const html = `
        <html>
          <body>
            <ul class="product-features">
              <li>Feature 1: High quality</li>
              <li>Feature 2: Durable material</li>
              <li>Feature 3: Easy to use</li>
            </ul>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractProductInfo(doc);
      
      expect(result.features.length).toBeGreaterThan(0);
      expect(result.features).toContain('Feature 1: High quality');
    });

    test('should extract benefits from benefit lists', () => {
      const html = `
        <html>
          <body>
            <ul class="benefits">
              <li>Saves time and money</li>
              <li>Improves productivity</li>
            </ul>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractProductInfo(doc);
      
      expect(result.benefits.length).toBeGreaterThan(0);
      expect(result.benefits).toContain('Saves time and money');
    });

    test('should extract product names from headings', () => {
      const html = `
        <html>
          <body>
            <h1>Premium Widget Pro</h1>
            <h2>Advanced Features</h2>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractProductInfo(doc);
      
      expect(result.productNames).toContain('Premium Widget Pro');
      expect(result.productNames).toContain('Advanced Features');
    });

    test('should handle empty document', () => {
      const html = '<html><body></body></html>';
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractProductInfo(doc);
      
      expect(result.descriptions).toEqual([]);
      expect(result.features).toEqual([]);
      expect(result.benefits).toEqual([]);
    });

    test('should deduplicate descriptions', () => {
      const html = `
        <html>
          <head>
            <meta property="og:description" content="Same description" />
            <meta name="description" content="Same description" />
          </head>
          <body></body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractProductInfo(doc);
      
      // Should only have one instance of the duplicate description
      const sameDescCount = result.descriptions.filter(d => d === 'Same description').length;
      expect(sameDescCount).toBe(1);
    });
  });

  describe('extractPricing', () => {
    test('should extract price from common price selectors', () => {
      const html = `
        <html>
          <body>
            <span class="price">$49.99</span>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractPricing(doc);
      
      expect(result.prices).toContain(49.99);
      expect(result.currency).toBe('USD');
    });

    test('should extract price from meta tags', () => {
      const html = `
        <html>
          <head>
            <meta property="product:price:amount" content="99.99" />
            <meta property="product:price:currency" content="EUR" />
          </head>
          <body></body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractPricing(doc);
      
      expect(result.prices).toContain(99.99);
      expect(result.currency).toBe('EUR');
    });

    test('should detect discounts', () => {
      const html = `
        <html>
          <body>
            <span class="original-price">$99.99</span>
            <span class="sale-price">$79.99</span>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractPricing(doc);
      
      expect(result.hasDiscount).toBe(true);
      expect(result.originalPrice).toBe(99.99);
      expect(result.salePrice).toBe(79.99);
    });

    test('should handle multiple currency formats', () => {
      const html = `
        <html>
          <body>
            <span class="price">€29.99</span>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractPricing(doc);
      
      expect(result.prices).toContain(29.99);
      expect(result.currency).toBe('EUR');
    });

    test('should handle prices with commas', () => {
      const html = `
        <html>
          <body>
            <span class="price">$1,299.99</span>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractPricing(doc);
      
      expect(result.prices).toContain(1299.99);
    });

    test('should default to USD if currency not found', () => {
      const html = `
        <html>
          <body>
            <span class="price">49.99</span>
          </body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractPricing(doc);
      
      expect(result.currency).toBe('USD');
    });

    test('should handle no pricing information', () => {
      const html = '<html><body></body></html>';
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractPricing(doc);
      
      expect(result.prices).toEqual([]);
      expect(result.currency).toBeNull();
      expect(result.hasDiscount).toBe(false);
    });
  });

  describe('extractMetaTags', () => {
    test('should extract standard meta tags', () => {
      const html = `
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description" />
            <meta name="keywords" content="test, keywords" />
            <meta name="author" content="Test Author" />
          </head>
          <body></body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractMetaTags(doc);
      
      expect(result.description).toBe('Test description');
      expect(result.keywords).toBe('test, keywords');
      expect(result.author).toBe('Test Author');
    });

    test('should extract Open Graph tags', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="OG Title" />
            <meta property="og:description" content="OG Description" />
            <meta property="og:image" content="https://example.com/image.jpg" />
            <meta property="og:type" content="product" />
          </head>
          <body></body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractMetaTags(doc);
      
      expect(result.ogTitle).toBe('OG Title');
      expect(result.ogDescription).toBe('OG Description');
      expect(result.ogImage).toBe('https://example.com/image.jpg');
      expect(result.ogType).toBe('product');
    });

    test('should extract Twitter Card tags', () => {
      const html = `
        <html>
          <head>
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Twitter Title" />
            <meta name="twitter:description" content="Twitter Description" />
            <meta name="twitter:image" content="https://example.com/twitter.jpg" />
          </head>
          <body></body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractMetaTags(doc);
      
      expect(result.twitterCard).toBe('summary_large_image');
      expect(result.twitterTitle).toBe('Twitter Title');
      expect(result.twitterDescription).toBe('Twitter Description');
      expect(result.twitterImage).toBe('https://example.com/twitter.jpg');
    });

    test('should use document title if no OG title', () => {
      const html = `
        <html>
          <head>
            <title>Document Title</title>
          </head>
          <body></body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractMetaTags(doc);
      
      expect(result.title).toBe('Document Title');
    });

    test('should prefer OG title over document title', () => {
      const html = `
        <html>
          <head>
            <title>Document Title</title>
            <meta property="og:title" content="OG Title" />
          </head>
          <body></body>
        </html>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractMetaTags(doc);
      
      expect(result.title).toBe('OG Title');
    });

    test('should handle missing meta tags', () => {
      const html = '<html><head></head><body></body></html>';
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result = extractMetaTags(doc);
      
      expect(result.description).toBe('');
      expect(result.keywords).toBe('');
      expect(result.author).toBe('');
    });
  });
});
