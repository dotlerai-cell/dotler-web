/**
 * Agentic Workflow Service
 *
 * Implements the multi-agent workflow for Meta Ads campaign generation:
 * 1. Agent 1 - Prompt Builder (refines user input)
 * 2. Agent 3 - RAG-based Information Agent (extracts document context)
 * 3. Agent 2 - Ad Generator (generates campaign content)
 */

import { generateCampaign as geminiGenerateCampaign } from './geminiService.js';
import { searchSimilar } from './vectorDatabase.js';
import { scrapeUrl } from './webScraper.js';
import { generateEmbedding } from '../utils/embeddings.js';

/**
 * Agent 1 - Prompt Builder
 * Refines, structures, and contextualizes the user prompt
 */
export async function buildPrompt(userPrompt, additionalContext = {}) {
  const {
    websiteUrl = null,
    documentIds = [],
    userPreferences = {}
  } = additionalContext;

  // Validate and refine the user prompt
  const refinedPrompt = await refineUserPrompt(userPrompt);

  // Build the complete generation context
  const generationContext = {
    refinedPrompt,
    websiteUrl,
    documentIds,
    userPreferences
  };

  return generationContext;
}

/**
 * Refines the user prompt for better AI understanding
 */
async function refineUserPrompt(userPrompt) {
  // Basic validation and enhancement
  if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
    throw new Error('Valid user prompt is required');
  }

  // Clean and normalize the prompt
  const cleanedPrompt = userPrompt.trim();

  // Add context and structure if needed
  const structuredPrompt = `Generate a comprehensive Meta Ads campaign based on the following requirements:
${cleanedPrompt}

Please include:
- Campaign name and objective
- Target audience details
- Ad copy variations
- Visual/image generation ideas
- Budget recommendations
- Performance optimization strategies`;

  return structuredPrompt;
}

/**
 * Agent 3 - RAG-based Information Agent
 * Extracts relevant information from documents and websites
 */
export async function retrieveContext(generationContext) {
  const {
    refinedPrompt,
    websiteUrl = null,
    documentIds = []
  } = generationContext;

  const context = {
    documentContext: '',
    websiteContext: {},
    errors: []
  };

  // 1. Retrieve document context using RAG
  if (documentIds.length > 0) {
    try {
      const documentChunks = await retrieveDocumentContext(refinedPrompt, documentIds);
      context.documentContext = documentChunks.join('\n\n');
    } catch (error) {
      console.error('Document retrieval error:', error);
      context.errors.push(`Document retrieval failed: ${error.message}`);
    }
  }

  // 2. Scrape website content if URL provided
  if (websiteUrl) {
    try {
      const websiteData = await scrapeWebsiteContent(websiteUrl);
      context.websiteContext = websiteData;
    } catch (error) {
      console.error('Website scraping error:', error);
      context.errors.push(`Website scraping failed: ${error.message}`);
    }
  }

  return context;
}

/**
 * Retrieves relevant document chunks from vector database
 */
async function retrieveDocumentContext(queryText, documentIds) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(queryText);

    // Search for similar chunks (top 5 most relevant)
    const searchResults = await searchSimilar(queryEmbedding, 5);

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
    throw new Error(`Document context retrieval failed: ${error.message}`);
  }
}

/**
 * Scrapes website content for additional context
 */
async function scrapeWebsiteContent(url) {
  try {
    const scrapedData = await scrapeUrl(url);

    // Format the scraped data for the generation prompt
    return {
      productInfo: formatProductInfo(scrapedData.productInfo),
      pricing: formatPricing(scrapedData.pricing),
      description: scrapedData.metaTags?.description || scrapedData.metaTags?.ogDescription || '',
      metaTags: scrapedData.metaTags,
      branding: scrapedData.branding || {}
    };
  } catch (error) {
    console.error('Website scraping failed:', error);
    throw new Error(`Website scraping failed: ${error.message}`);
  }
}

/**
 * Formats product information for the generation prompt
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
 * Agent 2 - Ad Generator
 * Generates the complete campaign based on refined prompt and retrieved context
 */
