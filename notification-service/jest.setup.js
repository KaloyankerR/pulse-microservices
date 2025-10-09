// Set test environment variables FIRST
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/pulse_notifications_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.RABBITMQ_URL = 'amqp://localhost:5672';
process.env.PORT = '8086';

// Mock mongoose to prevent real database connections
jest.mock('mongoose', () => {
  const mockModel = jest.fn(() => ({
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    findOneAndDelete: jest.fn().mockReturnThis(),
    create: jest.fn().mockResolvedValue({}),
    save: jest.fn().mockResolvedValue({}),
    deleteOne: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({}),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([]),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }));

  return {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    connection: {
      readyState: 1,
      close: jest.fn().mockResolvedValue(),
      collections: {},
    },
    model: mockModel,
    Schema: jest.fn(),
    Types: {
      ObjectId: jest.fn((id) => id || '507f1f77bcf86cd799439011'),
    },
  };
});

// Mock external services BEFORE any imports
jest.mock('./src/config/database', () => ({
  connect: jest.fn().mockResolvedValue(),
  disconnect: jest.fn().mockResolvedValue(),
  healthCheck: jest.fn().mockResolvedValue({
    status: 'healthy',
    message: 'MongoDB connection is active',
    timestamp: new Date().toISOString(),
  }),
}));

jest.mock('./src/services/eventService', () => ({
  initializeConsumers: jest.fn().mockResolvedValue(),
  publishEvent: jest.fn().mockResolvedValue(),
  getConsumerStatus: jest.fn().mockReturnValue({
    userEvents: 'active',
    postEvents: 'active',
    socialEvents: 'active',
  }),
}));

jest.mock('./src/services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    recipient_id: '507f1f77bcf86cd799439011',
    sender_id: '507f1f77bcf86cd799439012',
    type: 'FOLLOW',
    title: 'New Follower',
    message: 'Someone started following you',
    is_read: false,
  }),
  getNotifications: jest.fn().mockResolvedValue([]),
  markAsRead: jest.fn().mockResolvedValue({ is_read: true }),
  markAllAsRead: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
  getUnreadCount: jest.fn().mockResolvedValue(0),
  getNotificationStats: jest.fn().mockResolvedValue({ total: 0, unread: 0, read: 0 }),
  deleteNotification: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }),
  cleanupOldNotifications: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  processEvent: jest.fn().mockResolvedValue(),
}));

jest.mock('./src/services/notificationPreferencesService', () => ({
  getPreferences: jest.fn().mockResolvedValue({
    user_id: '507f1f77bcf86cd799439011',
    email_notifications: true,
    push_notifications: true,
    in_app_notifications: true,
    preferences: {},
  }),
  updatePreferences: jest.fn().mockResolvedValue({
    user_id: '507f1f77bcf86cd799439011',
    email_notifications: false,
    push_notifications: true,
    in_app_notifications: true,
    preferences: {},
  }),
  getOrCreatePreferences: jest.fn().mockResolvedValue({
    user_id: '507f1f77bcf86cd799439011',
    email_notifications: true,
    push_notifications: true,
    in_app_notifications: true,
    preferences: {},
  }),
}));

jest.mock('./src/config/redis', () => ({
  connect: jest.fn().mockResolvedValue(),
  disconnect: jest.fn().mockResolvedValue(),
  getClient: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(),
    del: jest.fn().mockResolvedValue(),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(),
    ttl: jest.fn().mockResolvedValue(-1),
  }),
  healthCheck: jest.fn().mockResolvedValue({
    status: 'healthy',
    message: 'Redis connection is active',
    timestamp: new Date().toISOString(),
  }),
}));

jest.mock('./src/config/rabbitmq', () => ({
  connect: jest.fn().mockResolvedValue(),
  disconnect: jest.fn().mockResolvedValue(),
  getChannel: jest.fn().mockReturnValue({
    assertExchange: jest.fn().mockResolvedValue(),
    assertQueue: jest.fn().mockResolvedValue(),
    bindQueue: jest.fn().mockResolvedValue(),
    consume: jest.fn().mockResolvedValue(),
    publish: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(),
  }),
  setupConsumer: jest.fn().mockResolvedValue(),
  healthCheck: jest.fn().mockResolvedValue({
    status: 'healthy',
    message: 'RabbitMQ connection is active',
    timestamp: new Date().toISOString(),
  }),
}));

jest.mock('./src/config/metrics', () => ({
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
  getMetrics: jest.fn().mockResolvedValue('# HELP test_metric Test metric\n# TYPE test_metric counter\ntest_metric 1'),
  clear: jest.fn(),
}));

