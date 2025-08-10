/* eslint-disable no-console */
// backend/tests/setup.js
const { mockPool } = require('./mocks/database');

// Mock the database pool module
jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPool)
}));

// Global test setup - no real database needed
beforeAll(async () => {
  console.log('Mock database setup complete');
});

// Global test teardown
afterAll(async () => {
  console.log('Mock database cleanup complete');
});

// Clean up after each test
afterEach(() => {
  // Clear mock call history
  jest.clearAllMocks();
});

module.exports = { testPool: mockPool };