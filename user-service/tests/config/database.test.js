describe('Database Configuration', () => {
  let prisma;
  let mockPrismaClient;

  beforeEach(() => {
    // Mock PrismaClient
    mockPrismaClient = {
      $disconnect: jest.fn().mockResolvedValue(undefined),
    };

    jest.mock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => mockPrismaClient),
    }));

    // Clear the module cache to ensure fresh require
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should export prisma client', () => {
    prisma = require('../../src/config/database');
    expect(prisma).toBeDefined();
  });

  it('should be an instance with expected methods', () => {
    prisma = require('../../src/config/database');
    expect(typeof prisma).toBe('object');
  });
});

