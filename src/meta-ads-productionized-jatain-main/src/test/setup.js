/**
 * Vitest Test Setup
 * 
 * This file runs before all tests and sets up the testing environment.
 */

import { expect, vi } from 'vitest';

// Mock environment variables for tests
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-firebase-key');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');

// Global test utilities
global.expect = expect;
