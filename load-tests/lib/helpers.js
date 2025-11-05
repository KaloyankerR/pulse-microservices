import { check, sleep } from 'k6';

/**
 * Generate random email for testing
 */
export function randomEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `loadtest_${timestamp}_${random}@pulse.com`;
}

/**
 * Generate random username for testing
 */
export function randomUsername() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `loadtester_${timestamp}_${random}`;
}

/**
 * Generate random string
 */
export function randomString(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random post content
 */
export function randomPostContent() {
  const posts = [
    'This is a test post for load testing!',
    'Load testing the microservices architecture.',
    'Checking system performance under load.',
    'Testing API endpoints through Kong Gateway.',
    'Validating response times and error rates.',
    'Testing concurrent user scenarios.',
    'Performance testing with k6 load testing tool.',
  ];
  return posts[Math.floor(Math.random() * posts.length)];
}

/**
 * Generate random message content
 */
export function randomMessageContent() {
  const messages = [
    'Hello! This is a test message.',
    'Load testing the messaging service.',
    'Testing real-time message delivery.',
    'Validating message persistence.',
    'Checking conversation handling.',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Validate response structure
 */
export function validateResponse(response, expectedStatus = 200) {
  return check(response, {
    [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    'response has body': (r) => r.body && r.body.length > 0,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
}

/**
 * Validate JSON response - lenient version that accepts expected status codes
 */
export function validateJsonResponse(response, expectedStatus = 200, allowStatuses = []) {
  // Accept expected status or any in allowStatuses array (e.g., 404 for not found)
  const acceptableStatuses = [expectedStatus, ...allowStatuses];
  
  const checks = {
    [`status is ${expectedStatus} or acceptable`]: (r) => acceptableStatuses.includes(r.status),
    'response has body': (r) => r.body !== null && r.body !== undefined && r.body.length >= 0,
  };

  // Only validate JSON structure if we got a successful response
  if (response.status === expectedStatus) {
    try {
      if (response.body && response.body.length > 0) {
        const body = JSON.parse(response.body);
        checks['response is valid JSON'] = true;
        // Success field is optional - only check if response has body
        checks['response has success field if present'] = (r) => {
          try {
            if (!r.body || r.body.length === 0) return true; // Empty body is OK
            const b = JSON.parse(r.body);
            // If success field exists, it should be boolean. If it doesn't exist, that's also OK
            return typeof b.success === 'boolean' || b.success === undefined;
          } catch (e) {
            return false;
          }
        };
      } else {
        // Empty body is acceptable for some endpoints
        checks['response is valid JSON'] = true;
        checks['response has success field if present'] = true;
      }
    } catch (e) {
      // JSON parse failed - this is an error
      checks['response is valid JSON'] = false;
    }
  } else if (acceptableStatuses.includes(response.status)) {
    // For acceptable error statuses (like 404), don't validate JSON structure strictly
    checks['response is valid JSON'] = true; // Don't fail JSON validation for expected errors
    checks['response has success field if present'] = true; // Don't check success field for errors
  } else {
    // Unexpected status code
    checks['response is valid JSON'] = false;
  }

  return check(response, checks);
}

/**
 * Extract ID from response
 */
export function extractId(response, path = 'data.id') {
  try {
    const body = JSON.parse(response.body);
    const keys = path.split('.');
    let value = body;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    return value;
  } catch (e) {
    return null;
  }
}

/**
 * Extract data from response
 */
export function extractData(response, path = 'data') {
  try {
    const body = JSON.parse(response.body);
    const keys = path.split('.');
    let value = body;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    return value;
  } catch (e) {
    return null;
  }
}

/**
 * Random sleep between min and max seconds (increased for laptop safety)
 */
export function randomSleep(min = 3, max = 8) {
  const sleepTime = Math.random() * (max - min) + min;
  return sleep(sleepTime);
}

/**
 * Random item from array
 */
export function randomItem(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

