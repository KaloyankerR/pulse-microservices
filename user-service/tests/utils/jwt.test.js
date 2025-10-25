const JwtUtil = require('../../src/utils/jwt');

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

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const payload = { userId: mockUser.id };
      const token = JwtUtil.generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const payload = { userId: mockUser.id };
      const token = JwtUtil.generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { userId: mockUser.id, email: mockUser.email };
      const token = JwtUtil.generateAccessToken(payload);

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

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = JwtUtil.generateTokens(mockUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');
      expect(tokens.expiresIn).toBe('1h');
    });

    it('should include correct payload in tokens', () => {
      const tokens = JwtUtil.generateTokens(mockUser);
      const decoded = JwtUtil.verifyToken(tokens.accessToken);

      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.iss).toBe('pulse-user-service');
      expect(decoded.sub).toBe(mockUser.email);
    });

    it('should use default role if not provided', () => {
      const userWithoutRole = { ...mockUser };
      delete userWithoutRole.role;

      const tokens = JwtUtil.generateTokens(userWithoutRole);
      const decoded = JwtUtil.verifyToken(tokens.accessToken);

      expect(decoded.role).toBe('USER');
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
















