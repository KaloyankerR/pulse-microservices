const { PrismaClient } = require('@prisma/client');

// Create a test database client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/pulse_users_test',
    },
  },
});

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
  
  // Clean up test database
  await prisma.userFollow.deleteMany();
  await prisma.user.deleteMany();
});

// Clean up after each test
afterEach(async () => {
  await prisma.userFollow.deleteMany();
  await prisma.user.deleteMany();
});

// Global test teardown
afterAll(async () => {
  await prisma.$disconnect();
});

// Make prisma available globally for tests
global.prisma = prisma;
