/**
 * Document Processor Service
 * 
 * Handles PDF text extraction, text chunking, cleaning, and metadata extraction
 * for the AI Campaign Generator system.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { pdfConfig } from '../config/aiConfig.js';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();
}

/**
 * Extracts text content from a PDF file
 * @param {File} file - The PDF file to process
 * @returns {Promise<string>} The extracted text content
 * @throws {Error} If file is invalid or extraction fails
 */
export async function extractText(file) {
  // Validate file
  if (!file) {
    throw new Error('No file provided');
  }

  if (!pdfConfig.supportedFormats.includes(file.type)) {
    throw new Error('Invalid file format. Please upload a PDF file.');
  }

  if (file.size > pdfConfig.maxFileSize) {
    throw new Error(`File size exceeds ${pdfConfig.maxFileSize / 1024 / 1024}MB limit`);
  }

  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Extract text from all pages
    const textPromises = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      textPromises.push(extractPageText(pdf, pageNum));
    }
    
    const pageTexts = await Promise.all(textPromises);
    
    // Combine all page texts with page separators
    return pageTexts.join('\n\n');
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. The file may be corrupted or password-protected.');
  }
}

/**
 * Extracts text from a single PDF page
 * @param {PDFDocumentProxy} pdf - The PDF document
 * @param {number} pageNum - The page number to extract
 * @returns {Promise<string>} The extracted text from the page
 */
async function extractPageText(pdf, pageNum) {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();
  
  // Combine text items with proper spacing
  const text = textContent.items
    .map(item => item.str)
    .join(' ');
  
  return text;
}

/**
 * Chunks text into segments of approximately the specified token size
 * @param {string} text - The text to chunk
 * @param {number} chunkSize - Target size in tokens (approximate)
 * @returns {string[]} Array of text chunks
 */
export function chunkText(text, chunkSize = pdfConfig.chunkSize) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Approximate tokens by splitting on whitespace
  // This is a rough approximation; actual tokenization would be more complex
  const words = text.split(/\s+/);
  const chunks = [];
  
  let currentChunk = [];
  let currentSize = 0;
  
  for (const word of words) {
    // Rough token estimate: 1 word ≈ 1.3 tokens on average
    const wordTokens = Math.ceil(word.length / 4);
    
    if (currentSize + wordTokens > chunkSize && currentChunk.length > 0) {
      // Start new chunk
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentSize = wordTokens;
    } else {
      currentChunk.push(word);
      currentSize += wordTokens;
    }
  }
  
  // Add remaining chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }
  
  return chunks;
}

/**
 * Cleans and normalizes text content
 * @param {string} text - The text to clean
 * @returns {string} Cleaned text
 */
export function cleanText(text) {
  if (!text) {
    return '';
  }

  let cleaned = text;
  
  // Remove control characters except newlines and tabs
  cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalize line breaks (do this before whitespace normalization)
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '\n');
  
  // Remove excessive newlines (more than 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove excessive whitespace on each line (but preserve newlines)
  cleaned = cleaned.split('\n').map(line => line.replace(/\s+/g, ' ').trim()).join('\n');
  
  // Trim whitespace from start and end
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Extracts metadata from a PDF file
 * @param {File} file - The PDF file
 * @returns {Promise<Object>} Metadata object
 */
export async function extractMetadata(file) {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Get PDF metadata
    const metadata = await pdf.getMetadata();
    
    return {
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      pageCount: pdf.numPages,
      uploadedAt: new Date().toISOString(),
      pdfInfo: metadata.info || {},
      title: metadata.info?.Title || file.name,
      author: metadata.info?.Author || 'Unknown',
      subject: metadata.info?.Subject || '',
      keywords: metadata.info?.Keywords || '',
      creationDate: metadata.info?.CreationDate || null,
      modificationDate: metadata.info?.ModDate || null,
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    // Return basic metadata if PDF parsing fails
    return {
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      pageCount: 0,
      uploadedAt: new Date().toISOString(),
      pdfInfo: {},
      title: file.name,
      author: 'Unknown',
      subject: '',
      keywords: '',
      creationDate: null,
      modificationDate: null,
    };
  }
}

/**
 * Processes a PDF file completely: extracts text, cleans it, chunks it, and extracts metadata
 * @param {File} file - The PDF file to process
 * @returns {Promise<Object>} Object containing text, chunks, and metadata
 */
export async function processDocument(file) {
  // Extract metadata first
  const metadata = await extractMetadata(file);
  
  // Extract and clean text
  const rawText = await extractText(file);
  const cleanedText = cleanText(rawText);
  
  // Chunk the text
  const chunks = chunkText(cleanedText);
  
  return {
    text: cleanedText,
    chunks,
    metadata,
  };
}

export default {
  extractText,
  chunkText,
  cleanText,
  extractMetadata,
  processDocument,
};
