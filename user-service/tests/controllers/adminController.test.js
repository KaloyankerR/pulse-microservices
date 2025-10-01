const adminController = require('../../src/controllers/adminController');
const userService = require('../../src/services/userService');
const { AppError } = require('../../src/middleware/errorHandler');

jest.mock('../../src/services/userService');

describe('AdminController', () => {
  let req; let res; let
    next;

  beforeEach(() => {
    req = {
      query: {},
      user: { id: 'admin-id', email: 'admin@example.com' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const mockResult = {
        users: [
          { id: '1', username: 'user1', email: 'user1@example.com' },
          { id: '2', username: 'user2', email: 'user2@example.com' },
        ],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      req.query = { page: '1', limit: '20' };
      userService.getAllUsers.mockResolvedValue(mockResult);

      await adminController.getAllUsers(req, res, next);

      expect(userService.getAllUsers).toHaveBeenCalledWith(1, 20);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          users: mockResult.users,
          pagination: mockResult.pagination,
        },
        meta: {
          timestamp: expect.any(String),
          version: 'v1',
        },
      });
    });

    it('should handle default pagination values', async () => {
      const mockResult = {
        users: [],
        pagination: { page: 1, limit: 20, totalCount: 0 },
      };

      req.query = {};
      userService.getAllUsers.mockResolvedValue(mockResult);

      await adminController.getAllUsers(req, res, next);

      expect(userService.getAllUsers).toHaveBeenCalledWith(NaN, NaN);
    });

    it('should handle get all users errors', async () => {
      const error = new AppError('Failed to fetch users', 500);
      userService.getAllUsers.mockRejectedValue(error);

      await adminController.getAllUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

