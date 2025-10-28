import * as client from 'prom-client';
import logger from '../utils/logger';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'pulse-notification-service',
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for notification service
const notificationCounter = new client.Counter({
  name: 'notifications_total',
  help: 'Total number of notifications processed',
  labelNames: ['type', 'status'],
  registers: [register],
});

const notificationProcessingDuration = new client.Histogram({
  name: 'notification_processing_duration_seconds',
  help: 'Duration of notification processing in seconds',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const notificationCacheHitCounter = new client.Counter({
  name: 'notification_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['operation'],
  registers: [register],
});

const notificationCacheMissCounter = new client.Counter({
  name: 'notification_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['operation'],
  registers: [register],
});

const activeConnections = new client.Gauge({
  name: 'notification_active_connections',
  help: 'Number of active connections',
  registers: [register],
});

const eventProcessingCounter = new client.Counter({
  name: 'events_processed_total',
  help: 'Total number of events processed',
  labelNames: ['event_type', 'status'],
  registers: [register],
});

const eventProcessingDuration = new client.Histogram({
  name: 'event_processing_duration_seconds',
  help: 'Duration of event processing in seconds',
  labelNames: ['event_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Database metrics
const databaseOperationCounter = new client.Counter({
  name: 'database_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

const databaseOperationDuration = new client.Histogram({
  name: 'database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// HTTP request metrics
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Queue metrics
const queueSize = new client.Gauge({
  name: 'queue_size',
  help: 'Current queue size',
  labelNames: ['queue_name'],
  registers: [register],
});

const queueProcessingDuration = new client.Histogram({
  name: 'queue_processing_duration_seconds',
  help: 'Duration of queue message processing in seconds',
  labelNames: ['queue_name', 'routing_key'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Memory and system metrics
const memoryUsage = new client.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
  registers: [register],
});

// Metrics interface
interface MetricsInterface {
  register: client.Registry;
  incrementNotificationCounter(type: string, status?: string): void;
  recordNotificationProcessingDuration(type: string, duration: number): void;
  incrementCacheHit(operation: string): void;
  incrementCacheMiss(operation: string): void;
  setActiveConnections(count: number): void;
  incrementEventProcessingCounter(eventType: string, status?: string): void;
  recordEventProcessingDuration(eventType: string, duration: number): void;
  incrementDatabaseOperation(operation: string, status?: string): void;
  recordDatabaseOperationDuration(operation: string, duration: number): void;
  incrementHttpRequest(method: string, route: string, statusCode: number): void;
  recordHttpRequestDuration(method: string, route: string, duration: number): void;
  setQueueSize(queueName: string, size: number): void;
  recordQueueProcessingDuration(queueName: string, routingKey: string, duration: number): void;
  updateMemoryUsage(): void;
  getMetrics(): Promise<string>;
  clear(): void;
}

// Custom metrics methods
const metrics: MetricsInterface = {
  register,

  // Notification metrics
  incrementNotificationCounter(type: string, status = 'success'): void {
    notificationCounter.inc({ type, status });
  },

  recordNotificationProcessingDuration(type: string, duration: number): void {
    notificationProcessingDuration.observe({ type }, duration / 1000); // Convert ms to seconds
  },

  incrementCacheHit(operation: string): void {
    notificationCacheHitCounter.inc({ operation });
  },

  incrementCacheMiss(operation: string): void {
    notificationCacheMissCounter.inc({ operation });
  },

  setActiveConnections(count: number): void {
    activeConnections.set(count);
  },

  // Event processing metrics
  incrementEventProcessingCounter(eventType: string, status = 'success'): void {
    eventProcessingCounter.inc({ event_type: eventType, status });
  },

  recordEventProcessingDuration(eventType: string, duration: number): void {
    eventProcessingDuration.observe({ event_type: eventType }, duration / 1000); // Convert ms to seconds
  },

  // Database metrics
  incrementDatabaseOperation(operation: string, status = 'success'): void {
    databaseOperationCounter.inc({ operation, status });
  },

  recordDatabaseOperationDuration(operation: string, duration: number): void {
    databaseOperationDuration.observe({ operation }, duration / 1000); // Convert ms to seconds
  },

  // HTTP metrics
  incrementHttpRequest(method: string, route: string, statusCode: number): void {
    httpRequestCounter.inc({ method, route, status_code: statusCode });
  },

  recordHttpRequestDuration(method: string, route: string, duration: number): void {
    httpRequestDuration.observe({ method, route }, duration / 1000); // Convert ms to seconds
  },

  // Queue metrics
  setQueueSize(queueName: string, size: number): void {
    queueSize.set({ queue_name: queueName }, size);
  },

  recordQueueProcessingDuration(queueName: string, routingKey: string, duration: number): void {
    queueProcessingDuration.observe({ queue_name: queueName, routing_key: routingKey }, duration / 1000);
  },

  // Memory metrics
  updateMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    memoryUsage.set({ type: 'rss' }, memUsage.rss);
    memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    memoryUsage.set({ type: 'external' }, memUsage.external);
  },

  // Get all metrics as string
  async getMetrics(): Promise<string> {
    return register.metrics();
  },

  // Clear all metrics (useful for testing)
  clear(): void {
    register.clear();
  },
};

// Update memory usage every 30 seconds
setInterval(() => {
  metrics.updateMemoryUsage();
}, 30000);

logger.info('Prometheus metrics configured');

export default metrics;

