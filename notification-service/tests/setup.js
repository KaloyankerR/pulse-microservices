// Mock database setup for tests
// Since we're using mocked mongoose in jest.setup.js, we don't need real database connections

// Setup test environment
beforeAll(async () => {
  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';
    
    console.log('Test environment setup completed');
  } catch (error) {
    console.error('Failed to setup test environment:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Clear all mocks
    jest.clearAllMocks();
    
    console.log('Test environment cleanup completed');
  } catch (error) {
    console.error('Failed to cleanup test environment:', error);
  }
});

// Clear mocks between tests
afterEach(async () => {
  try {
    // Clear all mocks between tests
    jest.clearAllMocks();
  } catch (error) {
    console.error('Failed to clear mocks:', error);
  }
});

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
