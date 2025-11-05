import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, ENDPOINTS, HEADERS, TEST_CREDENTIALS } from '../lib/constants.js';
import { login, authenticatedRequest } from '../lib/auth.js';
import { validateJsonResponse, extractData, randomSleep } from '../lib/helpers.js';

/**
 * Social Service Load Tests
 * Tests: follow/unfollow, get followers/following, get recommendations
 */
export function socialTests() {
  const token = login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
  
  if (!token) {
    console.error('Failed to login, skipping social tests');
    return;
  }

  // Get social recommendations
  const recommendationsUrl = `${BASE_URL}${ENDPOINTS.SOCIAL.RECOMMENDATIONS}?limit=10`;
  const recommendationsResponse = authenticatedRequest('GET', recommendationsUrl, token.accessToken, null, {
    tags: { name: 'Social_GetRecommendations' },
  });
  // Accept 200 or 404 (no recommendations)
  validateJsonResponse(recommendationsResponse, 200, [404]);
  const recommendations = recommendationsResponse.status === 200 ? extractData(recommendationsResponse, 'data.recommendations') : null;
  const recommendedUser = recommendations && recommendations.length > 0 ? recommendations[0] : null;
  const userId = recommendedUser ? recommendedUser.id : null;

  if (userId) {
    // Get follow status
    const statusUrl = `${BASE_URL}${ENDPOINTS.SOCIAL.STATUS(userId)}`;
    const statusResponse = authenticatedRequest('GET', statusUrl, token.accessToken, null, {
      tags: { name: 'Social_GetStatus' },
    });
    validateJsonResponse(statusResponse, 200);
    const status = extractData(statusResponse, 'data');
    const isFollowing = status ? status.isFollowing : false;

    // Follow user (if not already following)
    if (!isFollowing) {
      const followUrl = `${BASE_URL}${ENDPOINTS.SOCIAL.FOLLOW(userId)}`;
      const followResponse = authenticatedRequest('POST', followUrl, token.accessToken, null, {
        tags: { name: 'Social_Follow' },
      });
      validateJsonResponse(followResponse, 200);
    }

    // Get followers
    const followersUrl = `${BASE_URL}${ENDPOINTS.SOCIAL.FOLLOWERS(userId)}?page=1&limit=10`;
    const followersResponse = authenticatedRequest('GET', followersUrl, token.accessToken, null, {
      tags: { name: 'Social_GetFollowers' },
    });
    validateJsonResponse(followersResponse, 200);

    // Get following
    const followingUrl = `${BASE_URL}${ENDPOINTS.SOCIAL.FOLLOWING(userId)}?page=1&limit=10`;
    const followingResponse = authenticatedRequest('GET', followingUrl, token.accessToken, null, {
      tags: { name: 'Social_GetFollowing' },
    });
    validateJsonResponse(followingResponse, 200);

    // Get social stats
    const statsUrl = `${BASE_URL}${ENDPOINTS.SOCIAL.STATS(userId)}`;
    const statsResponse = authenticatedRequest('GET', statsUrl, token.accessToken, null, {
      tags: { name: 'Social_GetStats' },
    });
    validateJsonResponse(statsResponse, 200);

    // Unfollow user (cleanup)
    if (!isFollowing) {
      const unfollowUrl = `${BASE_URL}${ENDPOINTS.SOCIAL.UNFOLLOW(userId)}`;
      const unfollowResponse = authenticatedRequest('DELETE', unfollowUrl, token.accessToken, null, {
        tags: { name: 'Social_Unfollow' },
      });
      validateJsonResponse(unfollowResponse, 200);
    }
  }

  randomSleep(0.5, 1.5);
}

export default function () {
  socialTests();
}

