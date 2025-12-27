/**
 * Gemini AI Service
 * 
 * Provides AI-powered campaign generation, iteration, audience suggestions,
 * and ad copy variations using Google's Gemini API.
 */

import { geminiConfig, campaignConfig, errorMessages } from '../config/aiConfig.js';

/**
 * Calls the Gemini API with retry logic
 * @param {string} prompt - The prompt to send to Gemini
 * @param {Object} options - Additional options
 * @returns {Promise<string>} The response text from Gemini
 */
async function callGeminiAPI(prompt, options = {}) {
  const { temperature = 0.7, maxRetries = geminiConfig.maxRetries } = options;

  if (!geminiConfig.apiKey || geminiConfig.apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured. Please add your API key to the .env file.');
  }

  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), geminiConfig.timeout);

      const response = await fetch(
        `${geminiConfig.baseUrl}/models/${geminiConfig.model}:generateContent?key=${geminiConfig.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`
        );
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No valid response from Gemini API');
      }

      return content;
    } catch (error) {
      lastError = error;
      
      // Don't retry on abort or invalid API key
      if (error.name === 'AbortError' || error.message.includes('API key')) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error(errorMessages.geminiApiError);
}

/**
 * Extracts JSON from Gemini response (handles markdown code blocks)
 * @param {string} text - The response text
 * @returns {Object} Parsed JSON object
 */
function extractJSON(text) {
  // Try to find JSON in markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // Try to find raw JSON
  const rawJsonMatch = text.match(/\{[\s\S]*\}/);
  if (rawJsonMatch) {
    return JSON.parse(rawJsonMatch[0]);
  }

  throw new Error('No valid JSON found in response');
}

/**
 * Generates a complete campaign based on provided context
 * @param {Object} context - Generation context
 * @param {string[]} context.documentIds - IDs of uploaded documents
 * @param {string} [context.websiteUrl] - Product website URL
 * @param {string} [context.additionalInfo] - Additional context from user
 * @param {Object} [context.userPreferences] - User preferences
 * @param {string[]} [context.documentChunks] - Retrieved document text chunks
 * @param {Object} [context.websiteContent] - Scraped website content
 * @returns {Promise<Object>} Campaign data
 */
export async function generateCampaign(context) {
  const {
    documentChunks = [],
    websiteContent = {},
    additionalInfo = '',
    userPreferences = {}
  } = context;

  // Build the prompt
  const prompt = buildCampaignGenerationPrompt({
    documentChunks,
    websiteContent,
    additionalInfo,
    userPreferences
  });

  try {
    const response = await callGeminiAPI(prompt, { temperature: 0.8 });
    const campaignData = extractJSON(response);
    
    // Validate and normalize the response
    return validateAndNormalizeCampaign(campaignData);
  } catch (error) {
    console.error('Error generating campaign:', error);
    throw new Error(`Failed to generate campaign: ${error.message}`);
  }
}

/**
 * Builds the campaign generation prompt
 * @param {Object} params - Prompt parameters
 * @returns {string} The formatted prompt
 */
