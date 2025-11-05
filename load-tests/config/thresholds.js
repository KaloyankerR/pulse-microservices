// Performance thresholds for k6 tests

export const defaultThresholds = {
  // HTTP-specific thresholds
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms, 99% under 1s
  // More lenient failure rate for baseline - accepts 404s and other expected errors
  http_req_failed: ['rate<0.20'], // Less than 20% of requests should fail (includes acceptable 404s)
  http_req_waiting: ['p(95)<400'], // 95% of requests wait less than 400ms
  http_req_connecting: ['p(95)<50'], // 95% of connections established in < 50ms

  // Iteration thresholds (adjusted for realistic iteration times with actual API calls)
  iteration_duration: ['p(95)<30000'], // 95% of iterations complete in < 30s

  // Data transfer thresholds
  data_received: ['rate>0'], // Must receive some data
  data_sent: ['rate>0'], // Must send some data

  // VU (Virtual User) thresholds
  vus: ['value>0'], // Must have at least 1 VU
};

export const strictThresholds = {
  // Stricter thresholds for baseline tests
  http_req_duration: ['p(95)<300', 'p(99)<600'],
  http_req_failed: ['rate<0.005'], // Less than 0.5% failure rate
  http_req_waiting: ['p(95)<250'],
  http_req_connecting: ['p(95)<30'],
  iteration_duration: ['p(95)<1500'],
};

export const relaxedThresholds = {
  // Relaxed thresholds for stress/spike tests
  http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  http_req_failed: ['rate<0.05'], // Less than 5% failure rate (acceptable under stress)
  http_req_waiting: ['p(95)<1500'],
  http_req_connecting: ['p(95)<100'],
  iteration_duration: ['p(95)<5000'],
};

export const serviceSpecificThresholds = {
  auth: {
    http_req_duration: ['p(95)<400', 'p(99)<800'],
    http_req_failed: ['rate<0.01'],
  },
  user: {
    http_req_duration: ['p(95)<600', 'p(99)<1200'],
    http_req_failed: ['rate<0.01'],
  },
  post: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
  messaging: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.02'], // Slightly more lenient for messaging
  },
  notification: {
    http_req_duration: ['p(95)<400', 'p(99)<800'],
    http_req_failed: ['rate<0.01'],
  },
  social: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
  event: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

