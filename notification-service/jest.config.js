module.exports = {
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js', // Exclude main app file from coverage
    '!src/server.js', // Exclude server file from coverage
    '!src/config/swagger.js', // Exclude swagger config
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  maxWorkers: 1,
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  globals: {
    'process.env.NODE_ENV': 'test'
  },
  testEnvironment: 'node',
  // Prevent Jest from trying to transform node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(mongodb-memory-server|@babel|babel-jest)/)'
  ],
  // Ensure proper module resolution
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  // Prevent infinite loops by limiting test concurrency
  maxConcurrency: 1
};
