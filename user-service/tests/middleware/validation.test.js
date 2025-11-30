const { validateRequest, schemas } = require('../../src/middleware/validation');
const logger = require('../../src/utils/logger').default || require('../../src/utils/logger');

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

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
        displayName: 'Test User',
        bio: 'Test bio',
      };

      const middleware = validateRequest(schemas.updateProfile);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation for invalid data', () => {
      req.body = {
        avatarUrl: 'not-a-url',
        bio: 'a'.repeat(501),
      };

      const middleware = validateRequest(schemas.updateProfile);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.any(Array),
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
        avatarUrl: 'not-a-url',
      };

      const middleware = validateRequest(schemas.updateProfile);
      middleware(req, res, next);

      expect(logger.warn).toHaveBeenCalledWith('Validation error:', expect.any(Object));
    });
  });

  describe('schemas.createProfile', () => {
    it('should validate correct profile creation data', () => {
      req.body = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        displayName: 'Test User',
      };

      const middleware = validateRequest(schemas.createProfile);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid UUID', () => {
      req.body = {
        id: 'invalid-uuid',
        username: 'testuser',
      };

      const middleware = validateRequest(schemas.createProfile);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject short username', () => {
      req.body = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'ab',
      };

      const middleware = validateRequest(schemas.createProfile);
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

