/**
 * AI Campaign Generator Configuration
 * 
 * Centralizes configuration for the AI-powered campaign generation system,
 * including Gemini API settings, PDF processing parameters, and vector
 * database configuration.
 */

// Gemini API Configuration
export const geminiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  model: 'gemini-2.5-flash', // Latest Gemini 2.0 Flash (free, fastest)
  embeddingModel: 'text-embedding-004',
  maxRetries: 3,
  timeout: 30000, // 30 seconds
};

// PDF Processing Configuration
export const pdfConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  chunkSize: 500, // tokens per chunk
  supportedFormats: ['application/pdf'],
};

// Vector Database Configuration
export const vectorDbConfig = {
  collection: 'documents',
  draftsCollection: 'drafts',
  topK: 10, // Number of similar chunks to retrieve
  similarityThreshold: 0.7,
};

// Web Scraping Configuration
export const scrapingConfig = {
  timeout: 10000, // 10 seconds
  maxRetries: 2,
  userAgent: 'Mozilla/5.0 (compatible; CampaignGenerator/1.0)',
};

// Campaign Generation Configuration
export const campaignConfig = {
  minAdCopyVariations: 3,
  maxAdCopyVariations: 10,
  minHeadlineVariations: 5,
  maxHeadlineVariations: 15,
  additionalInfoMaxLength: 5000,
};

// Validation Configuration
export const validationConfig = {
  minDailyBudget: 1, // USD
  maxDailyBudget: 100000, // USD
  minCampaignDuration: 1, // days
  maxCampaignDuration: 365, // days
};

// Error Messages
export const errorMessages = {
  pdfTooLarge: `File size exceeds ${pdfConfig.maxFileSize / 1024 / 1024}MB limit`,
  pdfInvalidFormat: 'Invalid file format. Please upload a PDF file.',
  pdfProcessingFailed: 'Failed to process PDF. Please try again.',
  geminiApiError: 'AI service is temporarily unavailable. Please try again.',
  scrapingFailed: 'Failed to fetch website content. You can enter information manually.',
  validationFailed: 'Please fix the validation errors before submitting.',
  networkError: 'Network error. Please check your connection and try again.',
};

// Loading Messages
export const loadingMessages = {
  uploadingDocument: 'Uploading document...',
  processingPdf: 'Extracting text from PDF...',
  generatingEmbeddings: 'Processing document content...',
  scrapingWebsite: 'Fetching website information...',
  generatingCampaign: 'Generating campaign with AI...',
  iteratingCampaign: 'Processing your request...',
  savingDraft: 'Saving draft...',
  loadingDraft: 'Loading draft...',
};

/**
 * Validates that all required environment variables are set
 * @throws {Error} If required environment variables are missing
 */
export function validateConfig() {
  const required = {
    'VITE_GEMINI_API_KEY': geminiConfig.apiKey,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
}

export default {
  geminiConfig,
  pdfConfig,
  vectorDbConfig,
  scrapingConfig,
  campaignConfig,
  validationConfig,
  errorMessages,
  loadingMessages,
  validateConfig,
};
