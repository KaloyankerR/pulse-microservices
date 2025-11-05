# k6 Load Testing Suite

This directory contains comprehensive load testing scripts for the Pulse microservices platform using [k6](https://k6.io/).

## Overview

The load testing suite tests all microservices through the Kong API Gateway (port 8000) with multiple test scenarios:
- **Baseline**: Normal load tests (10-50 VUs, 1-5 min duration)
- **Stress**: Breaking point tests (ramp up to 200+ VUs)
- **Spike**: Sudden load increase tests (0→100→0 VUs quickly)
- **Soak**: Sustained load tests (50 VUs for 30+ minutes)

## Prerequisites

1. **Install k6**: Follow the [official k6 installation guide](https://k6.io/docs/getting-started/installation/)
   ```bash
   # macOS
   brew install k6
   
   # Linux
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D6B
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   
   # Windows
   choco install k6
   ```

2. **Start the microservices**: Ensure all services are running via Docker Compose
   ```bash
   make up
   ```

3. **Verify Kong Gateway**: Ensure Kong is accessible at `http://localhost:8000`
   ```bash
   curl http://localhost:8000/health
   ```

4. **Create Test User Account**: The load tests require a test user account. Create one using:
   ```bash
   # Option 1: Use the API directly
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "loadtest@pulse.com",
       "username": "loadtester",
       "password": "LoadTest123!",
       "displayName": "Load Tester"
     }'
   
   # Option 2: Use environment variables to set custom credentials
   export TEST_EMAIL=your@email.com
   export TEST_PASSWORD=YourPassword123!
   export TEST_USERNAME=yourusername
   ```

## Directory Structure

```
load-tests/
├── config/              # Configuration files
│   ├── options.js      # k6 options for different scenarios
│   └── thresholds.js   # Performance thresholds
├── lib/                # Shared utilities
│   ├── auth.js         # Authentication helper functions
│   ├── constants.js    # API endpoints and constants
│   └── helpers.js      # Common helper functions
├── scenarios/          # Test scenarios by type
│   ├── baseline/       # Normal load tests
│   ├── stress/         # Breaking point tests
│   ├── spike/          # Sudden load increase tests
│   └── soak/           # Sustained load tests
├── services/           # Service-specific test scripts
│   ├── auth.js         # Auth service tests
│   ├── user.js         # User service tests
│   ├── post.js          # Post service tests
│   ├── messaging.js     # Messaging service tests
│   ├── notification.js  # Notification service tests
│   ├── social.js        # Social service tests
│   └── event.js         # Event service tests
├── results/            # Test results (JSON/CSV)
└── README.md           # This file
```

## Running Load Tests

### Using Makefile (Recommended)

**Option 1: Simple tests (no authentication required) - EASIEST**
```bash
# Run simple baseline tests (public endpoints only, no auth needed)
make load-test-simple
```

**Option 2: Full tests (requires authentication)**
```bash
# Create test user first (automatically done before baseline tests)
make load-test-create-user

# Run baseline load tests (automatically creates user if needed)
make load-test-baseline

# Run stress load tests
make load-test-stress

# Run spike load tests
make load-test-spike

# Run soak load tests
make load-test-soak

# Run all test scenarios
make load-test-all
```

### Using k6 Directly

```bash
# Baseline test
k6 run --out json=results/baseline-summary.json --out csv=results/baseline-metrics.csv scenarios/baseline/baseline.js

# Stress test
k6 run --out json=results/stress-summary.json --out csv=results/stress-metrics.csv scenarios/stress/stress.js

# Spike test
k6 run --out json=results/spike-summary.json --out csv=results/spike-metrics.csv scenarios/spike/spike.js

# Soak test
k6 run --out json=results/soak-summary.json --out csv=results/soak-metrics.csv scenarios/soak/soak.js
```

## Test Scenarios

### Baseline Test
- **Virtual Users**: 2 (reduced for laptop safety)
- **Duration**: ~2 minutes
- **Purpose**: Normal load testing to establish baseline performance
- **Stages**:
  - Ramp up to 2 VUs over 30 seconds
  - Stay at 2 VUs for 1 minute
  - Ramp down over 30 seconds

### Stress Test
- **Virtual Users**: 5 → 10 (reduced for laptop safety)
- **Duration**: ~7 minutes
- **Purpose**: Find the breaking point of the system
- **Stages**:
  - Ramp up to 5 VUs over 1 minute
  - Stay at 5 VUs for 2 minutes
  - Ramp up to 10 VUs over 1 minute
  - Stay at 10 VUs for 2 minutes
  - Ramp down over 1 minute

### Spike Test
- **Virtual Users**: 0 → 5 → 0 → 8 → 0 (reduced for laptop safety)
- **Duration**: ~2.5 minutes
- **Purpose**: Test system behavior under sudden load spikes
- **Stages**:
  - Sudden spike to 5 VUs (10 seconds)
  - Stay at 5 VUs for 30 seconds
  - Sudden drop to 0 VUs (10 seconds)
  - Recovery period (30 seconds)
  - Another spike to 8 VUs (10 seconds)
  - Stay at 8 VUs for 30 seconds
  - Drop to 0 VUs

### Soak Test
- **Virtual Users**: 3 (reduced for laptop safety)
- **Duration**: ~7 minutes
- **Purpose**: Test system stability under sustained load
- **Stages**:
  - Ramp up to 3 VUs over 1 minute
  - Stay at 3 VUs for 5 minutes
  - Ramp down over 1 minute

## Test Coverage

Each test scenario covers all microservices:

1. **Auth Service**: Login, register, refresh token, get current user
2. **User Service**: Get profile, update profile, search users, follow/unfollow, get followers
3. **Post Service**: Get posts, create post, like/unlike, get comments
4. **Messaging Service**: Get conversations, send message, mark as read
5. **Notification Service**: Get notifications, mark as read, get unread count
6. **Social Service**: Follow/unfollow, get followers/following, get recommendations
7. **Event Service**: Get events, create event, RSVP, get attendees

## Performance Thresholds

### Default Thresholds
- **95th percentile response time**: < 500ms
- **99th percentile response time**: < 1000ms
- **Error rate**: < 1%
- **Connection time (95th percentile)**: < 50ms

### Relaxed Thresholds (for stress/spike tests)
- **95th percentile response time**: < 2000ms
- **99th percentile response time**: < 5000ms
- **Error rate**: < 5%
- **Connection time (95th percentile)**: < 100ms

## Test Results

Results are saved in the `results/` directory:

- **JSON Summary**: `{scenario}-summary.json` - Aggregated metrics
- **CSV Metrics**: `{scenario}-metrics.csv` - Detailed time-series metrics

### Interpreting Results

#### Key Metrics to Monitor

1. **HTTP Request Duration**: Response time for API requests
   - `http_req_duration`: Average response time
   - `http_req_duration{quantile:0.95}`: 95th percentile
   - `http_req_duration{quantile:0.99}`: 99th percentile

2. **HTTP Request Failure Rate**: Percentage of failed requests
   - `http_req_failed`: Failure rate (0.0 = 0%, 1.0 = 100%)

3. **Virtual Users**: Number of concurrent users
   - `vus`: Current virtual users
   - `vus_max`: Maximum virtual users

4. **Iterations**: Number of test iterations completed
   - `iterations`: Total iterations
   - `iterations_duration`: Average iteration duration

5. **Data Transfer**: Network usage
   - `data_received`: Bytes received
   - `data_sent`: Bytes sent

#### Example Output

```text
     ✓ status is 200
     ✓ response has body
     ✓ response time < 2000ms

     checks.........................: 95.00% ✓ 1900      ✗ 100
     data_received..................: 2.5 MB  104 kB/s
     data_sent......................: 1.2 MB  50 kB/s
     http_req_duration..............: avg=450ms  min=120ms  med=380ms  max=2100ms  p(90)=750ms  p(95)=950ms  p(99)=1800ms
     http_req_failed................: 0.50%  ✓ 100      ✗ 19900
     http_reqs......................: 20000  833.33/s
     iteration_duration.............: avg=850ms  min=250ms  med=700ms  max=3500ms  p(90)=1400ms  p(95)=1800ms  p(99)=2800ms
     iterations.....................: 20000  833.33/s
     vus............................: 50     min=50      max=50
     vus_max........................: 50      min=50      max=50
```

## Customizing Tests

### Changing Base URL

Set the `BASE_URL` environment variable:

```bash
BASE_URL=http://localhost:8000 k6 run scenarios/baseline/baseline.js
```

Or modify `lib/constants.js`:

```javascript
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
```

### Changing Test Credentials

Set environment variables:

```bash
TEST_EMAIL=your@email.com TEST_PASSWORD=yourpassword k6 run scenarios/baseline/baseline.js
```

Or modify `lib/constants.js`:

```javascript
export const TEST_CREDENTIALS = {
  email: __ENV.TEST_EMAIL || 'loadtest@pulse.com',
  password: __ENV.TEST_PASSWORD || 'LoadTest123!',
  username: __ENV.TEST_USERNAME || 'loadtester',
};
```

### Adjusting Thresholds

Modify `config/thresholds.js` to adjust performance thresholds:

```javascript
export const defaultThresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
  // ... more thresholds
};
```

### Modifying Test Scenarios

Edit the scenario files in `scenarios/` directory to adjust:
- Virtual users count
- Test duration
- Ramp-up/ramp-down patterns

Example (`scenarios/baseline/baseline.js`):

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 20 }, // Increased from 10 to 20 VUs
    { duration: '3m', target: 20 }, // Longer duration
    { duration: '1m', target: 0 },
  ],
  thresholds: defaultThresholds,
};
```

## Troubleshooting

### Login Failures / Rate Limiting

If you see "Failed to login" or "RATE_LIMIT_EXCEEDED" errors:

1. **Create test user account** (if not already created):
   ```bash
   # Create test user via API
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "loadtest@pulse.com",
       "username": "loadtester",
       "password": "LoadTest123!",
       "displayName": "Load Tester"
     }'
   ```

2. **Wait for rate limit to reset**: If you've hit rate limits, wait 60-90 seconds before running tests again. The tests now include:
   - 15-second initial delay before starting
   - Token caching (reuses tokens for 200 iterations)
   - Automatic retry with exponential backoff (5s, 10s, 20s)
   - 60-second cooldown if rate limited

3. **Use environment variables** to set custom credentials:
   ```bash
   export TEST_EMAIL=your@email.com
   export TEST_PASSWORD=YourPassword123!
   export TEST_USERNAME=yourusername
   ```

**Note**: The tests are configured to be very conservative to avoid rate limiting:
- 1 VU maximum
- 5-10 second delays between iterations
- Token caching to minimize login attempts
- Automatic rate limit handling

If you still hit rate limits, wait 60 seconds and try again.

### k6 Command Not Found

Ensure k6 is installed and in your PATH:

```bash
which k6
k6 version
```

### Connection Refused

Ensure all services are running:

```bash
make health-check
```

Verify Kong Gateway is accessible:

```bash
curl http://localhost:8000/health
```

### High CPU Usage / Overheating

The tests have been configured with reduced load for laptop safety:
- Baseline: 2 VUs
- Stress: 5-10 VUs
- Spike: 5-8 VUs
- Soak: 3 VUs

If you still experience overheating, you can further reduce load by:
1. Decreasing VU counts in `config/options.js`
2. Increasing sleep times in `lib/helpers.js` (currently 2-5 seconds)
3. Running tests one scenario at a time

### High Error Rates

- Check service logs: `make logs`
- Verify database connections
- Check resource usage (CPU, memory)
- Review Kong Gateway logs

### Slow Response Times

- Monitor service health
- Check database performance
- Review network latency
- Verify Kong Gateway configuration

## Best Practices

1. **Start with Baseline Tests**: Always run baseline tests first to establish a performance baseline

2. **Run Tests in Isolation**: Close other applications to get accurate results

3. **Monitor System Resources**: Watch CPU, memory, and network usage during tests

4. **Review Results**: Analyze both JSON summaries and CSV metrics for detailed insights

5. **Gradual Load Increase**: For stress tests, gradually increase load to identify breaking points

6. **Regular Testing**: Run load tests regularly, especially after major changes

7. **Test in Production-like Environment**: Use similar resources and configurations as production

## Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 JavaScript API](https://k6.io/docs/javascript-api/)
- [k6 Metrics Reference](https://k6.io/docs/using-k6/metrics/)
- [k6 Thresholds Guide](https://k6.io/docs/using-k6/thresholds/)

## Support

For issues or questions:
1. Check service logs: `make logs`
2. Review k6 output for error messages
3. Verify service health: `make health-check`
4. Check Kong Gateway status

