const { authenticateToken, requireAdmin, optionalAuth } = require('../../src/middleware/auth');
const JwtUtil = require('../../src/utils/jwt');
const logger = require('../../src/utils/logger');

jest.mock('../../src/utils/jwt');
jest.mock('../../src/utils/logger');

// Set test environment
process.env.JWT_SECRET = 'test-secret-key';
process.env.ADMIN_EMAIL = 'admin@example.com';

describe('Auth Middleware', () => {
  let req; let res; let
    next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      const user = { id: 'user-id', email: 'test@example.com' };
      req.headers.authorization = 'Bearer valid-token';

      JwtUtil.extractTokenFromHeader.mockReturnValue('valid-token');
      JwtUtil.verifyToken.mockReturnValue(user);

      await authenticateToken(req, res, next);

      expect(JwtUtil.extractTokenFromHeader).toHaveBeenCalledWith('Bearer valid-token');
      expect(JwtUtil.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is required',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      JwtUtil.extractTokenFromHeader.mockReturnValue('invalid-token');
      JwtUtil.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should log authentication errors', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      JwtUtil.extractTokenFromHeader.mockReturnValue('invalid-token');
      JwtUtil.verifyToken.mockImplementation(() => {
        throw new Error('Token error');
      });

      await authenticateToken(req, res, next);

      expect(logger.error).toHaveBeenCalledWith('Authentication error:', expect.any(Error));
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin user', async () => {
      req.user = { id: 'admin-id', email: 'admin@example.com' };

      await requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject non-admin user', async () => {
      req.user = { id: 'user-id', email: 'user@example.com' };

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request without user', async () => {
      req.user = null;

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.user = { id: 'user-id', email: 'user@example.com' };

      // Mock an error in the middleware
      res.status.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      await requireAdmin(req, res, next);

      expect(logger.error).toHaveBeenCalledWith('Admin authorization error:', expect.any(Error));
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate valid token', async () => {
      const user = { id: 'user-id', email: 'test@example.com' };
      req.headers.authorization = 'Bearer valid-token';

      JwtUtil.extractTokenFromHeader.mockReturnValue('valid-token');
      JwtUtil.verifyToken.mockReturnValue(user);

      await optionalAuth(req, res, next);

      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalled();
    });

    it('should proceed without authentication if no token provided', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it('should proceed without authentication if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      JwtUtil.extractTokenFromHeader.mockReturnValue('invalid-token');
      JwtUtil.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
