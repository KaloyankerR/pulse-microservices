const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup test database
beforeAll(async () => {
  try {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Close database connection
    await mongoose.connection.close();
    
    // Stop in-memory MongoDB instance
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('Test database disconnected successfully');
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  }
});

// Clear database between tests
afterEach(async () => {
  try {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Failed to clear database:', error);
  }
});

// Mock external services
jest.mock('../src/config/redis', () => ({
  connect: jest.fn().mockResolvedValue(),
  disconnect: jest.fn().mockResolvedValue(),
  getClient: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(),
    del: jest.fn().mockResolvedValue(),
    exists: jest.fn().mockResolvedValue(0),
  }),
  healthCheck: jest.fn().mockResolvedValue({
    status: 'healthy',
    message: 'Redis connection is active',
    timestamp: new Date().toISOString(),
  }),
}));

jest.mock('../src/config/rabbitmq', () => ({
  connect: jest.fn().mockResolvedValue(),
  disconnect: jest.fn().mockResolvedValue(),
  getChannel: jest.fn().mockReturnValue({
    assertExchange: jest.fn().mockResolvedValue(),
    assertQueue: jest.fn().mockResolvedValue(),
    bindQueue: jest.fn().mockResolvedValue(),
    consume: jest.fn().mockResolvedValue(),
    publish: jest.fn().mockResolvedValue(true),
  }),
  setupConsumer: jest.fn().mockResolvedValue(),
  healthCheck: jest.fn().mockResolvedValue({
    status: 'healthy',
    message: 'RabbitMQ connection is active',
    timestamp: new Date().toISOString(),
  }),
}));

jest.mock('../src/config/metrics', () => ({
  register: {
    metrics: jest.fn().mockResolvedValue('# HELP test_metric Test metric\n# TYPE test_metric counter\ntest_metric 1'),
  },
  incrementHttpRequest: jest.fn(),
  recordHttpRequestDuration: jest.fn(),
  incrementNotificationCounter: jest.fn(),
  recordNotificationProcessingDuration: jest.fn(),
  incrementEventProcessingCounter: jest.fn(),
  recordEventProcessingDuration: jest.fn(),
  incrementDatabaseOperation: jest.fn(),
  recordDatabaseOperationDuration: jest.fn(),
  incrementCacheHit: jest.fn(),
  incrementCacheMiss: jest.fn(),
  setActiveConnections: jest.fn(),
  updateMemoryUsage: jest.fn(),
  getMetrics: jest.fn().mockResolvedValue('# HELP test_metric Test metric'),
  clear: jest.fn(),
}));

// Mock logger to prevent console output during tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  addRequestId: jest.fn((req, res, next) => {
    req.requestId = 'test-request-id';
    next();
  }),
  expressMiddleware: jest.fn((req, res, next) => next()),
  logNotification: jest.fn(),
  logEventProcessing: jest.fn(),
  logDatabaseOperation: jest.fn(),
  logCacheOperation: jest.fn(),
  logError: jest.fn(),
  logPerformance: jest.fn(),
}));

// Global test helpers
global.createMockUser = () => ({
  id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  role: 'USER',
});

global.createMockNotification = (overrides = {}) => ({
  recipient_id: '507f1f77bcf86cd799439011',
  sender_id: '507f1f77bcf86cd799439012',
  type: 'FOLLOW',
  title: 'New Follower',
  message: 'Someone started following you',
  reference_id: '507f1f77bcf86cd799439012',
  reference_type: 'USER',
  is_read: false,
  priority: 'MEDIUM',
  metadata: {},
  ...overrides,
});

global.createMockEvent = (eventType, data = {}) => ({
  event_type: eventType,
  data: {
    user_id: '507f1f77bcf86cd799439011',
    ...data,
  },
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/pulse_notifications_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.RABBITMQ_URL = 'amqp://localhost:5672';
