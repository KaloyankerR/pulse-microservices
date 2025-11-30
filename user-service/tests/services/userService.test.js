const { AppError } = require('../../src/middleware/errorHandler');

const mockPrisma = {
  userProfile: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  userFollow: {
    count: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

const userService = require('../../src/services/userService').default || require('../../src/services/userService');
const prisma = mockPrisma;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should get user by id successfully', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        displayName: 'Test User',
        bio: null,
        avatarUrl: null,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.userProfile.findUnique.mockResolvedValue(mockUser);
      prisma.userFollow.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);

      const result = await userService.getUserById(userId);

      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
      expect(result).toEqual({
        ...mockUser,
        followersCount: 10,
        followingCount: 5,
        isFollowing: false,
      });
    });

    it('should check if current user is following', async () => {
      const userId = 'user-id';
      const currentUserId = 'current-user-id';
      const mockUser = { id: 'user-id', username: 'testuser' };

      prisma.userProfile.findUnique.mockResolvedValue(mockUser);
      prisma.userFollow.count.mockResolvedValue(0);
      prisma.userFollow.findUnique.mockResolvedValue({ followerId: currentUserId, followingId: userId });

      const result = await userService.getUserById(userId, currentUserId);

      expect(result.isFollowing).toBe(true);
    });

    it('should throw error if user not found', async () => {
      prisma.userProfile.findUnique.mockResolvedValue(null);

      await expect(userService.getUserById('nonexistent-id')).rejects.toThrow(AppError);
      await expect(userService.getUserById('nonexistent-id')).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const userId = 'user-id';
      const updateData = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
      };

      const mockUser = {
        id: 'user-id',
        displayName: 'Updated Name',
        bio: 'Updated bio',
      };

      prisma.userProfile.update.mockResolvedValue(mockUser);
      prisma.userFollow.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);

      const result = await userService.updateProfile(userId, updateData);

      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: expect.any(Object),
      });
      expect(result).toEqual({
        ...mockUser,
        followersCount: 10,
        followingCount: 5,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-id';

      prisma.userProfile.delete.mockResolvedValue({ id: userId });

      const result = await userService.deleteUser(userId);

      expect(prisma.userProfile.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual({ message: 'User account deleted successfully' });
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      const query = 'test';
      const page = 1;
      const limit = 20;

      const mockUsers = [
        { id: '1', username: 'testuser1', displayName: 'Test User 1' },
        { id: '2', username: 'testuser2', displayName: 'Test User 2' },
      ];

      prisma.userProfile.findMany.mockResolvedValue(mockUsers);
      prisma.userProfile.count.mockResolvedValue(2);
      prisma.userFollow.count.mockResolvedValue(0);

      const result = await userService.searchUsers(query, page, limit);

      expect(prisma.userProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
          select: expect.any(Object),
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: limit,
        }),
      );
      expect(result.users).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        totalCount: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should check follow status when currentUserId is provided', async () => {
      const mockUsers = [{ id: 'other-user-id', username: 'otheruser' }];

      prisma.userProfile.findMany.mockResolvedValue(mockUsers);
      prisma.userProfile.count.mockResolvedValue(1);
      prisma.userFollow.count.mockResolvedValue(0);
      prisma.userFollow.findUnique.mockResolvedValue({ followerId: 'current-user-id' });

      const result = await userService.searchUsers('test', 1, 20, 'current-user-id');

      expect(result.users[0].isFollowing).toBe(true);
    });
  });

  describe('getFollowers', () => {
    it('should get followers successfully', async () => {
      const userId = 'user-id';
      const mockFollowers = [
        {
          createdAt: new Date(),
          follower: {
            id: 'follower-1',
            username: 'follower1',
            displayName: 'Follower 1',
          },
        },
      ];

      prisma.userFollow.findMany.mockResolvedValue(mockFollowers);
      prisma.userFollow.count.mockResolvedValue(1);

      const result = await userService.getFollowers(userId, 1, 20);

      expect(prisma.userFollow.findMany).toHaveBeenCalledWith({
        where: { followingId: userId },
        include: {
          follower: {
            select: expect.any(Object),
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result.followers).toHaveLength(1);
      expect(result.pagination.totalCount).toBe(1);
    });
  });

  describe('getFollowing', () => {
    it('should get following successfully', async () => {
      const userId = 'user-id';
      const mockFollowing = [
        {
          createdAt: new Date(),
          following: {
            id: 'following-1',
            username: 'following1',
            displayName: 'Following 1',
          },
        },
      ];

      prisma.userFollow.findMany.mockResolvedValue(mockFollowing);
      prisma.userFollow.count.mockResolvedValue(1);

      const result = await userService.getFollowing(userId, 1, 20);

      expect(prisma.userFollow.findMany).toHaveBeenCalledWith({
        where: { followerId: userId },
        include: {
          following: {
            select: expect.any(Object),
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result.followers).toHaveLength(1);
      expect(result.pagination.totalCount).toBe(1);
    });
  });

  describe('followUser', () => {
    it('should follow user successfully', async () => {
      const followerId = 'follower-id';
      const followingId = 'following-id';

      prisma.userProfile.findUnique.mockResolvedValue({ id: followingId });
      prisma.userFollow.findUnique.mockResolvedValue(null);
      prisma.userFollow.create.mockResolvedValue({
        followerId,
        followingId,
      });

      const result = await userService.followUser(followerId, followingId);

      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { id: followingId },
      });
      expect(prisma.userFollow.create).toHaveBeenCalledWith({
        data: { followerId, followingId },
      });
      expect(result).toEqual({ message: 'User followed successfully' });
    });

    it('should throw error when trying to follow yourself', async () => {
      const userId = 'user-id';

      await expect(userService.followUser(userId, userId)).rejects.toThrow(AppError);
      await expect(userService.followUser(userId, userId)).rejects.toThrow('Cannot follow yourself');
    });

    it('should throw error if target user not found', async () => {
      prisma.userProfile.findUnique.mockResolvedValue(null);

      await expect(userService.followUser('follower-id', 'nonexistent-id')).rejects.toThrow(AppError);
      await expect(userService.followUser('follower-id', 'nonexistent-id')).rejects.toThrow('User not found');
    });

    it('should throw error if already following', async () => {
      prisma.userProfile.findUnique.mockResolvedValue({ id: 'following-id' });
      prisma.userFollow.findUnique.mockResolvedValue({
        followerId: 'follower-id',
        followingId: 'following-id',
      });

      await expect(userService.followUser('follower-id', 'following-id')).rejects.toThrow(AppError);
      await expect(userService.followUser('follower-id', 'following-id'))
        .rejects.toThrow('Already following this user');
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow user successfully', async () => {
      const followerId = 'follower-id';
      const followingId = 'following-id';

      prisma.userFollow.findUnique.mockResolvedValue({
        followerId,
        followingId,
      });
      prisma.userFollow.delete.mockResolvedValue({});

      const result = await userService.unfollowUser(followerId, followingId);

      expect(prisma.userFollow.delete).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      expect(result).toEqual({ message: 'User unfollowed successfully' });
    });

    it('should throw error if not following', async () => {
      prisma.userFollow.findUnique.mockResolvedValue(null);

      await expect(userService.unfollowUser('follower-id', 'following-id')).rejects.toThrow(AppError);
      await expect(userService.unfollowUser('follower-id', 'following-id')).rejects.toThrow('Not following this user');
    });
  });

  describe('getFollowStatus', () => {
    it('should return true if following', async () => {
      prisma.userFollow.findUnique.mockResolvedValue({
        followerId: 'follower-id',
        followingId: 'following-id',
      });

      const result = await userService.getFollowStatus('follower-id', 'following-id');

      expect(result).toEqual({ isFollowing: true });
    });

    it('should return false if not following', async () => {
      prisma.userFollow.findUnique.mockResolvedValue(null);

      const result = await userService.getFollowStatus('follower-id', 'following-id');

      expect(result).toEqual({ isFollowing: false });
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', username: 'user1' },
        { id: '2', email: 'user2@example.com', username: 'user2' },
      ];

      prisma.userProfile.findMany.mockResolvedValue(mockUsers);
      prisma.userProfile.count.mockResolvedValue(2);
      prisma.userFollow.count.mockResolvedValue(0);

      const result = await userService.getAllUsers(1, 20);

      expect(prisma.userProfile.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result.users).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        totalCount: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should handle pagination correctly', async () => {
      prisma.userProfile.findMany.mockResolvedValue([]);
      prisma.userProfile.count.mockResolvedValue(50);

      const result = await userService.getAllUsers(2, 20);

      expect(prisma.userProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        }),
      );
      expect(result.pagination).toEqual({
        page: 2,
        limit: 20,
        totalCount: 50,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });
  });
});
