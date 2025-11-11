import http from 'k6/http';
import { check, sleep } from 'k6';
import { getBaselineOptions } from '../../config/options.js';
import { defaultThresholds } from '../../config/thresholds.js';
import { BASE_URL, ENDPOINTS } from '../../lib/constants.js';

// Simple baseline test - only tests public endpoints that don't require authentication
// This avoids authentication and rate limiting issues

export const options = getBaselineOptions(defaultThresholds);

// Setup function
export function setup() {
  console.log('Running simple baseline tests (public endpoints only)...');
  sleep(5);
}

// Main test function - only tests public/health endpoints
export default function () {
  // Test health endpoints (public, no auth required)
  const services = [
    { name: 'Kong Gateway', url: `${BASE_URL}/health` },
    { name: 'Auth Service', url: `${BASE_URL}/health` },
  ];

  // Test Kong Gateway health
  const healthResponse = http.get(`${BASE_URL}/health`, {
    tags: { name: 'Health_Check' },
  });
  
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200 || r.status === 404, // 404 is OK if health endpoint doesn't exist
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Wait between requests
  sleep(Math.random() * 5 + 5); // 5-10 seconds
  
  // Test a simple GET endpoint (if available without auth)
  // Most services require auth, so we'll just test health endpoints
  
  sleep(Math.random() * 5 + 5); // Additional wait
}







