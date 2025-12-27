/**
 * Web Scraper Service
 * 
 * Handles website content extraction for the AI Campaign Generator system.
 * Extracts product information, pricing, meta tags, and other relevant content
 * from product websites to inform campaign generation.
 */

import { scrapingConfig, errorMessages } from '../config/aiConfig.js';
import DOMPurify from 'dompurify';

/**
 * Scrapes content from a given URL
 * @param {string} url - The URL to scrape
 * @returns {Promise<Object>} Scraped content including text, meta tags, and structured data
 * @throws {Error} If URL is invalid or scraping fails
 */
export async function scrapeUrl(url) {
  // Validate URL
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided');
  }

  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  // Validate URL format
  try {
    new URL(normalizedUrl);
  } catch (error) {
    throw new Error('Invalid URL format');
  }

  // Fetch with timeout and retries
  let lastError;
  for (let attempt = 0; attempt <= scrapingConfig.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), scrapingConfig.timeout);

      const response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': scrapingConfig.userAgent,
        },
        mode: 'cors',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Parse HTML using DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract all relevant information
      const metaTags = extractMetaTags(doc);
      const productInfo = extractProductInfo(doc);
      const pricing = extractPricing(doc);

      return {
        url: normalizedUrl,
        title: doc.title || metaTags.title || '',
        metaTags,
        productInfo,
        pricing,
        scrapedAt: new Date().toISOString(),
      };

    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        // CORS error - this is expected for many websites
        if (attempt === scrapingConfig.maxRetries) {
          throw new Error(
            'Unable to access website due to CORS restrictions. ' +
            'Please enter product information manually.'
          );
        }
      } else if (error.name === 'AbortError') {
        // Timeout
        if (attempt === scrapingConfig.maxRetries) {
          throw new Error('Website took too long to respond. Please try again or enter information manually.');
        }
      } else {
        // Other errors
        if (attempt === scrapingConfig.maxRetries) {
          throw new Error(errorMessages.scrapingFailed);
        }
      }

      // Wait before retry (exponential backoff)
      if (attempt < scrapingConfig.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error(errorMessages.scrapingFailed);
}

/**
 * Extracts product information from HTML document
 * @param {Document} doc - Parsed HTML document
 * @returns {Object} Product information including descriptions and features
 */
export function extractProductInfo(doc) {
  const productInfo = {
    descriptions: [],
    features: [],
    benefits: [],
    categories: [],
  };

  // Extract from meta tags (Open Graph, Twitter Cards)
  const ogDescription = doc.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    productInfo.descriptions.push(sanitizeText(ogDescription.content));
  }

  const twitterDescription = doc.querySelector('meta[name="twitter:description"]');
  if (twitterDescription && twitterDescription.content !== ogDescription?.content) {
    productInfo.descriptions.push(sanitizeText(twitterDescription.content));
  }

  const metaDescription = doc.querySelector('meta[name="description"]');
  if (metaDescription && 
      metaDescription.content !== ogDescription?.content &&
      metaDescription.content !== twitterDescription?.content) {
    productInfo.descriptions.push(sanitizeText(metaDescription.content));
  }

  // Extract from structured data (JSON-LD)
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  jsonLdScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      if (data['@type'] === 'Product' || data['@type'] === 'ItemList') {
        if (data.description) {
          productInfo.descriptions.push(sanitizeText(data.description));
        }
        if (data.category) {
          productInfo.categories.push(sanitizeText(data.category));
        }
      }
    } catch (error) {
      // Ignore invalid JSON-LD
    }
  });

  // Extract from common product description selectors
  const descriptionSelectors = [
    '.product-description',
    '.product-details',
    '#product-description',
    '[itemprop="description"]',
    '.description',
    '.product-info',
  ];

  descriptionSelectors.forEach(selector => {
    const elements = doc.querySelectorAll(selector);
    elements.forEach(el => {
      const text = sanitizeText(el.textContent);
      if (text.length > 50 && text.length < 1000) {
        productInfo.descriptions.push(text);
      }
    });
  });

  // Extract features from lists
  const featureSelectors = [
    '.product-features li',
    '.features li',
    '[class*="feature"] li',
    '.benefits li',
  ];

  featureSelectors.forEach(selector => {
    const elements = doc.querySelectorAll(selector);
    elements.forEach(el => {
      const text = sanitizeText(el.textContent);
      if (text.length > 10 && text.length < 200) {
        if (selector.includes('benefit')) {
          productInfo.benefits.push(text);
        } else {
          productInfo.features.push(text);
        }
      }
    });
  });

  // Extract from headings (h1, h2, h3) for product names and key features
  const headings = doc.querySelectorAll('h1, h2, h3');
  const productNames = [];
  headings.forEach(heading => {
    const text = sanitizeText(heading.textContent);
    if (text.length > 5 && text.length < 100) {
      productNames.push(text);
    }
  });

  // Deduplicate and limit results
  productInfo.descriptions = [...new Set(productInfo.descriptions)].slice(0, 5);
  productInfo.features = [...new Set(productInfo.features)].slice(0, 10);
  productInfo.benefits = [...new Set(productInfo.benefits)].slice(0, 10);
  productInfo.categories = [...new Set(productInfo.categories)].slice(0, 5);
  productInfo.productNames = [...new Set(productNames)].slice(0, 3);

  return productInfo;
}