jest.mock('./src/utils/logger', () => ({
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

// Mock winston to prevent real logging
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  };
  
  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(() => ({})),
      timestamp: jest.fn(() => ({})),
      json: jest.fn(() => ({})),
      colorize: jest.fn(() => ({})),
      simple: jest.fn(() => ({})),
      printf: jest.fn(() => ({})),
      errors: jest.fn(() => ({})),
      splat: jest.fn(() => ({})),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

// Mock express-winston to prevent real logging
jest.mock('express-winston', () => ({
  logger: jest.fn((opts) => (req, res, next) => {
    if (typeof next === 'function') next();
  }),
  errorLogger: jest.fn((opts) => (err, req, res, next) => {
    if (typeof next === 'function') next(err);
  }),
}));

// Mock middleware
jest.mock('./src/middleware/errorHandler', () => ({
  errorHandler: jest.fn((err, req, res, next) => next(err)),
  notFound: jest.fn((req, res, next) => next()),
  initializeErrorHandlers: jest.fn(),
}));

jest.mock('./src/middleware/rateLimiter', () => ({
  generalLimiter: jest.fn((req, res, next) => next()),
  healthCheckLimiter: jest.fn((req, res, next) => next()),
  metricsLimiter: jest.fn((req, res, next) => next()),
  apiLimiter: jest.fn((req, res, next) => next()),
  preferencesUpdateLimiter: jest.fn((req, res, next) => next()),
}));

jest.mock('./src/middleware/metrics', () => ({
  requestMetrics: jest.fn((req, res, next) => next()),
  healthCheckMetrics: jest.fn((req, res, next) => next()),
  businessMetrics: {
    trackNotificationRead: jest.fn((req, res, next) => next()),
    trackPreferenceUpdate: jest.fn((req, res, next) => next()),
  },
}));

jest.mock('./src/middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: '507f1f77bcf86cd799439011', username: 'testuser' };
    next();
  }),
  authorizeRole: jest.fn((roles) => (req, res, next) => next()),
}));

jest.mock('./src/middleware/validation', () => ({
  validateNotification: jest.fn((req, res, next) => next()),
  validatePreferences: jest.fn((req, res, next) => next()),
  validateGetNotifications: jest.fn((req, res, next) => next()),
  validateNotificationId: jest.fn((req, res, next) => next()),
  validateUpdatePreferences: jest.fn((req, res, next) => next()),
  validateCleanup: jest.fn((req, res, next) => next()),
  sanitizeInput: jest.fn((req, res, next) => next()),
}));

// Mock the models with proper mock implementations
jest.mock('./src/models/notification', () => {
  const mockNotificationInstance = {
    _id: '507f1f77bcf86cd799439011',
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
    created_at: new Date(),
    updated_at: new Date(),
    read_at: null,
    save: jest.fn().mockResolvedValue(this),
    markAsRead: jest.fn().mockResolvedValue(),
    markAsUnread: jest.fn().mockResolvedValue(),
    toSafeObject: jest.fn().mockReturnValue({}),
  };

  const mockModel = jest.fn(() => ({
    ...mockNotificationInstance,
    save: jest.fn().mockResolvedValue(mockNotificationInstance),
  }));
  
  // Add static methods
  mockModel.find = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([mockNotificationInstance]),
  });
  
  mockModel.findById = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(mockNotificationInstance),
  });
  
  mockModel.findOne = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(mockNotificationInstance),
  });
  
  mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(mockNotificationInstance),
  });
  
  mockModel.findByIdAndDelete = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(mockNotificationInstance),
  });
  
  mockModel.create = jest.fn().mockResolvedValue(mockNotificationInstance);
  mockModel.deleteMany = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  });
  mockModel.updateMany = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  });
  mockModel.countDocuments = jest.fn().mockResolvedValue(1);
  mockModel.aggregate = jest.fn().mockResolvedValue([]);

  return mockModel;
});

jest.mock('./src/models/notificationPreferences', () => {
  const mockPreferences = {
    _id: '507f1f77bcf86cd799439011',
    user_id: '507f1f77bcf86cd799439011',
    email_notifications: true,
    push_notifications: true,
    in_app_notifications: true,
    preferences: {
      FOLLOW: { email: true, push: true, in_app: true },
      LIKE: { email: false, push: true, in_app: true },
      COMMENT: { email: true, push: true, in_app: true },
    },
    quiet_hours: {
      enabled: false,
      start_time: '22:00',
      end_time: '08:00',
      timezone: 'UTC',
    },
    created_at: new Date(),
    updated_at: new Date(),
    getPreferenceForType: jest.fn().mockReturnValue(true),
    setPreferenceForType: jest.fn(),
    isQuietHours: jest.fn().mockReturnValue(false),
    shouldSendNotification: jest.fn().mockReturnValue(true),
  };

  const mockModel = jest.fn(() => mockPreferences);
  mockModel.findByUserId = jest.fn().mockResolvedValue(mockPreferences);
  mockModel.createDefault = jest.fn().mockResolvedValue(mockPreferences);
  mockModel.getOrCreate = jest.fn().mockResolvedValue(mockPreferences);
  mockModel.findOneAndDelete = jest.fn().mockResolvedValue();
  
  return mockModel;
});

// Mock user cache model
jest.mock('./src/models/userCache', () => {
  const mockUserCache = {
    _id: '507f1f77bcf86cd799439011',
    user_id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
    profile_data: {},
    cached_at: new Date(),
    expires_at: new Date(Date.now() + 3600000), // 1 hour from now
  };

  return jest.fn(() => mockUserCache);
});