function buildCampaignGenerationPrompt({ documentChunks, websiteContent, additionalInfo, userPreferences }) {
  const tone = userPreferences.tone || 'professional';
  const targetAudience = userPreferences.targetAudience || 'general audience';
  const budgetRange = userPreferences.budgetRange || { min: 10, max: 100 };

  return `You are a Meta Ads expert. Generate a comprehensive campaign based on this information:

COMPANY CONTEXT:
${documentChunks.length > 0 ? documentChunks.join('\n\n') : 'No document context provided.'}

WEBSITE INFORMATION:
${websiteContent.productInfo ? `Product: ${websiteContent.productInfo}` : ''}
${websiteContent.pricing ? `Pricing: ${websiteContent.pricing}` : ''}
${websiteContent.description ? `Description: ${websiteContent.description}` : ''}
${websiteContent.metaTags ? `Meta Info: ${JSON.stringify(websiteContent.metaTags)}` : ''}
${!websiteContent.productInfo && !websiteContent.pricing ? 'No website information provided.' : ''}

ADDITIONAL CONTEXT:
${additionalInfo || 'No additional context provided.'}

USER PREFERENCES:
- Tone: ${tone}
- Target Audience: ${targetAudience}
- Budget Range: $${budgetRange.min} - $${budgetRange.max} per day

Generate a complete Meta Ads campaign with:
1. Campaign name (clear, descriptive, max 100 characters)
2. Objective (one of: OUTCOME_SALES, OUTCOME_LEADS, OUTCOME_AWARENESS, OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_APP_PROMOTION)
3. Budget recommendations (daily budget within the specified range)
4. Target audience (demographics, interests, behaviors)
5. Ad copy (3 variations with different angles)
6. Headline options (5 variations, max 40 characters each)
7. Call-to-action recommendation (one of: SHOP_NOW, LEARN_MORE, SIGN_UP, DOWNLOAD, BOOK_NOW, CONTACT_US, GET_QUOTE, APPLY_NOW)
8. Placement suggestions
9. Optimization strategy
10. Expected performance metrics

Format your response as JSON matching this exact schema:
{
  "name": "Campaign Name",
  "objective": "OUTCOME_SALES",
  "status": "ACTIVE",
  "dailyBudget": 50,
  "totalBudget": 1500,
  "startDate": null,
  "endDate": null,
  "bidStrategy": "LOWEST_COST",
  "targeting": {
    "ageMin": 18,
    "ageMax": 65,
    "genders": ["all"],
    "locations": [{"name": "United States", "type": "country"}],
    "interests": ["Interest 1", "Interest 2"],
    "behaviors": ["Behavior 1"],
    "customAudiences": [],
    "lookalikesAudiences": []
  },
  "adCopy": "Primary ad copy text here",
  "headlines": ["Headline 1", "Headline 2", "Headline 3", "Headline 4", "Headline 5"],
  "descriptions": ["Description 1", "Description 2", "Description 3"],
  "callToAction": "SHOP_NOW",
  "targetUrl": "",
  "images": [],
  "videos": [],
  "placements": {
    "automatic": true,
    "facebook": {"feed": true, "stories": true, "reels": true},
    "instagram": {"feed": true, "stories": true, "reels": true},
    "audience_network": true,
    "messenger": false
  },
  "optimizationGoal": "CONVERSIONS",
  "conversionEvent": "PURCHASE",
  "attributionWindow": "7_DAY_CLICK_1_DAY_VIEW",
  "enableCreativeRefresh": false,
  "enableInventorySync": false,
  "enableArbitrage": false,
  "enableWeatherBidding": false,
  "generatedBy": "ai",
  "adCopyVariations": ["Variation 1", "Variation 2", "Variation 3"]
}

Respond ONLY with the JSON object, no additional text.`;
}

/**
 * Validates and normalizes campaign data from Gemini
 * @param {Object} data - Raw campaign data
 * @returns {Object} Validated campaign data
 */
