# Monitoring Quick Start

Get up and running with Prometheus and Grafana monitoring in under 5 minutes.

## 1. Start the Monitoring Stack

```bash
# Start all services (includes monitoring)
docker-compose up -d

# Or start only Prometheus and Grafana
docker-compose up -d prometheus grafana
```

## 2. Access the UIs

Open these URLs in your browser:

- **Grafana**: http://localhost:3001
  - Login: `admin` / `admin`
  - Pre-configured dashboard: **Pulse Microservices Overview**

- **Prometheus**: http://localhost:9090
  - No authentication required
  - View targets: http://localhost:9090/targets

## 3. View Metrics

### In Grafana (Recommended)

1. Navigate to http://localhost:3001
2. Login with `admin` / `admin`
3. Go to **Dashboards** → **Pulse Microservices Overview**
4. View real-time metrics for all services

### In Prometheus

1. Navigate to http://localhost:9090
2. Click **Graph**
3. Try these queries:

```promql
# Total requests per second
rate(http_requests_total[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Service health
up{job=~".*-service"}

# Memory usage in MB
process_resident_memory_bytes / 1024 / 1024
```

## 4. Verify Everything Works

```bash
# Check if Prometheus is scraping metrics
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# View metrics from a service
curl http://localhost:8081/metrics

# Generate some load to see metrics change
for i in {1..100}; do curl http://localhost:8000/api/v1/posts; done
```

## What's Next?

- **Create Custom Dashboards**: Explore Grafana and create dashboards for your specific needs
- **Set Up Alerts**: Configure alerts for high error rates, latency, or downtime
- **Add More Metrics**: Instrument your code with custom business metrics
- **Export Dashboards**: Save your dashboards to `config/grafana/` for version control

## Key Metrics to Watch

| Metric | Description | Good Value | Alert When |
|--------|-------------|------------|------------|
| Request Rate | Requests per second | Varies | Sudden drops |
| Response Time (p95) | 95th percentile latency | < 1s | > 2s |
| Error Rate | 5xx errors | < 1% | > 5% |
| CPU Usage | CPU utilization | < 70% | > 90% |
| Memory Usage | RAM consumption | Steady | Growing trend |
| Service Uptime | Service availability | 1 (up) | 0 (down) |

## Troubleshooting

### Grafana Not Showing Data

```bash
# 1. Check if Grafana is running
docker ps | grep grafana

# 2. Check datasource connection in Grafana UI
# Go to: Configuration → Data Sources → Prometheus → Test

# 3. Check Grafana logs
docker logs grafana
```

### Prometheus Not Scraping Services

```bash
# 1. Check Prometheus targets
open http://localhost:9090/targets

# 2. Check if service is exposing metrics
curl http://localhost:8081/metrics

# 3. Check Prometheus logs
docker logs prometheus

# 4. Verify network connectivity
docker network inspect pulse-network
```

### Service Metrics Endpoint Not Available

```bash
# Check if service is running
docker ps

# Check service logs
docker logs pulse-user-service

# Restart service
docker-compose restart user-service
```

## Useful Commands

```bash
# Restart monitoring stack
docker-compose restart prometheus grafana

# View logs
docker logs -f prometheus
docker logs -f grafana

# Stop monitoring
docker-compose stop prometheus grafana

# Remove monitoring data (fresh start)
docker-compose down -v
docker volume rm pulse-microservices_prometheus_data
docker volume rm pulse-microservices_grafana_data
```

## Learn More

- [Full Monitoring Documentation](docs/MONITORING.md)
- [Prometheus Querying](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [PromQL Cheatsheet](https://promlabs.com/promql-cheat-sheet/)

