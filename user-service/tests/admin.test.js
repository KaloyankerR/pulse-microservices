const request = require('supertest');
const app = require('../src/app');
const authService = require('../src/services/authService');

describe('Admin Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPass123!',
    displayName: 'Test User',
  };

  const adminUser = {
    email: 'admin@pulse.com',
    username: 'admin',
    password: 'admin123',
    displayName: 'Admin User',
  };

  let userAccessToken;
  let adminAccessToken;
  let testUserId;
  let adminUserId;

  beforeEach(async () => {
    // Clean up before each test
    await global.prisma.userFollow.deleteMany();
    await global.prisma.user.deleteMany();

    // Create test user
    const user = await authService.register(testUser);
    testUserId = user.id;

    // Create admin user
    const admin = await authService.register(adminUser);
    adminUserId = admin.id;

    // Login as test user
    const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });
    userAccessToken = userLoginResponse.body.data.accessToken;

    // Login as admin user
    const adminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password,
      });
    adminAccessToken = adminLoginResponse.body.data.accessToken;
  });

  describe('GET /api/v1/admin/users', () => {
    it('should get all users as admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.pagination.totalCount).toBe(2);
    });

    it('should get users with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.pagination.totalCount).toBe(2);
      expect(response.body.data.pagination.hasNext).toBe(true);
    });

    it('should fail for non-admin user', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/v1/admin/users/:id/status', () => {
    it('should update user status as admin', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'SUSPENDED' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.status).toBe('SUSPENDED');
    });

    it('should update user status to ACTIVE', async () => {
      // First suspend the user
      await request(app)
        .put(`/api/v1/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'SUSPENDED' });

      // Then activate
      const response = await request(app)
        .put(`/api/v1/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.status).toBe('ACTIVE');
    });

    it('should fail with invalid status', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'INVALID' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail for non-admin user', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ status: 'SUSPENDED' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${testUserId}/status`)
        .send({ status: 'SUSPENDED' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should fail with non-existent user ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .put(`/api/v1/admin/users/${fakeId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'SUSPENDED' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});
