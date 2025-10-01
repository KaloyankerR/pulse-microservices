const { validateRequest, schemas } = require('../../src/middleware/validation');
const logger = require('../../src/utils/logger');

jest.mock('../../src/utils/logger');

describe('Validation Middleware', () => {
  let req; let res; let
    next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    logger.warn = jest.fn();
  });

  describe('validateRequest', () => {
    it('should pass validation for valid data', () => {
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const middleware = validateRequest(schemas.login);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation for invalid data', () => {
      req.body = {
        email: 'invalid-email',
        password: '',
      };

      const middleware = validateRequest(schemas.login);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: expect.any(String),
            }),
            expect.objectContaining({
              field: 'password',
              message: expect.any(String),
            }),
          ]),
        },
      });
    });

    it('should validate query parameters when property is "query"', () => {
      req.query = {
        page: '1',
        limit: '20',
      };

      const middleware = validateRequest(schemas.pagination, 'query');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should log validation errors', () => {
      req.body = {
        email: 'invalid',
      };

      const middleware = validateRequest(schemas.login);
      middleware(req, res, next);

      expect(logger.warn).toHaveBeenCalledWith('Validation error:', expect.any(Object));
    });
  });

  describe('schemas.register', () => {
    it('should validate correct registration data', () => {
      req.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        displayName: 'Test User',
      };

      const middleware = validateRequest(schemas.register);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid email', () => {
      req.body = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'Password123!',
      };

      const middleware = validateRequest(schemas.register);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject short username', () => {
      req.body = {
        email: 'test@example.com',
        username: 'ab',
        password: 'Password123!',
      };

      const middleware = validateRequest(schemas.register);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject weak password', () => {
      req.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak',
      };

      const middleware = validateRequest(schemas.register);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('schemas.login', () => {
    it('should validate correct login data', () => {
      req.body = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      const middleware = validateRequest(schemas.login);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject missing email', () => {
      req.body = {
        password: 'anypassword',
      };

      const middleware = validateRequest(schemas.login);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('schemas.updateProfile', () => {
    it('should validate correct profile data', () => {
      req.body = {
        displayName: 'New Name',
        bio: 'New bio',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const middleware = validateRequest(schemas.updateProfile);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow empty body', () => {
      req.body = {};

      const middleware = validateRequest(schemas.updateProfile);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid avatar URL', () => {
      req.body = {
        avatarUrl: 'not-a-url',
      };

      const middleware = validateRequest(schemas.updateProfile);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject bio exceeding max length', () => {
      req.body = {
        bio: 'a'.repeat(501),
      };

      const middleware = validateRequest(schemas.updateProfile);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('schemas.changePassword', () => {
    it('should validate correct password change data', () => {
      req.body = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      const middleware = validateRequest(schemas.changePassword);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject weak new password', () => {
      req.body = {
        currentPassword: 'OldPassword123!',
        newPassword: 'weak',
      };

      const middleware = validateRequest(schemas.changePassword);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('schemas.searchUsers', () => {
    it('should validate correct search query', () => {
      req.query = {
        q: 'test',
        page: 1,
        limit: 20,
      };

      const middleware = validateRequest(schemas.searchUsers, 'query');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject empty search query', () => {
      req.query = {
        q: '',
      };

      const middleware = validateRequest(schemas.searchUsers, 'query');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject missing search query', () => {
      req.query = {};

      const middleware = validateRequest(schemas.searchUsers, 'query');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('schemas.pagination', () => {
    it('should validate correct pagination params', () => {
      req.query = {
        page: 1,
        limit: 20,
      };

      const middleware = validateRequest(schemas.pagination, 'query');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid page number', () => {
      req.query = {
        page: 0,
        limit: 20,
      };

      const middleware = validateRequest(schemas.pagination, 'query');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject limit exceeding max', () => {
      req.query = {
        page: 1,
        limit: 101,
      };

      const middleware = validateRequest(schemas.pagination, 'query');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