function validateAndNormalizeCampaign(data) {
  // Ensure required fields exist with defaults
  const normalized = {
    name: data.name || 'Untitled Campaign',
    objective: data.objective || 'OUTCOME_SALES',
    status: data.status || 'ACTIVE',
    dailyBudget: Math.max(1, Number(data.dailyBudget) || 10),
    totalBudget: data.totalBudget ? Number(data.totalBudget) : undefined,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    bidStrategy: data.bidStrategy || 'LOWEST_COST',
    targeting: {
      ageMin: Math.max(13, Number(data.targeting?.ageMin) || 18),
      ageMax: Math.min(65, Number(data.targeting?.ageMax) || 65),
      genders: Array.isArray(data.targeting?.genders) ? data.targeting.genders : ['all'],
      locations: Array.isArray(data.targeting?.locations) ? data.targeting.locations : [],
      interests: Array.isArray(data.targeting?.interests) ? data.targeting.interests : [],
      behaviors: Array.isArray(data.targeting?.behaviors) ? data.targeting.behaviors : [],
      customAudiences: Array.isArray(data.targeting?.customAudiences) ? data.targeting.customAudiences : [],
      lookalikesAudiences: Array.isArray(data.targeting?.lookalikesAudiences) ? data.targeting.lookalikesAudiences : []
    },
    adCopy: data.adCopy || '',
    headlines: Array.isArray(data.headlines) ? data.headlines.slice(0, 15) : [],
    descriptions: Array.isArray(data.descriptions) ? data.descriptions.slice(0, 5) : [],
    callToAction: data.callToAction || 'LEARN_MORE',
    targetUrl: data.targetUrl || '',
    images: Array.isArray(data.images) ? data.images : [],
    videos: Array.isArray(data.videos) ? data.videos : [],
    placements: data.placements || {
      automatic: true,
      facebook: { feed: true, stories: true, reels: true },
      instagram: { feed: true, stories: true, reels: true },
      audience_network: true,
      messenger: false
    },
    optimizationGoal: data.optimizationGoal || 'CONVERSIONS',
    conversionEvent: data.conversionEvent || 'PURCHASE',
    attributionWindow: data.attributionWindow || '7_DAY_CLICK_1_DAY_VIEW',
    enableCreativeRefresh: Boolean(data.enableCreativeRefresh),
    enableInventorySync: Boolean(data.enableInventorySync),
    enableArbitrage: Boolean(data.enableArbitrage),
    enableWeatherBidding: Boolean(data.enableWeatherBidding),
    generatedBy: 'ai',
    lastModified: new Date(),
    manuallyEditedFields: [],
    adCopyVariations: Array.isArray(data.adCopyVariations) ? data.adCopyVariations : []
  };

  return normalized;
}

/**
 * Iterates on an existing campaign based on user feedback
 * @param {Object} currentCampaign - Current campaign data
 * @param {string} userMessage - User's iteration request
 * @param {Object} context - Generation context (for additional context if needed)
 * @returns {Promise<Object>} Iteration result with changes
 */
export async function iterateCampaign(currentCampaign, userMessage, context = {}) {
  const prompt = buildIterationPrompt(currentCampaign, userMessage, context);

  try {
    const response = await callGeminiAPI(prompt, { temperature: 0.7 });
    const result = extractJSON(response);
    
    return {
      message: result.message || result.explanation || 'Campaign updated based on your request.',
      changes: result.changes || {},
      affectedFields: result.affectedFields || Object.keys(result.changes || {}),
      explanation: result.explanation || result.message || 'Changes applied to campaign.'
    };
  } catch (error) {
    console.error('Error iterating campaign:', error);
    throw new Error(`Failed to iterate campaign: ${error.message}`);
  }
}

/**
 * Builds the iteration prompt
 * @param {Object} currentCampaign - Current campaign data
 * @param {string} userMessage - User's request
 * @param {Object} context - Additional context
 * @returns {string} The formatted prompt
 */
function buildIterationPrompt(currentCampaign, userMessage, context) {
  return `You are a Meta Ads expert helping refine a campaign. The user has requested changes to their campaign.

CURRENT CAMPAIGN:
${JSON.stringify(currentCampaign, null, 2)}

USER REQUEST:
${userMessage}

ADDITIONAL CONTEXT:
${context.additionalInfo || 'No additional context.'}

Analyze the user's request and provide:
1. A friendly message explaining what you're changing
2. The specific field changes needed (only include fields that should change)
3. A list of affected field names
4. A brief explanation of why these changes address the user's request

IMPORTANT: Only modify fields that the user explicitly or implicitly requested to change. Preserve all other fields.

Format your response as JSON:
{
  "message": "I'll update the targeting to focus on younger audiences as you requested.",
  "changes": {
    "targeting": {
      "ageMin": 18,
      "ageMax": 35
    }
  },
  "affectedFields": ["targeting.ageMin", "targeting.ageMax"],
  "explanation": "Adjusted the age range to 18-35 to target younger demographics."
}

Respond ONLY with the JSON object, no additional text.`;
}

/**
 * Generates audience targeting suggestions
 * @param {Object} campaignData - Current campaign data
 * @param {Object} context - Generation context
 * @returns {Promise<Array>} Array of audience suggestions
 */