/**
 * Extracts pricing information from HTML document
 * @param {Document} doc - Parsed HTML document
 * @returns {Object} Pricing information including prices, currency, and discounts
 */
export function extractPricing(doc) {
  const pricing = {
    prices: [],
    currency: null,
    hasDiscount: false,
    originalPrice: null,
    salePrice: null,
  };

  // Extract from structured data (JSON-LD)
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  jsonLdScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      if (data['@type'] === 'Product' && data.offers) {
        const offers = Array.isArray(data.offers) ? data.offers : [data.offers];
        offers.forEach(offer => {
          if (offer.price) {
            pricing.prices.push(parseFloat(offer.price));
            if (offer.priceCurrency) {
              pricing.currency = offer.priceCurrency;
            }
          }
        });
      }
    } catch (error) {
      // Ignore invalid JSON-LD
    }
  });

  // Extract from meta tags
  const ogPrice = doc.querySelector('meta[property="product:price:amount"]');
  if (ogPrice) {
    pricing.prices.push(parseFloat(ogPrice.content));
  }

  const ogCurrency = doc.querySelector('meta[property="product:price:currency"]');
  if (ogCurrency) {
    pricing.currency = ogCurrency.content;
  }

  // Extract from common price selectors
  const priceSelectors = [
    '.price',
    '.product-price',
    '[itemprop="price"]',
    '[class*="price"]',
    '.cost',
    '.amount',
  ];

  priceSelectors.forEach(selector => {
    const elements = doc.querySelectorAll(selector);
    elements.forEach(el => {
      const text = el.textContent;
      const priceMatch = extractPriceFromText(text);
      if (priceMatch) {
        pricing.prices.push(priceMatch.amount);
        if (priceMatch.currency && !pricing.currency) {
          pricing.currency = priceMatch.currency;
        }
      } else {
        // Try to extract plain numbers as prices
        const plainNumberMatch = /(\d+(?:\.\d{2})?)/.exec(text);
        if (plainNumberMatch) {
          const amount = parseFloat(plainNumberMatch[1]);
          if (!isNaN(amount) && amount > 0) {
            pricing.prices.push(amount);
          }
        }
      }
    });
  });

  // Detect discounts
  const discountSelectors = [
    '.sale-price',
    '.discount-price',
    '.original-price',
    '.regular-price',
    '[class*="sale"]',
    '[class*="discount"]',
  ];

  const discountElements = doc.querySelectorAll(discountSelectors.join(','));
  if (discountElements.length > 0) {
    pricing.hasDiscount = true;

    // Try to identify original vs sale price
    const originalPriceEl = doc.querySelector('.original-price, .regular-price, [class*="original"]');
    const salePriceEl = doc.querySelector('.sale-price, .discount-price, [class*="sale"]');

    if (originalPriceEl) {
      const priceMatch = extractPriceFromText(originalPriceEl.textContent);
      if (priceMatch) {
        pricing.originalPrice = priceMatch.amount;
      }
    }

    if (salePriceEl) {
      const priceMatch = extractPriceFromText(salePriceEl.textContent);
      if (priceMatch) {
        pricing.salePrice = priceMatch.amount;
      }
    }
  }

  // Deduplicate prices and sort
  pricing.prices = [...new Set(pricing.prices)].sort((a, b) => a - b);

  // If we have multiple prices and no explicit sale/original, assume lowest is sale
  if (pricing.prices.length > 1 && !pricing.salePrice && !pricing.originalPrice) {
    pricing.salePrice = pricing.prices[0];
    pricing.originalPrice = pricing.prices[pricing.prices.length - 1];
    pricing.hasDiscount = true;
  }

  // Default currency if not found
  if (!pricing.currency && pricing.prices.length > 0) {
    pricing.currency = 'USD';
  }

  return pricing;
}

