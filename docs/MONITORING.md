# Monitoring Guide - Prometheus & Grafana

This guide covers the monitoring setup for Pulse Microservices using Prometheus and Grafana.

## Overview

The monitoring stack consists of:

- **Prometheus**: Metrics collection and time-series database
- **Grafana**: Metrics visualization and dashboarding

## Quick Start

### 1. Start the Monitoring Stack

The monitoring services are included in the main `docker-compose.yml`:

```bash
# Start all services including monitoring
docker-compose up -d

# Or start only monitoring services
docker-compose up -d prometheus grafana
```

### 2. Access the UIs

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
  - Default credentials: `admin` / `admin`

### 3. View Dashboards

Grafana is pre-configured with:
- Prometheus as the default datasource
- A comprehensive "Pulse Microservices Overview" dashboard

Navigate to Dashboards → Pulse Microservices Overview to see:
- HTTP request rates
- Response times (p50, p95 percentiles)
- Service health status
- CPU and memory usage
- Error rates by status code

## Services Monitored

All microservices expose metrics at the `/metrics` endpoint:

| Service | Port | Metrics Endpoint |
|---------|------|------------------|
| User Service | 8081 | http://localhost:8081/metrics |
| Post Service | 8082 | http://localhost:8082/metrics |
| Messaging Service | 8084 | http://localhost:8084/metrics |
| Social Service | 8085 | http://localhost:8085/metrics |
| Notification Service | 8086 | http://localhost:8086/metrics |
| Prometheus | 9090 | http://localhost:9090/metrics |

## Available Metrics

### Standard Metrics (All Services)

- `process_cpu_seconds_total` - CPU time consumed
- `process_resident_memory_bytes` - Memory usage
- `process_open_fds` - Open file descriptors
- `process_start_time_seconds` - Process start time

### HTTP Metrics

- `http_requests_total` - Total HTTP requests by method, route, status code
- `http_request_duration_seconds` - HTTP request latency histogram

### Service-Specific Metrics

#### User Service
- `authentication_attempts_total` - Authentication attempts by type and status
- `user_operations_total` - User CRUD operations
- `database_operation_duration_seconds` - Database query latency

#### Notification Service
- `notifications_total` - Notifications processed by type
- `notification_processing_duration_seconds` - Processing time
- `notification_cache_hits_total` / `notification_cache_misses_total` - Cache performance
- `events_processed_total` - Event processing stats
- `queue_size` - RabbitMQ queue size

#### Social Service
- `follow_operations_total` - Follow/unfollow operations
- `block_operations_total` - Block/unblock operations

#### Messaging Service
- `websocket_connections_total` - Active WebSocket connections
- `messages_total` - Messages processed
- `conversations_total` - Conversations created

## Prometheus Configuration

The Prometheus configuration is located at `config/prometheus.yml`.

### Scrape Configuration

```yaml
scrape_configs:
  - job_name: 'user-service'
    static_configs:
      - targets: ['user-service:8081']
    scrape_interval: 10s
```

To add new services or modify scrape intervals, edit this file and reload Prometheus:

```bash
# Reload configuration without restart
curl -X POST http://localhost:9090/-/reload
```

## Grafana Configuration

### Datasources

Datasources are automatically provisioned from `config/grafana/datasources.yml`.

### Dashboards

Custom dashboards can be added to `config/grafana/` and will be automatically loaded.

### Creating Custom Dashboards

1. Access Grafana at http://localhost:3001
2. Click "+" → "Dashboard"
3. Add panels with PromQL queries
4. Save the dashboard
5. Export as JSON and save to `config/grafana/` for version control

## Useful Prometheus Queries

### Request Rate (per second)
```promql
rate(http_requests_total[5m])
```

### 95th Percentile Response Time
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Error Rate (5xx errors)
```promql
sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (job)
```

### Service Uptime
```promql
up{job=~".*-service"}
```

### Memory Usage by Service
```promql
process_resident_memory_bytes / 1024 / 1024
```

### CPU Usage by Service
```promql
rate(process_cpu_seconds_total[5m])
```

## Alerting (Future Enhancement)

To add alerting:

1. Create `config/prometheus/alert_rules.yml`
2. Configure Alertmanager in `docker-compose.yml`
3. Define alert rules for:
   - High error rates
   - Service downtime
   - High latency
   - Resource exhaustion

Example alert rule:
```yaml
groups:
  - name: service_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

## Troubleshooting

### Metrics Not Showing in Grafana

1. Check Prometheus targets: http://localhost:9090/targets
2. Verify services are exposing `/metrics` endpoint
3. Check Prometheus logs: `docker logs prometheus`
4. Verify network connectivity: `docker network inspect pulse-network`

### Service Metrics Not Appearing

```bash
# Check if service is exposing metrics
curl http://localhost:8081/metrics

# Check Prometheus scrape status
curl http://localhost:9090/api/v1/targets
```

### Grafana Dashboard Not Loading

1. Check Grafana logs: `docker logs grafana`
2. Verify datasource configuration: Grafana → Configuration → Data Sources
3. Test datasource connection

## Performance Considerations

- Metrics scraping adds minimal overhead (< 1% CPU)
- Default retention: 15 days (configurable in Prometheus command args)
- Adjust scrape intervals based on your needs:
  - High-traffic services: 10-15s
  - Low-traffic services: 30-60s

## Data Retention

Default Prometheus retention is 15 days. To modify:

```yaml
# In docker-compose.yml, add to prometheus command:
- '--storage.tsdb.retention.time=30d'
```

## Security Notes

For production deployments:

1. Change Grafana admin password (default: admin/admin)
2. Enable authentication on Prometheus
3. Use reverse proxy with TLS
4. Restrict network access to monitoring UIs
5. Use read-only datasource connections

## Next Steps

- Add custom dashboards for business metrics
- Configure alerting with Alertmanager
- Add exporters for Redis, MongoDB, RabbitMQ
- Implement distributed tracing with Jaeger
- Set up log aggregation with ELK/Loki

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

