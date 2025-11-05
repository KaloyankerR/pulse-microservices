import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, ENDPOINTS, HEADERS, TEST_CREDENTIALS } from '../lib/constants.js';
import { login, authenticatedRequest } from '../lib/auth.js';
import { validateJsonResponse, extractData, randomSleep, randomString } from '../lib/helpers.js';

/**
 * User Service Load Tests
 * Tests: get profile, update profile, search users, follow/unfollow, get followers
 */
export function userTests() {
  const token = login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
  
  if (!token) {
    console.error('Failed to login, skipping user tests');
    return;
  }

  // Get current user profile
  const profileUrl = `${BASE_URL}${ENDPOINTS.USER.PROFILE}`;
  const profileResponse = authenticatedRequest('GET', profileUrl, token.accessToken, null, {
    tags: { name: 'User_GetProfile' },
  });
  validateJsonResponse(profileResponse, 200);
  const user = extractData(profileResponse, 'data.user');
  const userId = user ? user.id : null;

  if (userId) {
    // Update profile
    const updateUrl = `${BASE_URL}${ENDPOINTS.USER.UPDATE_PROFILE}`;
    const updatePayload = {
      displayName: `Load Tester ${randomString(5)}`,
      bio: 'Load testing user profile',
    };
    const updateResponse = authenticatedRequest('PUT', updateUrl, token.accessToken, updatePayload, {
      tags: { name: 'User_UpdateProfile' },
    });
    validateJsonResponse(updateResponse, 200);

    // Search users
    const searchUrl = `${BASE_URL}${ENDPOINTS.USER.SEARCH}?q=test&page=1&limit=10`;
    const searchResponse = authenticatedRequest('GET', searchUrl, token.accessToken, null, {
      tags: { name: 'User_Search' },
    });
    validateJsonResponse(searchResponse, 200);

    // Get user by ID
    const getUserUrl = `${BASE_URL}${ENDPOINTS.USER.GET_BY_ID(userId)}`;
    const getUserResponse = authenticatedRequest('GET', getUserUrl, token.accessToken, null, {
      tags: { name: 'User_GetById' },
    });
    validateJsonResponse(getUserResponse, 200);

    // Get followers
    const followersUrl = `${BASE_URL}${ENDPOINTS.USER.FOLLOWERS(userId)}?page=1&limit=10`;
    const followersResponse = authenticatedRequest('GET', followersUrl, token.accessToken, null, {
      tags: { name: 'User_GetFollowers' },
    });
    validateJsonResponse(followersResponse, 200);

    // Get following
    const followingUrl = `${BASE_URL}${ENDPOINTS.USER.FOLLOWING(userId)}?page=1&limit=10`;
    const followingResponse = authenticatedRequest('GET', followingUrl, token.accessToken, null, {
      tags: { name: 'User_GetFollowing' },
    });
    validateJsonResponse(followingResponse, 200);
  }

  randomSleep(0.5, 1.5);
}

export default function () {
  userTests();
}

