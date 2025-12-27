/**
 * PDF.js Worker Configuration
 * 
 * This file configures the PDF.js worker for client-side PDF processing.
 * The worker runs in a separate thread to avoid blocking the UI during
 * PDF text extraction.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker source
// Using the CDN version for simplicity and reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default pdfjsLib;
