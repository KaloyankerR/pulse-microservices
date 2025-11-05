import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, ENDPOINTS, HEADERS, TEST_CREDENTIALS } from '../lib/constants.js';
import { login, authenticatedRequest } from '../lib/auth.js';
import { validateJsonResponse, extractId, extractData, randomPostContent, randomSleep } from '../lib/helpers.js';

/**
 * Post Service Load Tests
 * Tests: get posts, create post, like/unlike, get comments
 */
export function postTests() {
  const token = login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
  
  if (!token) {
    console.error('Failed to login, skipping post tests');
    return;
  }

  // Get all posts
  const listUrl = `${BASE_URL}${ENDPOINTS.POST.LIST}?page=0&size=10`;
  const listResponse = authenticatedRequest('GET', listUrl, token.accessToken, null, {
    tags: { name: 'Post_GetAll' },
  });
  // Accept 200 or 404 (empty list)
  validateJsonResponse(listResponse, 200, [404]);
  const posts = listResponse.status === 200 ? extractData(listResponse, 'posts') : null;
  const firstPost = posts && posts.length > 0 ? posts[0] : null;
  const firstPostId = firstPost ? firstPost.id : null;

  // Create a new post
  const createUrl = `${BASE_URL}${ENDPOINTS.POST.CREATE}`;
  const createPayload = {
    content: randomPostContent(),
  };
  const createResponse = authenticatedRequest('POST', createUrl, token.accessToken, createPayload, {
    tags: { name: 'Post_Create' },
  });
  validateJsonResponse(createResponse, 201);
  const newPostId = extractId(createResponse, 'id');

  if (firstPostId) {
    // Get post by ID
    const getPostUrl = `${BASE_URL}${ENDPOINTS.POST.GET_BY_ID(firstPostId)}`;
    const getPostResponse = authenticatedRequest('GET', getPostUrl, token.accessToken, null, {
      tags: { name: 'Post_GetById' },
    });
    validateJsonResponse(getPostResponse, 200);

    // Like post
    const likeUrl = `${BASE_URL}${ENDPOINTS.POST.LIKE(firstPostId)}`;
    const likeResponse = authenticatedRequest('POST', likeUrl, token.accessToken, null, {
      tags: { name: 'Post_Like' },
    });
    check(likeResponse, {
      'like post status is 204 or 200': (r) => r.status === 204 || r.status === 200,
    });

    // Get comments for post
    const commentsUrl = `${BASE_URL}${ENDPOINTS.POST.COMMENTS(firstPostId)}`;
    const commentsResponse = authenticatedRequest('GET', commentsUrl, token.accessToken, null, {
      tags: { name: 'Post_GetComments' },
    });
    // Accept 200 or 404 (no comments)
    validateJsonResponse(commentsResponse, 200, [404]);
  }

  if (newPostId) {
    // Like the new post first
    const likeNewPostUrl = `${BASE_URL}${ENDPOINTS.POST.LIKE(newPostId)}`;
    const likeNewPostResponse = authenticatedRequest('POST', likeNewPostUrl, token.accessToken, null, {
      tags: { name: 'Post_LikeNewPost' },
    });
    const likedSuccessfully = likeNewPostResponse.status === 204 || likeNewPostResponse.status === 200;
    
    // Then unlike it if we successfully liked it
    if (likedSuccessfully) {
      const unlikeUrl = `${BASE_URL}${ENDPOINTS.POST.UNLIKE(newPostId)}`;
      const unlikeResponse = authenticatedRequest('DELETE', unlikeUrl, token.accessToken, null, {
        tags: { name: 'Post_Unlike' },
      });
      check(unlikeResponse, {
        'unlike post status is 204 or 200': (r) => r.status === 204 || r.status === 200,
      });
    }
  }

  randomSleep(0.5, 1.5);
}

export default function () {
  postTests();
}