export async function generateAudienceSuggestions(campaignData, context = {}) {
  const prompt = buildAudienceSuggestionsPrompt(campaignData, context);

  try {
    const response = await callGeminiAPI(prompt, { temperature: 0.8 });
    const result = extractJSON(response);
    
    // Ensure we have an audiences array
    const audiences = result.audiences || result.suggestions || [];
    
    // Validate and normalize each audience
    return audiences.map((audience, index) => ({
      name: audience.name || `Audience ${index + 1}`,
      description: audience.description || '',
      interests: Array.isArray(audience.interests) ? audience.interests : [],
      demographics: audience.demographics || '',
      behaviors: Array.isArray(audience.behaviors) ? audience.behaviors : [],
      rationale: audience.rationale || audience.reason || '',
      ranking: audience.ranking || index + 1,
      customAudiences: Array.isArray(audience.customAudiences) ? audience.customAudiences : []
    }));
  } catch (error) {
    console.error('Error generating audience suggestions:', error);
    // Return fallback suggestions
    return getFallbackAudienceSuggestions(campaignData);
  }
}

/**
 * Builds the audience suggestions prompt
 * @param {Object} campaignData - Campaign data
 * @param {Object} context - Additional context
 * @returns {string} The formatted prompt
 */
function buildAudienceSuggestionsPrompt(campaignData, context) {
  return `You are a Meta Ads expert specializing in audience targeting. Generate highly targeted audience segments for this campaign.

CAMPAIGN INFORMATION:
Name: ${campaignData.name || 'Not specified'}
Objective: ${campaignData.objective || 'Not specified'}
Ad Copy: ${campaignData.adCopy || 'Not specified'}
Target URL: ${campaignData.targetUrl || 'Not specified'}
Current Targeting: ${JSON.stringify(campaignData.targeting || {}, null, 2)}

ADDITIONAL CONTEXT:
${context.additionalInfo || 'No additional context.'}
${context.documentChunks ? `Company Info: ${context.documentChunks.join(' ')}` : ''}

Generate 3-5 highly targeted audience segments. For each segment provide:
1. Audience name (clear, descriptive)
2. Detailed description of who this audience is
3. Key interests (5-10 specific interests)
4. Demographic information (age range, gender, locations)
5. Behavioral characteristics (3-5 behaviors)
6. Rationale for why this audience would be effective
7. Ranking (1 = most relevant)
8. Custom audience recommendations (if applicable)

Format your response as JSON:
{
  "audiences": [
    {
      "name": "Tech-Savvy Early Adopters",
      "description": "Young professionals interested in technology and innovation",
      "interests": ["Technology", "Gadgets", "Innovation", "Startups", "Tech News"],
      "demographics": "Ages 25-40, All genders, Urban areas in US, UK, Canada",
      "behaviors": ["Early adopters", "Online shoppers", "Tech enthusiasts"],
      "rationale": "This audience is most likely to engage with tech products and has high purchasing power",
      "ranking": 1,
      "customAudiences": ["Website visitors (last 30 days)", "Email subscribers"]
    }
  ]
}

Respond ONLY with the JSON object, no additional text.`;
}

/**
 * Provides fallback audience suggestions when API fails
 * @param {Object} campaignData - Campaign data
 * @returns {Array} Fallback audience suggestions
 */
