/**
 * Campaign Generator Service
 *
 * Orchestrates the complete campaign generation flow by coordinating
 * document retrieval, website scraping, AI generation, and validation.
 * This service acts as the main entry point for campaign generation.
 */

import { generateCampaign as geminiGenerateCampaign, iterateCampaign as geminiIterateCampaign } from './geminiService.js';
import { searchSimilar } from './vectorDatabase.js';
import { scrapeUrl } from './webScraper.js';
import { validateCampaignForm } from './validationService.js';
import { generateEmbedding } from '../utils/embeddings.js';

/**
 * Generates a complete campaign from provided context
 * @param {Object} params - Generation parameters
 * @param {string} params.userId - The authenticated user ID
 * @param {string[]} [params.documentIds] - IDs of documents to use for context
 * @param {string} [params.websiteUrl] - Product website URL to scrape
 * @param {string} [params.additionalInfo] - Additional context from user
 * @param {Object} [params.userPreferences] - User preferences for generation
 * @param {Function} [params.onProgress] - Progress callback (step, message)
 * @returns {Promise<Object>} Generated campaign data
 * @throws {Error} If generation fails or parameters are invalid
 */
export async function generate(params) {
  const {
    userId,
    documentIds = [],
    websiteUrl = null,
    additionalInfo = '',
    userPreferences = {},
    onProgress = null,
  } = params;

  // Validate required parameters
  if (!userId || typeof userId !== 'string') {
    throw new Error('Valid userId is required for campaign generation');
  }

  try {
    // Step 1: Retrieve relevant document chunks from vector database
    if (onProgress) onProgress('retrieving', 'Retrieving relevant company information...');

    const documentChunks = await retrieveDocumentContext(userId, additionalInfo, documentIds);

    if (onProgress) onProgress('retrieved', `Retrieved ${documentChunks.length} relevant document chunks`);

    // Step 2: Scrape website content if URL provided
    let websiteContent = {};
    if (websiteUrl) {
      if (onProgress) onProgress('scraping', 'Extracting information from website...');

      try {
        const scrapedData = await scrapeUrl(websiteUrl);
        websiteContent = {
          productInfo: formatProductInfo(scrapedData.productInfo),
          pricing: formatPricing(scrapedData.pricing),
          description: scrapedData.metaTags?.description || scrapedData.metaTags?.ogDescription || '',
          metaTags: scrapedData.metaTags,
        };

        if (onProgress) onProgress('scraped', 'Website information extracted successfully');
      } catch (error) {
        console.warn('Website scraping failed:', error);
        if (onProgress) onProgress('scraping-failed', 'Website scraping failed, continuing with available context');
        // Continue without website content - not a fatal error
      }
    }

    // Step 3: Build generation context
    const generationContext = {
      documentChunks,
      websiteContent,
      additionalInfo,
      userPreferences,
    };

    // Step 4: Generate campaign using Gemini AI
    if (onProgress) onProgress('generating', 'Generating campaign with AI...');

    const campaignData = await geminiGenerateCampaign(generationContext);

    if (onProgress) onProgress('generated', 'Campaign generated successfully');

    // Step 5: Validate generated campaign
    if (onProgress) onProgress('validating', 'Validating campaign data...');

    const validationResult = validate(campaignData);

    if (!validationResult.valid) {
      console.warn('Generated campaign has validation issues:', validationResult.errors);
      // Attach validation warnings but don't fail
      campaignData._validationWarnings = validationResult.errors;
    }

    if (onProgress) onProgress('complete', 'Campaign generation complete');

    return campaignData;

  } catch (error) {
    console.error('Campaign generation failed:', error);
    throw new Error(`Failed to generate campaign: ${error.message}`);
  }
}

/**
 * Retrieves relevant document chunks from the vector database
 * @param {string} userId - The user ID
 * @param {string} queryText - Text to use for semantic search
 * @param {string[]} documentIds - Optional specific document IDs to search within
 * @returns {Promise<string[]>} Array of relevant text chunks
 */
async function retrieveDocumentContext(userId, queryText, documentIds = []) {
  // If no query text and no documents, return empty
  if (!queryText && documentIds.length === 0) {
    return [];
  }

  try {
    // Use query text or a default query for semantic search
    const searchQuery = queryText || 'company information products services';

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(searchQuery);

    // Search for similar chunks (top 10 most relevant)
    const searchResults = await searchSimilar(userId, queryEmbedding, 10);

    // Filter by specific document IDs if provided
    let filteredResults = searchResults;
    if (documentIds.length > 0) {
      filteredResults = searchResults.filter(result =>
        documentIds.includes(result.documentId)
      );
    }

    // Extract text chunks
    const chunks = filteredResults.map(result => result.text);

    return chunks;

  } catch (error) {
    console.error('Error retrieving document context:', error);
    // Return empty array rather than failing - generation can continue without docs
    return [];
  }
}

