module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/tests/**/*.test.{ts,js}', '**/?(*.)+(spec|test).{ts,js}'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  testTimeout: 10000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        allowJs: true,
        skipLibCheck: true,
      },
    }],
  },
};












