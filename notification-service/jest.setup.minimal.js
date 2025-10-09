// Minimal test setup - only mock external service connections
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/pulse_notifications_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.RABBITMQ_URL = 'amqp://localhost:5672';
process.env.PORT = '8086';

