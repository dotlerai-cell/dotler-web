/**
 * PDF Worker Configuration Tests
 * 
 * Tests to verify that PDF.js worker configuration file exists and is properly structured.
 * Note: Actual PDF.js functionality requires a browser environment and is tested separately.
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('PDF.js Worker Configuration', () => {
  test('pdfWorker.js file should exist', () => {
    const configPath = join(__dirname, '../pdfWorker.js');
    expect(() => readFileSync(configPath, 'utf-8')).not.toThrow();
  });

  test('pdfWorker.js should configure worker source', () => {
    const configPath = join(__dirname, '../pdfWorker.js');
    const content = readFileSync(configPath, 'utf-8');
    
    expect(content).toContain('import * as pdfjsLib from \'pdfjs-dist\'');
    expect(content).toContain('GlobalWorkerOptions.workerSrc');
    expect(content).toContain('cdnjs.cloudflare.com');
    expect(content).toContain('pdf.worker');
  });

  test('pdfWorker.js should export pdfjsLib', () => {
    const configPath = join(__dirname, '../pdfWorker.js');
    const content = readFileSync(configPath, 'utf-8');
    
    expect(content).toContain('export default pdfjsLib');
  });
});
