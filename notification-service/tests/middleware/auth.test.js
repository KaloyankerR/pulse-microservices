const jwt = require('jsonwebtoken');
const { 
  authenticateToken, 
  optionalAuth, 
  requireRole, 
  requireOwnership 
} = require('../../src/middleware/auth');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  logError: jest.fn(),
}));

describe('Authentication Middleware', () => {
  let req, res, next;
  const mockSecret = 'test-secret-key';
  
  beforeEach(() => {
    process.env.JWT_SECRET = mockSecret;
    req = {
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn(() => 'TestAgent/1.0'),
      requestId: 'test-123',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 if no token is provided', () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Access token is required',
          code: 'TOKEN_REQUIRED',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should authenticate user with valid token', () => {
      const userData = { id: 'user-123', username: 'testuser', role: 'USER' };
      const token = jwt.sign(userData, mockSecret);
      req.headers.authorization = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user-123');
      expect(req.user.username).toBe('testuser');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 for expired token', (done) => {
      const userData = { id: 'user-123', username: 'testuser' };
      const token = jwt.sign(userData, mockSecret, { expiresIn: '-1s' });
      req.headers.authorization = `Bearer ${token}`;

      authenticateToken(req, res, next);

      // Use setImmediate to let the async verification complete
      setImmediate(() => {
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: {
            message: 'Access token has expired',
            code: 'TOKEN_EXPIRED',
          },
          meta: expect.objectContaining({
            timestamp: expect.any(String),
            version: 'v1',
          }),
        });
        expect(next).not.toHaveBeenCalled();
        done();
      });
    });

    it('should return 401 for invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid access token',
          code: 'TOKEN_INVALID',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for token signed with wrong secret', () => {
      const userData = { id: 'user-123', username: 'testuser' };
      const token = jwt.sign(userData, 'wrong-secret');
      req.headers.authorization = `Bearer ${token}`;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should continue without user if no token provided', () => {
      optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should authenticate user if valid token provided', () => {
      const userData = { id: 'user-456', username: 'optionaluser' };
      const token = jwt.sign(userData, mockSecret);
      req.headers.authorization = `Bearer ${token}`;

      optionalAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user-456');
      expect(next).toHaveBeenCalled();
    });

    it('should set user to null for invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';

      optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should return 401 if user is not authenticated', () => {
      const middleware = requireRole(['ADMIN']);
      
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access if user has required role', () => {
      req.user = { id: 'user-123', username: 'admin', role: 'ADMIN' };
      const middleware = requireRole(['ADMIN']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access if user has one of multiple required roles', () => {
      req.user = { id: 'user-456', username: 'moderator', role: 'MODERATOR' };
      const middleware = requireRole(['ADMIN', 'MODERATOR']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      req.user = { id: 'user-789', username: 'regularuser', role: 'USER' };
      const middleware = requireRole(['ADMIN']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should default to USER role if not specified', () => {
      req.user = { id: 'user-999', username: 'defaultuser' };
      const middleware = requireRole(['USER']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnership', () => {
    beforeEach(() => {
      req.params = {};
    });

    it('should return 401 if user is not authenticated', () => {
      const middleware = requireOwnership();
      
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access if user owns the resource', () => {
      req.user = { id: 'user-123', username: 'owner', role: 'USER' };
      req.params.userId = 'user-123';
      const middleware = requireOwnership();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow admin to access any resource', () => {
      req.user = { id: 'admin-456', username: 'admin', role: 'ADMIN' };
      req.params.userId = 'user-789';
      const middleware = requireOwnership();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not own the resource', () => {
      req.user = { id: 'user-123', username: 'user', role: 'USER' };
      req.params.userId = 'user-456';
      const middleware = requireOwnership();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Access denied - resource ownership required',
          code: 'RESOURCE_OWNERSHIP_REQUIRED',
        },
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          version: 'v1',
        }),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should use custom resource parameter name', () => {
      req.user = { id: 'user-123', username: 'owner', role: 'USER' };
      req.params.ownerId = 'user-123';
      const middleware = requireOwnership('ownerId');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});

