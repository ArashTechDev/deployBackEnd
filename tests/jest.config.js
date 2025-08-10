/* eslint-disable linebreak-style */
module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Root directory for tests
  rootDir: '../',

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js', // Exclude main entry point
    '!src/**/*.config.js', // Exclude config files
    '!src/**/migrations/**', // Exclude migration scripts
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module directories
  moduleDirectories: ['node_modules', 'src'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout (30 seconds for database operations)
  testTimeout: 30000,

  // Global variables for tests
  globals: {
    NODE_ENV: 'test',
  },

  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest', // ← Fixed colon and closing quote
  },

  // Module name mapping (for absolute imports)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',         // ← Fixed colon and quotes
    '^@tests/(.*)$': '<rootDir>/tests/$1',  // ← Fixed colon and quotes
  },
};
