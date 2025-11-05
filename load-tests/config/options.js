// k6 Options Configuration
// This file provides reusable configuration options for different test scenarios

/**
 * Baseline test options - normal load (reduced for laptop safety)
 */
export function getBaselineOptions(thresholds = {}) {
  return {
    stages: [
      { duration: '30s', target: 1 }, // Ramp up to 1 VU quickly
      { duration: '1m', target: 1 }, // Stay at 1 VU for 1 minute
      { duration: '10s', target: 0 }, // Ramp down
    ],
    thresholds: thresholds,
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
    summaryTimeUnit: 'ms',
    // Add max iterations to limit total requests
    maxRedirects: 0,
  };
}

/**
 * Stress test options - find breaking point (reduced for laptop safety)
 */
export function getStressOptions(thresholds = {}) {
  return {
    stages: [
      { duration: '1m', target: 5 }, // Ramp up to 5 VUs
      { duration: '2m', target: 5 }, // Stay at 5 VUs
      { duration: '1m', target: 10 }, // Ramp up to 10 VUs
      { duration: '2m', target: 10 }, // Stay at 10 VUs
      { duration: '1m', target: 0 }, // Ramp down
    ],
    thresholds: thresholds,
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
    summaryTimeUnit: 'ms',
  };
}

/**
 * Spike test options - sudden load increase (reduced for laptop safety)
 */
export function getSpikeOptions(thresholds = {}) {
  return {
    stages: [
      { duration: '10s', target: 5 }, // Sudden spike to 5 VUs
      { duration: '30s', target: 5 }, // Stay at 5 VUs
      { duration: '10s', target: 0 }, // Sudden drop
      { duration: '30s', target: 0 }, // Recovery period
      { duration: '10s', target: 8 }, // Another spike to 8 VUs
      { duration: '30s', target: 8 }, // Stay at 8 VUs
      { duration: '10s', target: 0 }, // Drop
    ],
    thresholds: thresholds,
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
    summaryTimeUnit: 'ms',
  };
}

/**
 * Soak test options - sustained load (reduced for laptop safety)
 */
export function getSoakOptions(thresholds = {}) {
  return {
    stages: [
      { duration: '1m', target: 3 }, // Ramp up to 3 VUs
      { duration: '5m', target: 3 }, // Stay at 3 VUs for 5 minutes
      { duration: '1m', target: 0 }, // Ramp down
    ],
    thresholds: thresholds,
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
    summaryTimeUnit: 'ms',
  };
}

/**
 * Custom options helper
 */
export function getCustomOptions(stages, thresholds = {}) {
  return {
    stages: stages,
    thresholds: thresholds,
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
    summaryTimeUnit: 'ms',
  };
}