/**
 * Extracts meta tags from HTML document
 * @param {Document} doc - Parsed HTML document
 * @returns {Object} Meta tag information
 */
export function extractMetaTags(doc) {
  const metaTags = {
    title: '',
    description: '',
    keywords: '',
    author: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogType: '',
    twitterCard: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
  };

  // Standard meta tags
  const description = doc.querySelector('meta[name="description"]');
  if (description) metaTags.description = sanitizeText(description.content);

  const keywords = doc.querySelector('meta[name="keywords"]');
  if (keywords) metaTags.keywords = sanitizeText(keywords.content);

  const author = doc.querySelector('meta[name="author"]');
  if (author) metaTags.author = sanitizeText(author.content);

  // Open Graph tags
  const ogTitle = doc.querySelector('meta[property="og:title"]');
  if (ogTitle) metaTags.ogTitle = sanitizeText(ogTitle.content);

  const ogDescription = doc.querySelector('meta[property="og:description"]');
  if (ogDescription) metaTags.ogDescription = sanitizeText(ogDescription.content);

  const ogImage = doc.querySelector('meta[property="og:image"]');
  if (ogImage) metaTags.ogImage = ogImage.content;

  const ogType = doc.querySelector('meta[property="og:type"]');
  if (ogType) metaTags.ogType = ogType.content;

  // Twitter Card tags
  const twitterCard = doc.querySelector('meta[name="twitter:card"]');
  if (twitterCard) metaTags.twitterCard = twitterCard.content;

  const twitterTitle = doc.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) metaTags.twitterTitle = sanitizeText(twitterTitle.content);

  const twitterDescription = doc.querySelector('meta[name="twitter:description"]');
  if (twitterDescription) metaTags.twitterDescription = sanitizeText(twitterDescription.content);

  const twitterImage = doc.querySelector('meta[name="twitter:image"]');
  if (twitterImage) metaTags.twitterImage = twitterImage.content;

  // Use document title if no OG title
  metaTags.title = metaTags.ogTitle || doc.title || '';

  return metaTags;
}

/**
 * Extracts price information from text
 * @param {string} text - Text containing price
 * @returns {Object|null} Price object with amount and currency, or null if no price found
 */
function extractPriceFromText(text) {
  if (!text) return null;

  // Common currency symbols and codes
  const currencyPatterns = [
    { regex: /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, currency: 'USD' },
    { regex: /€\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, currency: 'EUR' },
    { regex: /£\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, currency: 'GBP' },
    { regex: /¥\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, currency: 'JPY' },
    { regex: /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*USD/gi, currency: 'USD' },
    { regex: /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*EUR/gi, currency: 'EUR' },
    { regex: /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*GBP/gi, currency: 'GBP' },
  ];

  for (const pattern of currencyPatterns) {
    const match = pattern.regex.exec(text);
    if (match) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        return {
          amount,
          currency: pattern.currency,
        };
      }
    }
  }

  return null;
}

/**
 * Sanitizes text by removing extra whitespace and HTML entities
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
  if (!text) return '';

  // Use DOMPurify to remove any HTML tags
  let cleaned = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });

  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = cleaned;
  cleaned = textarea.value;

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export default {
  scrapeUrl,
  extractProductInfo,
  extractPricing,
  extractMetaTags,
};