/**
 * Formats product information for the generation prompt
 * @param {Object} productInfo - Raw product info from scraper
 * @returns {string} Formatted product information
 */
function formatProductInfo(productInfo) {
  if (!productInfo) return '';

  const parts = [];

  if (productInfo.productNames && productInfo.productNames.length > 0) {
    parts.push(`Product Names: ${productInfo.productNames.join(', ')}`);
  }

  if (productInfo.descriptions && productInfo.descriptions.length > 0) {
    parts.push(`Descriptions: ${productInfo.descriptions.join(' | ')}`);
  }

  if (productInfo.features && productInfo.features.length > 0) {
    parts.push(`Features: ${productInfo.features.join('; ')}`);
  }

  if (productInfo.benefits && productInfo.benefits.length > 0) {
    parts.push(`Benefits: ${productInfo.benefits.join('; ')}`);
  }

  if (productInfo.categories && productInfo.categories.length > 0) {
    parts.push(`Categories: ${productInfo.categories.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Formats pricing information for the generation prompt
 * @param {Object} pricing - Raw pricing info from scraper
 * @returns {string} Formatted pricing information
 */
function formatPricing(pricing) {
  if (!pricing || !pricing.prices || pricing.prices.length === 0) {
    return '';
  }

  const parts = [];
  const currency = pricing.currency || 'USD';

  if (pricing.hasDiscount && pricing.originalPrice && pricing.salePrice) {
    parts.push(`Sale Price: ${currency} ${pricing.salePrice} (Original: ${currency} ${pricing.originalPrice})`);
  } else if (pricing.prices.length === 1) {
    parts.push(`Price: ${currency} ${pricing.prices[0]}`);
  } else if (pricing.prices.length > 1) {
    parts.push(`Price Range: ${currency} ${pricing.prices[0]} - ${currency} ${pricing.prices[pricing.prices.length - 1]}`);
  }

  return parts.join('\n');
}

/**
 * Validates a generated campaign against Meta Ads API constraints
 * @param {Object} campaignData - Campaign data to validate
 * @returns {Object} Validation result with valid flag and errors
 */
export function validate(campaignData) {
  if (!campaignData || typeof campaignData !== 'object') {
    return {
      valid: false,
      errors: {
        general: {
          error: 'Invalid campaign data provided',
        },
      },
    };
  }

  // Use the validation service to validate the complete form
  return validateCampaignForm(campaignData);
}

/**
 * Applies iteration changes to a campaign based on user feedback
 * @param {Object} currentCampaign - Current campaign data
 * @param {string} userMessage - User's iteration request
 * @param {Object} context - Additional context for iteration
 * @param {string} context.userId - User ID for document retrieval
 * @param {string} [context.additionalInfo] - Additional context
 * @returns {Promise<Object>} Iteration result with updated campaign and metadata
 * @throws {Error} If iteration fails
 */
export async function applyIterationChanges(currentCampaign, userMessage, context = {}) {
  const { userId, additionalInfo = '' } = context;

  // Validate inputs
  if (!currentCampaign || typeof currentCampaign !== 'object') {
    throw new Error('Valid current campaign data is required');
  }

  if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
    throw new Error('Valid user message is required for iteration');
  }

  try {
    // Optionally retrieve additional context if user message references documents
    let documentChunks = [];
    if (userId && (userMessage.toLowerCase().includes('document') ||
                   userMessage.toLowerCase().includes('information'))) {
      try {
        documentChunks = await retrieveDocumentContext(userId, userMessage, []);
      } catch (error) {
        console.warn('Failed to retrieve document context for iteration:', error);
        // Continue without document context
      }
    }

    // Build iteration context
    const iterationContext = {
      additionalInfo,
      documentChunks,
    };

    // Call Gemini to iterate on the campaign
    const iterationResult = await geminiIterateCampaign(
      currentCampaign,
      userMessage,
      iterationContext
    );

    // Apply changes to current campaign
    const updatedCampaign = applyChanges(currentCampaign, iterationResult.changes);

    // Validate the updated campaign
    const validationResult = validate(updatedCampaign);

    // Return complete iteration result
    return {
      campaign: updatedCampaign,
      message: iterationResult.message,
      affectedFields: iterationResult.affectedFields,
      explanation: iterationResult.explanation,
      validationResult,
    };

  } catch (error) {
    console.error('Campaign iteration failed:', error);
    throw new Error(`Failed to iterate campaign: ${error.message}`);
  }
}

/**
 * Applies changes to a campaign object
 * @param {Object} current - Current campaign data
 * @param {Object} changes - Changes to apply (partial campaign data)
 * @returns {Object} Updated campaign data
 */
function applyChanges(current, changes) {
  // Deep merge changes into current campaign
  const updated = { ...current };

  for (const [key, value] of Object.entries(changes)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Deep merge for nested objects
      updated[key] = {
        ...(updated[key] || {}),
        ...value,
      };
    } else {
      // Direct assignment for primitives and arrays
      updated[key] = value;
    }
  }

  // Update lastModified timestamp
  updated.lastModified = new Date();

  return updated;
}

/**
 * Legacy template functions for backward compatibility
 * These functions provide the old template-based campaign generation
 * that was used before the agentic workflow
 */

export function generateCampaignData() {
  const objectives = [
    'OUTCOME_SALES',
    'OUTCOME_LEADS',
    'OUTCOME_AWARENESS',
    'OUTCOME_TRAFFIC',
    'OUTCOME_ENGAGEMENT',
    'OUTCOME_APP_PROMOTION'
  ];

  const campaignTemplates = [
    {
      name: 'Summer Sale 2025 - E-commerce',
      objective: 'OUTCOME_SALES',
      dailyBudget: 150.00,
      description: 'Drive online sales during summer promotion',
      targetAudience: 'Online shoppers interested in fashion',
      adCopy: '🌞 Summer Sale! Up to 50% off on all items. Limited time offer!',
      targetUrl: 'https://example.com/summer-sale',
      creativeType: 'carousel',
      enableCreativeRefresh: true,
      enableInventorySync: true,
      enableArbitrage: true,
      enableWeatherBidding: false
    },
    {
      name: 'Lead Generation - Webinar Signup',
      objective: 'OUTCOME_LEADS',
      dailyBudget: 100.00,
      description: 'Generate leads for upcoming webinar',
      targetAudience: 'Professionals interested in marketing',
      adCopy: '🚀 Master Facebook Ads in 2025! Free Webinar Registration',
      targetUrl: 'https://example.com/webinar-signup',
      creativeType: 'single_image',
      enableCreativeRefresh: false,
      enableInventorySync: false,
      enableArbitrage: false,
      enableWeatherBidding: false
    },
    {
      name: 'Brand Awareness - Product Launch',
      objective: 'OUTCOME_AWARENESS',
      dailyBudget: 200.00,
      description: 'Build brand awareness for new product launch',
      targetAudience: 'Tech enthusiasts',
      adCopy: '📱 Introducing the future of mobile technology. Coming soon!',
      targetUrl: 'https://example.com/product-launch',
      creativeType: 'video',
      enableCreativeRefresh: true,
      enableInventorySync: false,
      enableArbitrage: false,
      enableWeatherBidding: false
    },
    {
      name: 'Traffic Boost - Blog Content',
      objective: 'OUTCOME_TRAFFIC',
      dailyBudget: 75.00,
      description: 'Drive traffic to educational blog content',
      targetAudience: 'Content consumers',
      adCopy: '📚 Learn the secrets of successful content marketing',
      targetUrl: 'https://example.com/blog/content-marketing-guide',
      creativeType: 'single_image',
      enableCreativeRefresh: false,
      enableInventorySync: false,
      enableArbitrage: true,
      enableWeatherBidding: false
    }
  ];

  const campaigns = [];
  for (let i = 0; i < campaignTemplates.length; i++) {
    const template = campaignTemplates[i];
    const campaign = { ...template };
    campaign.id = `campaign_${i + 1}`;
    campaign.status = 'PAUSED';

    // Add some randomization for variety
    campaign.dailyBudget += (Math.random() - 0.4) * 70; // -20 to +50 range
    campaign.dailyBudget = Math.max(10, Math.round(campaign.dailyBudget * 100) / 100);

    // Generate date range (next 30 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    campaign.startDate = startDate.toISOString().split('T')[0];
    campaign.endDate = endDate.toISOString().split('T')[0];

    campaigns.push(campaign);
  }

  return {
    generatedAt: new Date().toISOString(),
    totalCampaigns: campaigns.length,
    campaigns: campaigns,
    meta: {
      apiVersion: 'v19.0',
      defaultCurrency: 'USD',
      supportedObjectives: objectives
    }
  };
}

export function loadCampaignTemplate(templateId) {
  const allTemplates = generateCampaignData();
  return allTemplates.campaigns.find(campaign => campaign.id === templateId);
}

export function getCampaignTemplates() {
  return generateCampaignData().campaigns;
}

export default {
  generate,
  validate,
  applyIterationChanges,
  generateCampaignData,
  getCampaignTemplates,
  loadCampaignTemplate
};
