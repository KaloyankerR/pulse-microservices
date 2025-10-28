/**
 * Configuration type definitions
 */

// Environment variables interface
export interface EnvironmentConfig {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: string;

  // Database
  MONGODB_URI: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_NAME?: string;

  // Redis
  REDIS_URL: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;

  // RabbitMQ
  RABBITMQ_URL: string;
  RABBITMQ_HOST?: string;
  RABBITMQ_PORT?: string;
  RABBITMQ_USERNAME?: string;
  RABBITMQ_PASSWORD?: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN?: string;
  JWT_REFRESH_EXPIRES_IN?: string;

  // CORS
  CORS_ORIGIN?: string;

  // Logging
  LOG_LEVEL?: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;

  // Cache
  CACHE_TTL?: string;
  CACHE_MAX_SIZE?: string;

  // Notification
  NOTIFICATION_BATCH_SIZE?: string;
  NOTIFICATION_PROCESSING_INTERVAL?: string;

  // Metrics
  METRICS_ENABLED?: string;
  METRICS_PORT?: string;

  // Health Check
  HEALTH_CHECK_INTERVAL?: string;
  HEALTH_CHECK_TIMEOUT?: string;

  // Graceful Shutdown
  SHUTDOWN_TIMEOUT?: string;

  // Security
  BCRYPT_ROUNDS?: string;
  SESSION_SECRET?: string;

  // Feature Flags
  ENABLE_EMAIL_NOTIFICATIONS?: string;
  ENABLE_PUSH_NOTIFICATIONS?: string;
  ENABLE_REAL_TIME_NOTIFICATIONS?: string;
  ENABLE_NOTIFICATION_PREFERENCES?: string;

  // Performance
  MAX_NOTIFICATIONS_PER_REQUEST?: string;
  NOTIFICATION_CLEANUP_INTERVAL?: string;
  NOTIFICATION_RETENTION_DAYS?: string;

  // Development
  DEBUG?: string;
  VERBOSE_LOGGING?: string;
  ENABLE_SWAGGER?: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: string;
  error?: string;
  connectionInfo?: Record<string, unknown>;
}

// MongoDB Connection Status
export interface DatabaseConnectionStatus {
  isConnected: boolean;
  readyState: number;
  host?: string;
  port?: number;
  name?: string;
}

// Redis Client Interface
export interface RedisClient {
  connect(): Promise<void>;
  quit(): Promise<void>;
  ping(): Promise<string>;
  setEx(key: string, ttl: number, value: string): Promise<string>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  multi(): RedisMulti;
  decr(key: string): Promise<number>;
}

export interface RedisMulti {
  incr(key: string): this;
  expire(key: string, seconds: number): this;
  exec(): Promise<Array<[Error | null, unknown]>>;
}

// RabbitMQ Channel Interface
export interface RabbitMQChannel {
  assertExchange(exchange: string, type: string, options?: Record<string, unknown>): Promise<unknown>;
  assertQueue(queue: string, options?: Record<string, unknown>): Promise<unknown>;
  bindQueue(queue: string, exchange: string, routingKey: string): Promise<unknown>;
  consume(queue: string, handler: (msg: RabbitMQMessage | null) => Promise<void>): Promise<unknown>;
  ack(message: RabbitMQMessage): void;
  nack(message: RabbitMQMessage, allUpTo: boolean, requeue: boolean): void;
  publish(exchange: string, routingKey: string, content: Buffer, options?: Record<string, unknown>): boolean;
  connection: {
    stream: {
      destroyed: boolean;
    };
  };
  close(): Promise<void>;
}

export interface RabbitMQMessage {
  content: Buffer;
  properties: Record<string, unknown>;
}

// RabbitMQ Connection Interface
export interface RabbitMQConnection {
  createChannel(): Promise<RabbitMQChannel>;
  close(): Promise<void>;
  on(event: string, handler: (error?: Error) => void): void;
}

