# Monitoring and Observability Strategy

## Overview

This document describes the comprehensive monitoring and observability strategy for the Pulse microservices platform, including metrics collection, logging, and visualization using Prometheus and Grafana.

## Observability Pillars

### 1. Metrics

**Purpose**: Quantitative measurements of system behavior over time.

**Implementation**: Prometheus for metrics collection

### 2. Logs

**Purpose**: Discrete events and errors recorded by services.

**Implementation**: Structured JSON logging with correlation IDs

### 3. Traces

**Purpose**: Request flow through distributed services (future enhancement).

**Implementation**: Planned - Distributed tracing with Jaeger

---

## Metrics Collection Strategy

### Prometheus Configuration

**Scrape Configuration**:
- Scrape interval: 15 seconds (global), 10 seconds (services)
- Evaluation interval: 15 seconds
- Retention: 30 days

**Services Monitored**:
- Auth Service (port 8080)
- User Service (port 8081)
- Post Service (port 8082)
- Event Service (port 8083)
- Messaging Service (port 8084)
- Social Service (port 8085)
- Notification Service (port 8086)
- RabbitMQ (port 15692)
- Redis (via redis_exporter)


---

### Metrics Endpoints

**All Services Expose**:
- `/metrics` - Prometheus metrics endpoint
- `/health` - Health check endpoint
- `/ready` - Readiness probe endpoint

**Metrics Collected**:

1. **HTTP Metrics**:
   - `http_requests_total` - Total HTTP requests
   - `http_request_duration_seconds` - Request duration
   - `http_requests_in_flight` - Current in-flight requests
   - `http_request_size_bytes` - Request size
   - `http_response_size_bytes` - Response size

2. **Application Metrics**:
   - `user_actions_total` - User actions (likes, follows, etc.)
   - `database_queries_total` - Database query count
   - `cache_hits_total` - Cache hit count
   - `cache_misses_total` - Cache miss count

3. **System Metrics**:
   - `process_cpu_seconds_total` - CPU usage
   - `process_resident_memory_bytes` - Memory usage
   - `go_goroutines` - Goroutine count (Go services)
   - `nodejs_heap_size_total_bytes` - Heap size (Node.js services)

**Code Example**:
```javascript
// Prometheus metrics in Node.js service
const promClient = require('prom-client');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    }, duration);
  });
  next();
});
```


---

## Grafana Dashboards

### Dashboard Categories

1. **Infrastructure Dashboard**:
   - CPU usage per service
   - Memory usage per service
   - Network I/O
   - Disk usage
   - Container metrics

2. **Services Dashboard**:
   - Request rate per service
   - Response time (p50, p95, p99)
   - Error rate per service
   - Active connections
   - Service health status

3. **Business Logic Dashboard**:
   - User actions (likes, follows, posts)
   - API endpoint usage
   - Feature adoption rates
   - User engagement metrics

4. **Database Dashboard**:
   - Query performance
   - Connection pool usage
   - Database size
   - Replication lag (if applicable)


---

### Dashboard Configuration

**Grafana Setup**:
- Data source: Prometheus
- Dashboard provisioning: ConfigMaps
- Auto-refresh: 30 seconds
- Time range: Last 1 hour (default), up to 30 days

**Key Panels**:
- Request rate (requests/second)
- Response time percentiles (p50, p95, p99)
- Error rate percentage
- Active users
- Service health status


---

## Logging Strategy

### Structured Logging

**Format**: JSON for machine parsing

**Log Levels**:
- **DEBUG**: Detailed information for debugging
- **INFO**: General informational messages
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages requiring attention

**Code Example**:
```javascript
// Structured JSON logging
import logger from './utils/logger';

logger.info('User created', {
  userId: user.id,
  email: user.email,
  correlationId: req.correlationId,
  timestamp: new Date().toISOString(),
  service: 'user-service'
});
```


---

### Correlation IDs

**Purpose**: Track requests across services

**Implementation**:
- Generate correlation ID at API Gateway
- Pass correlation ID in headers
- Include in all log entries
- Enable request tracing

**Code Example**:
```javascript
// Correlation ID middleware
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

// Include in logs
logger.info('Processing request', {
  correlationId: req.correlationId,
  method: req.method,
  path: req.path
});
```

---

### Log Aggregation

**Current**: Logs written to stdout/stderr (Kubernetes captures)

