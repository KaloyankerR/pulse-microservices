const request = require('supertest');
const app = require('../src/app');
const authService = require('../src/services/authService');
const BcryptUtil = require('../src/utils/bcrypt');

describe('Authentication Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPass123!',
    displayName: 'Test User',
  };

  beforeEach(async () => {
    // Clean up before each test
    await global.prisma.userFollow.deleteMany();
    await global.prisma.user.deleteMany();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: testUser.email,
        username: testUser.username,
        displayName: testUser.displayName,
        verified: false,
        status: 'ACTIVE',
      });
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should fail with weak password', async () => {
      const weakPasswordUser = {
        ...testUser,
        password: 'weak',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('WEAK_PASSWORD');
    });

    it('should fail with duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      // Try to create second user with same email
      const duplicateUser = {
        ...testUser,
        username: 'differentuser',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should fail with duplicate username', async () => {
      // Create first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      // Try to create second user with same username
      const duplicateUser = {
        ...testUser,
        email: 'different@example.com',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should fail with invalid email format', async () => {
      const invalidEmailUser = {
        ...testUser,
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidEmailUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await authService.register(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.expiresIn).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.expiresIn).toBeDefined();
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.username).toBe(testUser.username);
    });

    it('should fail without authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
