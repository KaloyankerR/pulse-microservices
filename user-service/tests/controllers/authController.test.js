const authController = require('../../src/controllers/authController');
const authService = require('../../src/services/authService');
const { AppError } = require('../../src/middleware/errorHandler');

jest.mock('../../src/services/authService');

describe('AuthController', () => {
  let req; let res; let
    next;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: 'user-id', email: 'test@example.com' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
      };

      req.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      };

      authService.register.mockResolvedValue(mockUser);

      await authController.register(req, res, next);

      expect(authService.register).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUser,
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle registration errors', async () => {
      const error = new AppError('User already exists', 409);
      authService.register.mockRejectedValue(error);

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockResult = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          username: 'testuser',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: '15m',
      };

      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      authService.login.mockResolvedValue(mockResult);

      await authController.login(req, res, next);

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockResult.user,
          accessToken: mockResult.accessToken,
          refreshToken: mockResult.refreshToken,
          expiresIn: mockResult.expiresIn,
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle login errors', async () => {
      const error = new AppError('Invalid credentials', 401);
      authService.login.mockRejectedValue(error);

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: '15m',
      };

      req.body = {
        refreshToken: 'old-refresh-token',
      };

      authService.refreshToken.mockResolvedValue(mockResult);

      await authController.refreshToken(req, res, next);

      expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: mockResult.accessToken,
          refreshToken: mockResult.refreshToken,
          expiresIn: mockResult.expiresIn,
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle missing refresh token', async () => {
      req.body = {};

      await authController.refreshToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Refresh token is required',
          statusCode: 400,
          code: 'REFRESH_TOKEN_REQUIRED',
        }),
      );
    });

    it('should handle refresh token errors', async () => {
      const error = new AppError('Invalid token', 401);
      req.body = { refreshToken: 'invalid-token' };
      authService.refreshToken.mockRejectedValue(error);

      await authController.refreshToken(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await authController.logout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle logout errors', async () => {
      res.status.mockImplementationOnce(() => {
        throw new Error('Logout error');
      });

      await authController.logout(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        followersCount: 10,
        followingCount: 5,
      };

      authService.getCurrentUser.mockResolvedValue(mockUser);

      await authController.getCurrentUser(req, res, next);

      expect(authService.getCurrentUser).toHaveBeenCalledWith('user-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockUser,
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle get current user errors', async () => {
      const error = new AppError('User not found', 404);
      authService.getCurrentUser.mockRejectedValue(error);

      await authController.getCurrentUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockResult = { message: 'Password changed successfully' };

      req.body = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      authService.changePassword.mockResolvedValue(mockResult);

      await authController.changePassword(req, res, next);

      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-id',
        'OldPassword123!',
        'NewPassword123!',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle change password errors', async () => {
      const error = new AppError('Invalid current password', 400);
      authService.changePassword.mockRejectedValue(error);

      await authController.changePassword(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