**Future Enhancement**: Centralized log aggregation with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Loki (Grafana's log aggregation)
- Fluentd for log forwarding

**Kubernetes Log Collection**:
- Kubernetes automatically collects stdout/stderr
- `kubectl logs` for viewing logs
- Log rotation configured

---

## Health Checks

### Liveness Probes

**Purpose**: Determine if container is running

**Implementation**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8086
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

**Health Check Endpoint**:
```javascript
app.get('/health', async (req, res) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: await checkDatabase(),
    redis: await checkRedis(),
    rabbitmq: await checkRabbitMQ()
  };
  
  const healthy = checks.database && checks.redis && checks.rabbitmq;
  res.status(healthy ? 200 : 503).json(checks);
});
```

---

### Readiness Probes

**Purpose**: Determine if container is ready to accept traffic

**Implementation**:
```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8086
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

**Readiness Check Endpoint**:
```javascript
app.get('/ready', async (req, res) => {
  const ready = await checkDependencies();
  res.status(ready ? 200 : 503).json({
    ready: ready,
    timestamp: new Date()
  });
});
```


---

## Alerting Strategy

### Current Status

**Implemented**:
- Prometheus alerting rules configured (commented out)
- Alertmanager ready for integration
- Metrics available for alerting

**Planned**:
- Alert rules for critical metrics
- Alertmanager integration
- Notification channels (email, Slack, PagerDuty)

**Alert Rules (Planned)**:
```yaml
groups:
  - name: service_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
      
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 0.5
        for: 5m
        annotations:
          summary: "High response time detected"
      
      - alert: ServiceDown
        expr: up{job="user-service"} == 0
        for: 1m
        annotations:
          summary: "Service is down"
```


---

## Monitoring Architecture

### Component Overview

```
┌─────────────┐
│   Services  │───Metrics───┐
│  (7 micro)  │             │
└─────────────┘             │
                            ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Kong      │─────▶│  Prometheus  │─────▶│   Grafana   │
│ API Gateway │      │  (Metrics)   │      │(Visualization)
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            │ Logs
                            ▼
                    ┌──────────────┐
                    │   Kubernetes │
                    │  (stdout/    │
                    │   stderr)    │
                    └──────────────┘
```

---

## Kubernetes Monitoring

### Deployment Monitoring

**Metrics Collected**:
- Pod status and health
- Resource usage (CPU, memory)
- Replica counts
- Deployment status

**Tools**:
- `kubectl top pods` - Resource usage
- `kubectl get pods` - Pod status
- Prometheus Kubernetes exporter

---

### Service Discovery

**Automatic Discovery**:
- Kubernetes service discovery for Prometheus
- Automatic target configuration
- Dynamic scrape configuration

**Configuration**:
```yaml
scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

---

## Performance Monitoring

### Key Performance Indicators (KPIs)

1. **Response Time**:
   - p50 (median): Target <100ms
   - p95: Target <200ms
   - p99: Target <500ms

2. **Error Rate**:
   - Target: <0.1%
   - Monitor: 4xx and 5xx responses

3. **Throughput**:
   - Requests per second
   - Peak load capacity

4. **Availability**:
   - Uptime percentage
   - Service health status

---

## Security Monitoring

### Security Events Logged

- Failed login attempts
- Authentication failures
- Permission denials
- Rate limit hits
- Suspicious activity

**Metrics**:
- `auth_failures_total` - Authentication failures
- `rate_limit_hits_total` - Rate limit hits
- `permission_denials_total` - Permission denials

**Logging**:
```javascript
logger.warn('Failed login attempt', {
  email: email,
  ip: req.ip,
  userAgent: req.get('user-agent'),
  timestamp: new Date(),
  correlationId: req.correlationId
});
```

---

## Monitoring Best Practices

### 1. Comprehensive Coverage

- ✅ All services monitored
- ✅ Infrastructure metrics collected
- ✅ Business metrics tracked
- ✅ Security events logged

### 2. Real-Time Visibility

- ✅ Grafana dashboards for real-time view
- ✅ Prometheus metrics updated every 10-15 seconds
- ✅ Health checks every 5 seconds

### 3. Historical Analysis

- ✅ 30-day metric retention
- ✅ Grafana historical data visualization
- ✅ Trend analysis capabilities

### 4. Actionable Alerts

- ⚠️ Alert rules defined (integration pending)
- ⚠️ Alertmanager ready for integration
- 📋 Notification channels to be configured

---

## Future Enhancements

### Distributed Tracing

**Planned**: Jaeger integration for distributed tracing
- Request flow visualization
- Service dependency mapping
- Performance bottleneck identification

### Advanced Logging

**Planned**: Centralized log aggregation
- ELK Stack or Loki
- Log search and analysis
- Log-based alerting

### Enhanced Alerting

**Planned**: Comprehensive alerting
- Alert rules for all critical metrics
- Multiple notification channels
- Alert escalation policies

---

## Conclusion

The Pulse microservices platform implements comprehensive monitoring and observability through:

- ✅ **Metrics**: Prometheus collecting metrics from all services
- ✅ **Logging**: Structured JSON logging with correlation IDs
- ✅ **Visualization**: Grafana dashboards for real-time and historical analysis
- ✅ **Health Checks**: Liveness and readiness probes for all services
- ⚠️ **Alerting**: Metrics ready, alerting integration planned

The monitoring strategy provides visibility into system performance, health, and security, enabling proactive issue detection and resolution. The platform is well-instrumented for production monitoring with planned enhancements for distributed tracing and advanced alerting.

**Overall Monitoring Status**: **STRONG** ✅

