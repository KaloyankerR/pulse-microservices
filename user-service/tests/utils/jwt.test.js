const JwtUtil = require('../../src/utils/jwt').default || require('../../src/utils/jwt');

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

describe('JwtUtil', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    role: 'USER',
  };

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const jwt = require('jsonwebtoken');
      const payload = { userId: mockUser.id, email: mockUser.email };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      const decoded = JwtUtil.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        JwtUtil.verifyToken(invalidToken);
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      // Create token with immediate expiry
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: mockUser.id },
        process.env.JWT_SECRET,
        { expiresIn: '0s' },
      );

      expect(() => {
        JwtUtil.verifyToken(expiredToken);
      }).toThrow('Invalid or expired token');
    });
  });


  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'sample.jwt.token';
      const header = `Bearer ${token}`;

      const extracted = JwtUtil.extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it('should throw error for missing header', () => {
      expect(() => {
        JwtUtil.extractTokenFromHeader(null);
      }).toThrow('Invalid authorization header');
    });

    it('should throw error for invalid header format', () => {
      expect(() => {
        JwtUtil.extractTokenFromHeader('Invalid header');
      }).toThrow('Invalid authorization header');
    });

    it('should throw error for header without Bearer prefix', () => {
      expect(() => {
        JwtUtil.extractTokenFromHeader('Token sample.jwt.token');
      }).toThrow('Invalid authorization header');
    });
  });
});



































