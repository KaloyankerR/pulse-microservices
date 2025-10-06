const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

describe('Authentication Middleware', () => {
  const testUser = global.createMockUser();
  const validToken = jwt.sign(testUser, process.env.JWT_SECRET);
  const invalidToken = 'invalid-token';
  const expiredToken = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '-1h' });

  describe('authenticateToken', () => {
    it('should allow access with valid token', async () => {
      await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/notifications/unread-count')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });

    it('should reject request with expired token', async () => {
      await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject request with malformed authorization header', async () => {
      await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });

    it('should reject request with token in wrong format', async () => {
      await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', validToken) // Missing "Bearer "
        .expect(401);
    });
  });

  describe('Token payload validation', () => {
    it('should set user object in request when token is valid', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // The response should be successful, indicating the user was authenticated
      expect(response.body.success).toBe(true);
    });

    it('should handle token with missing required fields', async () => {
      const incompleteUser = { username: 'test' }; // Missing id
      const incompleteToken = jwt.sign(incompleteUser, process.env.JWT_SECRET);

      await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${incompleteToken}`)
        .expect(200); // Should still work, just with incomplete user data
    });
  });

  describe('Error handling', () => {
    it('should handle JWT verification errors gracefully', async () => {
      // Mock jwt.verify to throw an error
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('JWT verification failed');
      });

      await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);

      // Restore original function
      jwt.verify = originalVerify;
    });

    it('should handle malformed JSON in token', async () => {
      const malformedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload';

      await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${malformedToken}`)
        .expect(401);
    });
  });

  describe('Security considerations', () => {
    it('should not expose sensitive information in error responses', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.error.message).not.toContain('jwt');
      expect(response.body.error.message).not.toContain('secret');
      expect(response.body.error.code).toBeDefined();
    });

    it('should handle different token formats', async () => {
      // Test with different token structures
      const tokenVariations = [
        `Bearer ${validToken}`,
        `bearer ${validToken}`, // lowercase
        `Bearer  ${validToken}`, // extra space
        `BEARER ${validToken}`, // uppercase
      ];

      for (const authHeader of tokenVariations) {
        const response = await request(app)
          .get('/api/notifications/unread-count')
          .set('Authorization', authHeader);

        // All should work except the one with extra space
        if (authHeader.includes('  ')) {
          expect(response.status).toBe(401);
        } else {
          expect(response.status).toBe(200);
        }
      }
    });
  });
});
