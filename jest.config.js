module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/src/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/main.js',
    '!src/preload.js',
    '!src/**/*.test.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Module mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@renderer/(.*)$': '<rootDir>/renderer/src/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Mock configuration
  moduleFileExtensions: ['js', 'jsx', 'json'],
  
  // Timeout for tests
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  
  // Projects for multi-project setup
  projects: [
    {
      displayName: 'main-process',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/main/**/*.test.js', '<rootDir>/src/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    },
    {
      displayName: 'renderer-process',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/renderer/src/**/*.test.js', '<rootDir>/tests/renderer/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setupRenderer.js'],
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/tests/__mocks__/fileMock.js'
      }
    }
  ]
};
