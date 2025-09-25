const request = require('supertest');
const app = require('../src/app');
const oauthService = require('../src/services/oauthService');
const authService = require('../src/services/authService');

describe('OAuth Integration Tests', () => {
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPass123!',
    displayName: 'Test User',
  };

  let accessToken;
  let userId;

  beforeEach(async () => {
    // Clean up before each test
    await global.prisma.userFollow.deleteMany();
    await global.prisma.user.deleteMany();

    // Create test user
    const user = await authService.register(testUser);
    userId = user.id;

    // Login to get access token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    accessToken = loginResponse.body.data.accessToken;
  });

  describe('GET /api/v1/auth/providers', () => {
    it('should get OAuth providers for current user', async () => {
      const response = await request(app)
        .get('/api/v1/auth/providers')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.providers).toBeDefined();
      expect(Array.isArray(response.body.data.providers)).toBe(true);
      
      // Should have LOCAL provider (linked) and GOOGLE provider (not linked)
      const localProvider = response.body.data.providers.find(p => p.provider === 'LOCAL');
      const googleProvider = response.body.data.providers.find(p => p.provider === 'GOOGLE');
      
      expect(localProvider).toBeDefined();
      expect(localProvider.linked).toBe(true);
      
      expect(googleProvider).toBeDefined();
      expect(googleProvider.linked).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/auth/providers')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('OAuth Service Tests', () => {
    it('should link Google account successfully', async () => {
      const mockGoogleProfile = {
        id: 'google123',
        emails: [{ value: testUser.email }],
        displayName: 'Test User',
        photos: [{ value: 'https://example.com/avatar.jpg' }],
      };

      const result = await oauthService.linkGoogleAccount(userId, mockGoogleProfile);

      expect(result.provider).toBe('GOOGLE');
      expect(result.providerId).toBe('google123');
      expect(result.verified).toBe(true);
    });

    it('should fail to link Google account if already linked to another user', async () => {
      // Create another user
      const anotherUser = await authService.register({
        email: 'another@example.com',
        username: 'anotheruser',
        password: 'TestPass123!',
        displayName: 'Another User',
      });

      const mockGoogleProfile = {
        id: 'google123',
        emails: [{ value: 'another@example.com' }],
        displayName: 'Another User',
      };

      // Link to first user
      await oauthService.linkGoogleAccount(userId, mockGoogleProfile);

      // Try to link to second user (should fail)
      await expect(
        oauthService.linkGoogleAccount(anotherUser.id, mockGoogleProfile)
      ).rejects.toThrow('Google account is already linked to another user');
    });

    it('should unlink Google account successfully', async () => {
      // First link the account
      const mockGoogleProfile = {
        id: 'google123',
        emails: [{ value: testUser.email }],
        displayName: 'Test User',
      };

      await oauthService.linkGoogleAccount(userId, mockGoogleProfile);

      // Then unlink it
      const result = await oauthService.unlinkGoogleAccount(userId);

      expect(result.provider).toBe('LOCAL');
      expect(result.providerId).toBeNull();
    });

    it('should fail to unlink Google account without password', async () => {
      // Create a Google-only user (no password)
      const googleUser = await authService.register({
        email: 'google@example.com',
        username: 'googleuser',
        displayName: 'Google User',
        provider: 'GOOGLE',
        providerId: 'google456',
      });

      // Try to unlink (should fail)
      await expect(
        oauthService.unlinkGoogleAccount(googleUser.id)
      ).rejects.toThrow('Cannot unlink Google account without setting a password first');
    });

    it('should get OAuth providers correctly', async () => {
      const providers = await oauthService.getOAuthProviders(userId);

      expect(providers).toHaveLength(2);
      
      const localProvider = providers.find(p => p.provider === 'LOCAL');
      const googleProvider = providers.find(p => p.provider === 'GOOGLE');
      
      expect(localProvider.linked).toBe(true);
      expect(googleProvider.linked).toBe(false);
    });
  });

  describe('Google OAuth Flow Simulation', () => {
    it('should handle Google OAuth callback successfully', async () => {
      const mockGoogleUser = {
        id: 'google789',
        email: 'googleuser@example.com',
        username: 'googleuser',
        displayName: 'Google User',
        avatarUrl: 'https://example.com/avatar.jpg',
        verified: true,
        status: 'ACTIVE',
        provider: 'GOOGLE',
        providerId: 'google789',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await oauthService.generateTokensForOAuthUser(mockGoogleUser);

      expect(result.user.provider).toBe('GOOGLE');
      expect(result.user.providerId).toBe('google789');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBeDefined();
    });
  });
});
