const request = require('supertest');
const app = require('../src/app');
const authService = require('../src/services/authService');
const userService = require('../src/services/userService');

describe('User Management Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPass123!',
    displayName: 'Test User',
  };

  const testUser2 = {
    email: 'test2@example.com',
    username: 'testuser2',
    password: 'TestPass123!',
    displayName: 'Test User 2',
  };

  let accessToken;
  let user1Id;
  let user2Id;

  beforeEach(async () => {
    // Clean up before each test
    await global.prisma.userFollow.deleteMany();
    await global.prisma.user.deleteMany();

    // Create test users
    const user1 = await authService.register(testUser);
    const user2 = await authService.register(testUser2);
    
    user1Id = user1.id;
    user2Id = user2.id;

    // Login to get access token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    accessToken = loginResponse.body.data.accessToken;
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${user2Id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user2Id);
      expect(response.body.data.user.username).toBe(testUser2.username);
      expect(response.body.data.user.isFollowing).toBe(false);
    });

    it('should get user by ID without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${user2Id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user2Id);
      expect(response.body.data.user.isFollowing).toBeUndefined();
    });

    it('should fail with non-existent user ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update own profile successfully', async () => {
      const updateData = {
        displayName: 'Updated Display Name',
        bio: 'Updated bio',
      };

      const response = await request(app)
        .put(`/api/v1/users/${user1Id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.displayName).toBe(updateData.displayName);
      expect(response.body.data.user.bio).toBe(updateData.bio);
    });

    it('should fail to update another user\'s profile', async () => {
      const updateData = {
        displayName: 'Hacked Name',
      };

      const response = await request(app)
        .put(`/api/v1/users/${user2Id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should fail without authentication', async () => {
      const updateData = {
        displayName: 'Updated Name',
      };

      const response = await request(app)
        .put(`/api/v1/users/${user1Id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete own account successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${user1Id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('User account deleted successfully');

      // Verify user is deleted
      const getUserResponse = await request(app)
        .get(`/api/v1/users/${user1Id}`)
        .expect(404);

      expect(getUserResponse.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should fail to delete another user\'s account', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${user2Id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/users/search', () => {
    it('should search users successfully', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'testuser' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.pagination.totalCount).toBe(2);
    });

    it('should search users with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'testuser', page: 1, limit: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.pagination.totalCount).toBe(2);
      expect(response.body.data.pagination.hasNext).toBe(true);
    });

    it('should return empty results for non-matching query', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .query({ q: 'nonexistent' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(0);
      expect(response.body.data.pagination.totalCount).toBe(0);
    });

    it('should fail without search query', async () => {
      const response = await request(app)
        .get('/api/v1/users/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/users/:id/follow', () => {
    it('should follow user successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('User followed successfully');

      // Verify follow relationship
      const followStatus = await userService.getFollowStatus(user1Id, user2Id);
      expect(followStatus.isFollowing).toBe(true);
    });

    it('should fail to follow self', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${user1Id}/follow`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CANNOT_FOLLOW_SELF');
    });

    it('should fail to follow non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .post(`/api/v1/users/${fakeId}/follow`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${user2Id}/follow`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('DELETE /api/v1/users/:id/follow', () => {
    beforeEach(async () => {
      // Create follow relationship
      await userService.followUser(user1Id, user2Id);
    });

    it('should unfollow user successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('User unfollowed successfully');

      // Verify follow relationship is removed
      const followStatus = await userService.getFollowStatus(user1Id, user2Id);
      expect(followStatus.isFollowing).toBe(false);
    });

    it('should fail to unfollow when not following', async () => {
      // Try to unfollow again
      const response = await request(app)
        .delete(`/api/v1/users/${user2Id}/follow`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOLLOWING');
    });
  });

  describe('GET /api/v1/users/:id/follow-status', () => {
    it('should return false when not following', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${user2Id}/follow-status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isFollowing).toBe(false);
    });

    it('should return true when following', async () => {
      // Create follow relationship
      await userService.followUser(user1Id, user2Id);

      const response = await request(app)
        .get(`/api/v1/users/${user2Id}/follow-status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isFollowing).toBe(true);
    });
  });

  describe('GET /api/v1/users/:id/followers', () => {
    beforeEach(async () => {
      // Create follow relationship
      await userService.followUser(user1Id, user2Id);
    });

    it('should get followers successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${user2Id}/followers`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.followers).toHaveLength(1);
      expect(response.body.data.followers[0].id).toBe(user1Id);
      expect(response.body.data.pagination.totalCount).toBe(1);
    });
  });

  describe('GET /api/v1/users/:id/following', () => {
    beforeEach(async () => {
      // Create follow relationship
      await userService.followUser(user1Id, user2Id);
    });

    it('should get following successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${user1Id}/following`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.following).toHaveLength(1);
      expect(response.body.data.following[0].id).toBe(user2Id);
      expect(response.body.data.pagination.totalCount).toBe(1);
    });
  });
});
