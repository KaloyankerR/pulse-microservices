import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, ENDPOINTS, HEADERS, TEST_CREDENTIALS } from '../lib/constants.js';
import { login, register, getCurrentUser, refreshToken } from '../lib/auth.js';
import { randomEmail, randomUsername, validateJsonResponse, randomSleep } from '../lib/helpers.js';

/**
 * Auth Service Load Tests
 * Tests: login, register, refresh token, get current user
 */
export function authTests() {
  const token = login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
  
  if (!token) {
    console.error('Failed to login, skipping auth tests');
    return;
  }

  // Get current user
  const user = getCurrentUser(token.accessToken);
  check(user, {
    'get current user successful': (u) => u !== null,
    'current user has id': (u) => u && u.id !== undefined,
  });

  // Test refresh token
  const refreshed = refreshToken(token.refreshToken);
  check(refreshed, {
    'refresh token successful': (r) => r !== null,
    'refresh token has access token': (r) => r && r.accessToken !== undefined,
  });

  randomSleep(0.5, 1.5);
}

/**
 * Register new user test
 */
export function registerTest() {
  const email = randomEmail();
  const username = randomUsername();
  const password = 'TestPassword123!';

  const url = `${BASE_URL}${ENDPOINTS.AUTH.REGISTER}`;
  const payload = JSON.stringify({
    email: email,
    username: username,
    password: password,
    displayName: username,
  });

  const response = http.post(url, payload, {
    headers: HEADERS.JSON,
    tags: { name: 'Auth_Register' },
  });

  validateJsonResponse(response, 201);
  randomSleep(0.5, 1.5);
}

export default function () {
  authTests();
}

