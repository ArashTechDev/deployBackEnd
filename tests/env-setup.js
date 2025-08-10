// backend/tests/env-setup.js
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'bytebasket_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'testpassword';
process.env.JWT_SECRET = 'test-secret-key';

// Mock console.log to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};