function getFallbackAudienceSuggestions(campaignData) {
  const objective = campaignData.objective || 'OUTCOME_SALES';
  
  const audiencesByObjective = {
    'OUTCOME_SALES': [
      {
        name: 'Online Shoppers - Broad Interest',
        description: 'People who frequently purchase online and engage with e-commerce content',
        interests: ['Online shopping', 'E-commerce', 'Deals and discounts', 'Product reviews'],
        demographics: 'Ages 18-65, All genders, Worldwide',
        behaviors: ['Online shoppers', 'Engaged shoppers'],
        rationale: 'Broad audience that covers most potential online buyers',
        ranking: 1,
        customAudiences: []
      },
      {
        name: 'Price-Conscious Buyers',
        description: 'Consumers who actively look for sales, discounts, and promotional offers',
        interests: ['Coupons', 'Flash sales', 'Discount codes', 'Clearance sales'],
        demographics: 'Ages 25-55, All genders, Worldwide',
        behaviors: ['Bargain hunters', 'Deal seekers'],
        rationale: 'Likely to respond well to promotional campaigns and limited-time offers',
        ranking: 2,
        customAudiences: []
      },
      {
        name: 'Loyal Customers & Past Purchasers',
        description: 'Existing customers and people who have engaged with similar brands',
        interests: ['Brand loyalty', 'Customer reviews', 'Repeat purchases'],
        demographics: 'Ages 25-65, All genders, Worldwide',
        behaviors: ['Repeat purchasers', 'Brand loyal'],
        rationale: 'Higher conversion rates from people already familiar with similar products',
        ranking: 3,
        customAudiences: ['Website visitors', 'Past purchasers']
      }
    ],
    'OUTCOME_LEADS': [
      {
        name: 'Professional Decision Makers',
        description: 'Business professionals who make purchasing decisions for their companies',
        interests: ['Business software', 'Productivity tools', 'Professional development', 'B2B services'],
        demographics: 'Ages 25-65, All genders, Worldwide',
        behaviors: ['Business decision makers', 'Small business owners'],
        rationale: 'Targeting professionals who can benefit from the offered service',
        ranking: 1,
        customAudiences: []
      },
      {
        name: 'Industry-Specific Professionals',
        description: 'People working in industries relevant to the lead magnet content',
        interests: ['Industry news', 'Professional networking', 'Business webinars', 'Trade publications'],
        demographics: 'Ages 25-65, All genders, Worldwide',
        behaviors: ['Industry professionals', 'Conference attendees'],
        rationale: 'Industry professionals are more likely to be interested in relevant content',
        ranking: 2,
        customAudiences: []
      },
      {
        name: 'Content Consumers & Learners',
        description: 'People who actively consume educational content and webinars',
        interests: ['Online courses', 'Educational content', 'Self-improvement', 'Webinars'],
        demographics: 'Ages 18-65, All genders, Worldwide',
        behaviors: ['Online learners', 'Webinar attendees'],
        rationale: 'Likely to sign up for educational webinars and content offers',
        ranking: 3,
        customAudiences: []
      }
    ],
    'OUTCOME_AWARENESS': [
      {
        name: 'Tech Enthusiasts & Early Adopters',
        description: 'People interested in new technologies and innovative products',
        interests: ['Technology news', 'Gadgets', 'Innovation', 'Startup culture', 'Product launches'],
        demographics: 'Ages 18-45, All genders, Worldwide',
        behaviors: ['Early adopters', 'Technology early adopters'],
        rationale: 'Early adopters are likely to engage with new product launches',
        ranking: 1,
        customAudiences: []
      },
      {
        name: 'Social Media Engagers',
        description: 'Active social media users who frequently like, comment, and share content',
        interests: ['Social media trends', 'Viral content', 'Influencer marketing', 'Social networking'],
        demographics: 'Ages 18-35, All genders, Worldwide',
        behaviors: ['Engaged users', 'Social media enthusiasts'],
        rationale: 'High engagement potential for brand awareness campaigns',
        ranking: 2,
        customAudiences: []
      },
      {
        name: 'Brand Followers & Competitor Audiences',
        description: 'People who follow similar brands and competitors in the industry',
        interests: ['Brand comparisons', 'Product reviews', 'Industry news', 'Competitor brands'],
        demographics: 'Ages 18-65, All genders, Worldwide',
        behaviors: ['Brand followers', 'Competitor engagement'],
        rationale: 'People interested in similar brands are likely to be interested in this brand',
        ranking: 3,
        customAudiences: []
      }
    ]
  };

  return audiencesByObjective[objective] || audiencesByObjective['OUTCOME_SALES'];
}