export async function generateAdCampaign(generationContext, retrievedContext) {
  const {
    refinedPrompt,
    userPreferences = {}
  } = generationContext;

  const {
    documentContext = '',
    websiteContext = {},
    errors = []
  } = retrievedContext;

  // Build the complete generation prompt
  const generationPrompt = buildGenerationPrompt({
    refinedPrompt,
    documentContext,
    websiteContext,
    userPreferences,
    errors
  });

  try {
    // Generate campaign using Gemini AI
    const campaignData = await geminiGenerateCampaign({
      documentChunks: documentContext ? [documentContext] : [],
      websiteContent: websiteContext,
      additionalInfo: refinedPrompt,
      userPreferences
    });

    // Add metadata about the generation process
    campaignData.generationMetadata = {
      agentsUsed: ['PromptBuilder', 'RAGAgent', 'AdGenerator'],
      contextSources: {
        documents: documentContext ? 'Document context included' : 'No document context',
        website: websiteContext.productInfo ? 'Website context included' : 'No website context',
        errors: errors.length > 0 ? errors : 'No errors'
      },
      timestamp: new Date().toISOString()
    };

    return campaignData;

  } catch (error) {
    console.error('Campaign generation failed:', error);
    throw new Error(`Failed to generate campaign: ${error.message}`);
  }
}

/**
 * Builds the complete generation prompt for Agent 2
 */
function buildGenerationPrompt({ refinedPrompt, documentContext, websiteContext, userPreferences, errors }) {
  const tone = userPreferences.tone || 'professional';
  const targetAudience = userPreferences.targetAudience || 'general audience';
  const budgetRange = userPreferences.budgetRange || { min: 10, max: 100 };

  return `You are a Meta Ads Creative Director. Generate a comprehensive campaign based on the following information:

USER REQUIREMENTS:
${refinedPrompt}

COMPANY CONTEXT (from documents):
${documentContext || 'No document context provided.'}

WEBSITE INFORMATION:
${websiteContext.productInfo ? `Product: ${websiteContext.productInfo}` : ''}
${websiteContext.pricing ? `Pricing: ${websiteContext.pricing}` : ''}
${websiteContext.description ? `Description: ${websiteContext.description}` : ''}
${!websiteContext.productInfo && !websiteContext.pricing ? 'No website information provided.' : ''}

USER PREFERENCES:
- Tone: ${tone}
- Target Audience: ${targetAudience}
- Budget Range: $${budgetRange.min} - $${budgetRange.max} per day

GENERATION INSTRUCTIONS:
1. Create a campaign name that reflects the user's requirements
2. Select the most appropriate objective based on the requirements
3. Generate 3 ad copy variations with different angles
4. Provide 5 headline options (max 40 characters each)
5. Suggest visual/image generation ideas based on the context
6. Include target audience details and budget recommendations
7. Provide performance optimization strategies
8. Include any warnings or considerations from the context retrieval process

${errors.length > 0 ? `CONTEXT RETRIEVAL WARNINGS:
${errors.join('\n')}` : ''}`;
}

/**
 * Complete agentic workflow execution
 */
export async function executeAgenticWorkflow(userPrompt, additionalContext = {}) {
  try {
    // Step 1: Agent 1 - Prompt Builder
    const generationContext = await buildPrompt(userPrompt, additionalContext);

    // Step 2: Agent 3 - RAG-based Information Agent
    const retrievedContext = await retrieveContext(generationContext);

    // Step 3: Agent 2 - Ad Generator
    const campaignData = await generateAdCampaign(generationContext, retrievedContext);

    return {
      success: true,
      campaign: campaignData,
      metadata: campaignData.generationMetadata
    };

  } catch (error) {
    console.error('Agentic workflow failed:', error);
    return {
      success: false,
      error: error.message,
      metadata: {
        agentsUsed: ['PromptBuilder'],
        contextSources: {
          documents: 'Not retrieved',
          website: 'Not retrieved',
          errors: [error.message]
        },
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Export all functions
export default {
  buildPrompt,
  retrieveContext,
  generateAdCampaign,
  executeAgenticWorkflow
};
