import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, ENDPOINTS, HEADERS } from './constants.js';

// Token cache per VU (persists across iterations)
const tokenCache = new Map();

/**
 * Login and get access token with caching and rate limit handling
 */
export function login(email, password) {
  // Check cache first (per VU)
  const cacheKey = `${__VU}_${email}`;
  
  // Check if we're currently rate limited - if so, skip login entirely
  const rateLimitKey = `ratelimit_${cacheKey}`;
  if (tokenCache.has(rateLimitKey)) {
    const rateLimit = tokenCache.get(rateLimitKey);
    // Check if rateLimit is null (cleared) or valid
    if (rateLimit && rateLimit.timestamp) {
      const timeSinceRateLimit = (Date.now() - rateLimit.timestamp) / 1000;
      // If rate limited less than 120 seconds ago, skip login entirely
      if (timeSinceRateLimit < 120) {
        console.log(`Skipping login - still in rate limit cooldown (${Math.ceil(120 - timeSinceRateLimit)}s remaining)`);
        return null;
      } else {
        // Cooldown expired, clear rate limit marker
        tokenCache.set(rateLimitKey, null);
      }
    }
  }
  
  if (tokenCache.has(cacheKey)) {
    const cached = tokenCache.get(cacheKey);
    // Check if token is still valid - tokens last 24h, so we'll reuse for many iterations
    // Only refresh if we've used it for more than 200 iterations
    if (cached && (__ITER - cached.iteration) < 200) {
      return cached.token;
    }
  }

  // Add small initial delay to avoid immediate rate limiting
  if (__ITER < 3) {
    sleep(Math.random() * 2 + 2); // 2-4 seconds for first 3 iterations
  } else {
    sleep(Math.random() * 1 + 1); // 1-2 seconds for later iterations
  }

  // Retry logic for rate limiting
  let retries = 3;
  let backoff = 5; // Start with 5 seconds (longer backoff)

  while (retries > 0) {
    const url = `${BASE_URL}${ENDPOINTS.AUTH.LOGIN}`;
    const payload = JSON.stringify({
      email: email,
      password: password,
    });

    const response = http.post(url, payload, {
      headers: HEADERS.JSON,
      tags: { name: 'Auth_Login' },
    });

    // Handle rate limiting (429)
    if (response.status === 429) {
      retries--;
      if (retries > 0) {
        // Log error only once
        if (retries === 3) {
          console.error(`Login rate limited, waiting ${backoff}s before retry...`);
        }
        sleep(backoff);
        backoff *= 2; // Exponential backoff: 5s, 10s, 20s
        continue;
      }
      // All retries exhausted - mark as rate limited and skip for 2 minutes
      console.error(`Login failed after retries. Rate limit active - will skip login attempts for 2 minutes.`);
      
      // Store rate limit info - skip login for next 2 minutes (120 seconds)
      tokenCache.set(`ratelimit_${cacheKey}`, {
        timestamp: Date.now(),
        iteration: __ITER,
      });
      
      return null;
    }

    // Log other errors
    if (response.status !== 200) {
      if (response.status === 401) {
        console.error(`Login failed: Invalid credentials. Please create test user first: make load-test-create-user`);
      } else {
        console.error(`Login failed with status ${response.status}: ${response.body.substring(0, 200)}`);
      }
      return null;
    }

    const success = check(response, {
      'login status is 200': (r) => r.status === 200,
      'login has access token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success && body.data && body.data.accessToken;
        } catch (e) {
          return false;
        }
      },
    });

    if (success) {
      try {
        const body = JSON.parse(response.body);
        const token = {
          accessToken: body.data.accessToken,
          refreshToken: body.data.refreshToken,
          user: body.data.user,
        };
        
        // Cache the token
        tokenCache.set(cacheKey, {
          token: token,
          iteration: __ITER,
        });
        
        return token;
      } catch (e) {
        return null;
      }
    }

    return null;
  }

  return null;
}

/**
 * Register a new user
 */
export function register(email, username, password, displayName = null) {
  const url = `${BASE_URL}${ENDPOINTS.AUTH.REGISTER}`;
  const payload = JSON.stringify({
    email: email,
    username: username,
    password: password,
    displayName: displayName || username,
  });

  const response = http.post(url, payload, {
    headers: HEADERS.JSON,
    tags: { name: 'Auth_Register' },
  });

  const success = check(response, {
    'register status is 201': (r) => r.status === 201,
  });

  return success;
}

/**
 * Get authenticated headers with token
 */
export function getAuthHeaders(token) {
  return {
    ...HEADERS.JSON,
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Make authenticated request
 */
export function authenticatedRequest(method, url, token, body = null, params = {}) {
  const headers = getAuthHeaders(token);
  const options = {
    headers: headers,
    tags: params.tags || {},
  };

  let response;
  switch (method.toUpperCase()) {
    case 'GET':
      response = http.get(url, options);
      break;
    case 'POST':
      response = http.post(url, body ? JSON.stringify(body) : null, options);
      break;
    case 'PUT':
      response = http.put(url, body ? JSON.stringify(body) : null, options);
      break;
    case 'DELETE':
      // k6 doesn't have http.delete, use http.request instead
      response = http.request('DELETE', url, null, options);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }

  return response;
}

/**
 * Refresh access token
 */
export function refreshToken(refreshToken) {
  const url = `${BASE_URL}${ENDPOINTS.AUTH.REFRESH}`;
  const payload = JSON.stringify({
    refreshToken: refreshToken,
  });

  const response = http.post(url, payload, {
    headers: HEADERS.JSON,
    tags: { name: 'Auth_Refresh' },
  });

  const success = check(response, {
    'refresh status is 200': (r) => r.status === 200,
    'refresh has new access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.data && body.data.accessToken;
      } catch (e) {
        return false;
      }
    },
  });

  if (success) {
    try {
      const body = JSON.parse(response.body);
      return {
        accessToken: body.data.accessToken,
        refreshToken: body.data.refreshToken,
      };
    } catch (e) {
      return null;
    }
  }

  return null;
}

/**
 * Get current user profile
 */
export function getCurrentUser(token) {
  const url = `${BASE_URL}${ENDPOINTS.AUTH.ME}`;
  const response = authenticatedRequest('GET', url, token, null, {
    tags: { name: 'Auth_GetCurrentUser' },
  });

  const success = check(response, {
    'get current user status is 200': (r) => r.status === 200,
  });

  if (success) {
    try {
      const body = JSON.parse(response.body);
      return body.data ? body.data.user : null;
    } catch (e) {
      return null;
    }
  }

  return null;
}

