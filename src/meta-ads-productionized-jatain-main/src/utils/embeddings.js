/**
 * Embeddings Utility
 * 
 * Generates vector embeddings from text using Google's Gemini API
 * for semantic search and document retrieval.
 */

import { geminiConfig } from '../config/aiConfig.js';

/**
 * Generates embeddings for a single text chunk
 * @param {string} text - The text to generate embeddings for
 * @returns {Promise<number[]>} The embedding vector
 * @throws {Error} If API call fails or text is invalid
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Invalid text provided for embedding generation');
  }

  if (!geminiConfig.apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const url = `${geminiConfig.baseUrl}/models/${geminiConfig.embeddingModel}:embedContent?key=${geminiConfig.apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `models/${geminiConfig.embeddingModel}`,
        content: {
          parts: [{
            text: text.trim()
          }]
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`
      );
    }

    const data = await response.json();
    
    if (!data.embedding || !data.embedding.values) {
      throw new Error('Invalid response from Gemini API: missing embedding data');
    }

    return data.embedding.values;
  } catch (error) {
    if (error.message.includes('Gemini API error')) {
      throw error;
    }
    console.error('Embedding generation error:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generates embeddings for multiple text chunks with rate limiting and retries
 * @param {string[]} textChunks - Array of text chunks to generate embeddings for
 * @param {Object} options - Options for batch processing
 * @param {number} options.batchSize - Number of chunks to process in parallel (default: 5)
 * @param {number} options.delayMs - Delay between batches in milliseconds (default: 100)
 * @param {Function} options.onProgress - Callback for progress updates (chunk index, total)
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
export async function generateEmbeddings(textChunks, options = {}) {
  const {
    batchSize = 5,
    delayMs = 100,
    onProgress = null,
  } = options;

  if (!Array.isArray(textChunks) || textChunks.length === 0) {
    throw new Error('Invalid text chunks provided');
  }

  const embeddings = [];
  const errors = [];

  // Process chunks in batches to avoid rate limiting
  for (let i = 0; i < textChunks.length; i += batchSize) {
    const batch = textChunks.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (chunk, batchIndex) => {
      const chunkIndex = i + batchIndex;
      try {
        const embedding = await retryWithBackoff(
          () => generateEmbedding(chunk),
          geminiConfig.maxRetries
        );
        
        if (onProgress) {
          onProgress(chunkIndex + 1, textChunks.length);
        }
        
        return { index: chunkIndex, embedding, error: null };
      } catch (error) {
        console.error(`Failed to generate embedding for chunk ${chunkIndex}:`, error);
        return { index: chunkIndex, embedding: null, error: error.message };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    
    // Collect results
    for (const result of batchResults) {
      if (result.embedding) {
        embeddings[result.index] = result.embedding;
      } else {
        errors.push({ index: result.index, error: result.error });
      }
    }

    // Add delay between batches to respect rate limits
    if (i + batchSize < textChunks.length) {
      await delay(delayMs);
    }
  }

  // Check if we have too many errors
  if (errors.length > textChunks.length * 0.5) {
    throw new Error(
      `Failed to generate embeddings for ${errors.length} out of ${textChunks.length} chunks. ` +
      `First error: ${errors[0]?.error || 'Unknown error'}`
    );
  }

  // Fill in missing embeddings with null (caller should handle)
  for (let i = 0; i < textChunks.length; i++) {
    if (!embeddings[i]) {
      embeddings[i] = null;
    }
  }

  return embeddings;
}

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - The async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} initialDelayMs - Initial delay in milliseconds (default: 1000)
 * @returns {Promise<any>} The result of the function
 */
async function retryWithBackoff(fn, maxRetries, initialDelayMs = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.message.includes('Invalid text') || 
          error.message.includes('not configured')) {
        throw error;
      }

      // Check if we should retry
      if (attempt < maxRetries) {
        const delayTime = initialDelayMs * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delayTime}ms`);
        await delay(delayTime);
      }
    }
  }
  
  throw lastError;
}

/**
 * Delays execution for the specified time
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculates cosine similarity between two embedding vectors
 * @param {number[]} embedding1 - First embedding vector
 * @param {number[]} embedding2 - Second embedding vector
 * @returns {number} Similarity score between -1 and 1
 */
export function cosineSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    throw new Error('Invalid embeddings for similarity calculation');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

/**
 * Finds the most similar embeddings to a query embedding
 * @param {number[]} queryEmbedding - The query embedding vector
 * @param {Array<{embedding: number[], data: any}>} candidates - Array of candidate embeddings with associated data
 * @param {number} topK - Number of top results to return
 * @returns {Array<{similarity: number, data: any}>} Top K most similar results
 */
export function findMostSimilar(queryEmbedding, candidates, topK = 10) {
  if (!queryEmbedding || !Array.isArray(candidates)) {
    throw new Error('Invalid parameters for similarity search');
  }

  // Calculate similarities
  const results = candidates
    .map(candidate => ({
      similarity: cosineSimilarity(queryEmbedding, candidate.embedding),
      data: candidate.data,
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return results;
}

export default {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
  findMostSimilar,
};
