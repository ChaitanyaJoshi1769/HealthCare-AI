// Test setup and global configuration
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test database connection
beforeAll(async () => {
  // Initialize test database if needed
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://healthos:test@localhost:5432/healthos_test';
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connections
  // Close cache connections
  // Cleanup resources
});
