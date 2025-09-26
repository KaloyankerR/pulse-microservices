const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;
let sessionStore;

// Initialize Redis client if REDIS_URL is provided
if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.connect();

    sessionStore = new RedisStore({
      client: redisClient,
      prefix: 'pulse-user-service:',
    });
  } catch (error) {
    logger.warn('Redis connection failed, using memory store:', error.message);
  }
}

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) || 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
  name: 'pulse-user-session',
};

// Use Redis store if available, otherwise use memory store
if (sessionStore) {
  sessionConfig.store = sessionStore;
  logger.info('Using Redis for session storage');
} else {
  logger.info('Using memory store for session storage');
}

module.exports = session(sessionConfig);

