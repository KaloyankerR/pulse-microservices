const userController = require('../../src/controllers/userController');
const userService = require('../../src/services/userService');
const { AppError } = require('../../src/middleware/errorHandler');

jest.mock('../../src/services/userService');

describe('UserController', () => {
  let req; let res; let
    next;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
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

  describe('getUserById', () => {
    it('should get user by id successfully', async () => {
      const mockUser = {
        id: 'other-user-id',
        username: 'otheruser',
        followersCount: 10,
      };

      req.params.id = 'other-user-id';
      userService.getUserById.mockResolvedValue(mockUser);

      await userController.getUserById(req, res, next);

      expect(userService.getUserById).toHaveBeenCalledWith('other-user-id', 'user-id');
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

    it('should handle get user errors', async () => {
      const error = new AppError('User not found', 404);
      userService.getUserById.mockRejectedValue(error);

      await userController.getUserById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUser = {
        id: 'user-id',
        displayName: 'New Name',
      };

      req.params.id = 'user-id';
      req.body = { displayName: 'New Name' };
      userService.updateProfile.mockResolvedValue(mockUser);

      await userController.updateProfile(req, res, next);

      expect(userService.updateProfile).toHaveBeenCalledWith('user-id', req.body);
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

    it('should reject updating other user profile', async () => {
      req.params.id = 'other-user-id';
      req.body = { displayName: 'New Name' };

      await userController.updateProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Can only update your own profile',
          statusCode: 403,
        }),
      );
    });

    it('should handle update profile errors', async () => {
      const error = new AppError('Update failed', 500);
      req.params.id = 'user-id';
      userService.updateProfile.mockRejectedValue(error);

      await userController.updateProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockResult = { message: 'User account deleted successfully' };

      req.params.id = 'user-id';
      userService.deleteUser.mockResolvedValue(mockResult);

      await userController.deleteUser(req, res, next);

      expect(userService.deleteUser).toHaveBeenCalledWith('user-id');
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

    it('should reject deleting other user account', async () => {
      req.params.id = 'other-user-id';

      await userController.deleteUser(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Can only delete your own account',
          statusCode: 403,
        }),
      );
    });

    it('should handle delete user errors', async () => {
      const error = new AppError('Delete failed', 500);
      req.params.id = 'user-id';
      userService.deleteUser.mockRejectedValue(error);

      await userController.deleteUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      const mockResult = {
        users: [{ id: '1', username: 'user1' }],
        pagination: { page: 1, limit: 20, totalCount: 1 },
      };

      req.query = { q: 'test', page: '1', limit: '20' };
      userService.searchUsers.mockResolvedValue(mockResult);

      await userController.searchUsers(req, res, next);

      expect(userService.searchUsers).toHaveBeenCalledWith('test', 1, 20, 'user-id');
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

    it('should handle search errors', async () => {
      const error = new AppError('Search failed', 500);
      userService.searchUsers.mockRejectedValue(error);

      await userController.searchUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getFollowers', () => {
    it('should get followers successfully', async () => {
      const mockResult = {
        followers: [{ id: '1', username: 'follower1' }],
        pagination: { page: 1, limit: 20 },
      };

      req.params.id = 'user-id';
      req.query = { page: '1', limit: '20' };
      userService.getFollowers.mockResolvedValue(mockResult);

      await userController.getFollowers(req, res, next);

      expect(userService.getFollowers).toHaveBeenCalledWith('user-id', 1, 20);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle get followers errors', async () => {
      const error = new AppError('Failed to get followers', 500);
      userService.getFollowers.mockRejectedValue(error);

      await userController.getFollowers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getFollowing', () => {
    it('should get following successfully', async () => {
      const mockResult = {
        following: [{ id: '1', username: 'following1' }],
        pagination: { page: 1, limit: 20 },
      };

      req.params.id = 'user-id';
      req.query = { page: '1', limit: '20' };
      userService.getFollowing.mockResolvedValue(mockResult);

      await userController.getFollowing(req, res, next);

      expect(userService.getFollowing).toHaveBeenCalledWith('user-id', 1, 20);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle get following errors', async () => {
      const error = new AppError('Failed to get following', 500);
      userService.getFollowing.mockRejectedValue(error);

      await userController.getFollowing(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('followUser', () => {
    it('should follow user successfully', async () => {
      const mockResult = { message: 'User followed successfully' };

      req.params.id = 'other-user-id';
      userService.followUser.mockResolvedValue(mockResult);

      await userController.followUser(req, res, next);

      expect(userService.followUser).toHaveBeenCalledWith('user-id', 'other-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle follow errors', async () => {
      const error = new AppError('Cannot follow yourself', 400);
      userService.followUser.mockRejectedValue(error);

      await userController.followUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow user successfully', async () => {
      const mockResult = { message: 'User unfollowed successfully' };

      req.params.id = 'other-user-id';
      userService.unfollowUser.mockResolvedValue(mockResult);

      await userController.unfollowUser(req, res, next);

      expect(userService.unfollowUser).toHaveBeenCalledWith('user-id', 'other-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle unfollow errors', async () => {
      const error = new AppError('Not following this user', 404);
      userService.unfollowUser.mockRejectedValue(error);

      await userController.unfollowUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getFollowStatus', () => {
    it('should get follow status successfully', async () => {
      const mockResult = { isFollowing: true };

      req.params.id = 'other-user-id';
      userService.getFollowStatus.mockResolvedValue(mockResult);

      await userController.getFollowStatus(req, res, next);

      expect(userService.getFollowStatus).toHaveBeenCalledWith('user-id', 'other-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle get follow status errors', async () => {
      const error = new AppError('Failed to get status', 500);
      userService.getFollowStatus.mockRejectedValue(error);

      await userController.getFollowStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCurrentUserProfile', () => {
    it('should get current user profile successfully', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
      };

      userService.getUserById.mockResolvedValue(mockUser);

      await userController.getCurrentUserProfile(req, res, next);

      expect(userService.getUserById).toHaveBeenCalledWith('user-id', 'user-id');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      const error = new AppError('User not found', 404);
      userService.getUserById.mockRejectedValue(error);

      await userController.getCurrentUserProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateCurrentUserProfile', () => {
    it('should update current user profile successfully', async () => {
      const mockUser = {
        id: 'user-id',
        displayName: 'New Name',
      };

      req.body = { displayName: 'New Name' };
      userService.updateProfile.mockResolvedValue(mockUser);

      await userController.updateCurrentUserProfile(req, res, next);

      expect(userService.updateProfile).toHaveBeenCalledWith('user-id', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      const error = new AppError('Update failed', 500);
      userService.updateProfile.mockRejectedValue(error);

      await userController.updateCurrentUserProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