/**
 * Generates ad copy variations
 * @param {string} productInfo - Product information
 * @param {string} tone - Desired tone (professional, casual, urgent)
 * @param {number} count - Number of variations to generate
 * @returns {Promise<Array>} Array of ad copy variations
 */
export async function generateAdCopyVariations(productInfo, tone = 'professional', count = 3) {
  // Ensure count is within bounds
  const validCount = Math.max(
    campaignConfig.minAdCopyVariations,
    Math.min(count, campaignConfig.maxAdCopyVariations)
  );

  const prompt = buildAdCopyVariationsPrompt(productInfo, tone, validCount);

  try {
    const response = await callGeminiAPI(prompt, { temperature: 0.9 });
    const result = extractJSON(response);
    
    // Extract variations array
    const variations = result.variations || result.adCopy || [];
    
    // Ensure we have at least the minimum number of variations
    if (variations.length < campaignConfig.minAdCopyVariations) {
      throw new Error('Insufficient variations generated');
    }
    
    return variations.slice(0, validCount);
  } catch (error) {
    console.error('Error generating ad copy variations:', error);
    // Return fallback variations
    return getFallbackAdCopyVariations(productInfo, tone, validCount);
  }
}

/**
 * Builds the ad copy variations prompt
 * @param {string} productInfo - Product information
 * @param {string} tone - Desired tone
 * @param {number} count - Number of variations
 * @returns {string} The formatted prompt
 */
function buildAdCopyVariationsPrompt(productInfo, tone, count) {
  return `You are a Meta Ads copywriting expert. Generate ${count} distinct ad copy variations for this product.

PRODUCT INFORMATION:
${productInfo}

TONE: ${tone}

Requirements for each variation:
- Maximum 125 characters (Meta Ads primary text limit)
- Different angle or approach (benefit-focused, feature-focused, urgency, social proof, etc.)
- Compelling and action-oriented
- Appropriate for the specified tone
- Include a clear value proposition

Generate ${count} variations with different approaches:
1. Benefit-focused (emphasize what the customer gains)
2. Feature-focused (highlight key product features)
3. Urgency-driven (create sense of urgency or scarcity)
4. Social proof (leverage testimonials or popularity)
5. Problem-solution (identify pain point and solution)
6. Question-based (engage with a compelling question)
7. Storytelling (brief narrative approach)

Format your response as JSON:
{
  "variations": [
    "Ad copy variation 1 here",
    "Ad copy variation 2 here",
    "Ad copy variation 3 here"
  ]
}

Respond ONLY with the JSON object, no additional text.`;
}

/**
 * Provides fallback ad copy variations
 * @param {string} productInfo - Product information
 * @param {string} tone - Desired tone
 * @param {number} count - Number of variations
 * @returns {Array} Fallback ad copy variations
 */
function getFallbackAdCopyVariations(productInfo, tone, count) {
  const templates = {
    professional: [
      `Discover the benefits of ${productInfo}. Learn more today.`,
      `Transform your business with ${productInfo}. Get started now.`,
      `${productInfo} - The professional solution you've been looking for.`,
      `Elevate your results with ${productInfo}. See how it works.`,
      `Join thousands who trust ${productInfo} for their needs.`
    ],
    casual: [
      `You're gonna love ${productInfo}! Check it out 😊`,
      `${productInfo} makes everything easier. Try it now!`,
      `Ready to upgrade? ${productInfo} has got you covered!`,
      `Say hello to ${productInfo} - your new favorite thing!`,
      `Life's better with ${productInfo}. See for yourself!`
    ],
    urgent: [
      `Limited time: Get ${productInfo} now before it's gone!`,
      `Don't miss out on ${productInfo}. Offer ends soon!`,
      `Act fast! ${productInfo} is in high demand.`,
      `Last chance to get ${productInfo} at this price!`,
      `Hurry! ${productInfo} - available while supplies last.`
    ]
  };

  const selectedTemplates = templates[tone] || templates.professional;
  return selectedTemplates.slice(0, count);
}

// Export all functions
export default {
  generateCampaign,
  iterateCampaign,
  generateAudienceSuggestions,
  generateAdCopyVariations
};
