const authService = require('../../src/services/authService');
const prisma = require('../../src/config/database');
const JwtUtil = require('../../src/utils/jwt');
const BcryptUtil = require('../../src/utils/bcrypt');
const { AppError } = require('../../src/middleware/errorHandler');

jest.mock('../../src/config/database', () => ({
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userFollow: {
    count: jest.fn(),
  },
}));

jest.mock('../../src/utils/jwt');
jest.mock('../../src/utils/bcrypt');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        displayName: 'Test User',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        bio: null,
        avatarUrl: null,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findFirst.mockResolvedValue(null);
      BcryptUtil.validatePasswordStrength.mockReturnValue({ isValid: true, errors: [] });
      BcryptUtil.hashPassword.mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await authService.register(userData);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: userData.email },
            { username: userData.username },
          ],
        },
      });
      expect(BcryptUtil.validatePasswordStrength).toHaveBeenCalledWith(userData.password);
      expect(BcryptUtil.hashPassword).toHaveBeenCalledWith(userData.password);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user with email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        username: 'testuser',
        password: 'Password123!',
      };

      prisma.user.findFirst.mockResolvedValue({
        id: 'existing-id',
        email: 'existing@example.com',
        username: 'otheruser',
      });

      await expect(authService.register(userData)).rejects.toThrow(AppError);
      await expect(authService.register(userData)).rejects.toThrow('User with this email already exists');
    });

    it('should throw error if user with username already exists', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'existinguser',
        password: 'Password123!',
      };

      prisma.user.findFirst.mockResolvedValue({
        id: 'existing-id',
        email: 'other@example.com',
        username: 'existinguser',
      });

      await expect(authService.register(userData)).rejects.toThrow(AppError);
      await expect(authService.register(userData)).rejects.toThrow('User with this username already exists');
    });

    it('should throw error if password is weak', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak',
      };

      prisma.user.findFirst.mockResolvedValue(null);
      BcryptUtil.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password too short'],
      });

      await expect(authService.register(userData)).rejects.toThrow(AppError);
      await expect(authService.register(userData))
        .rejects.toThrow('Password validation failed');
    });

    it('should use username as displayName if not provided', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      };

      prisma.user.findFirst.mockResolvedValue(null);
      BcryptUtil.validatePasswordStrength.mockReturnValue({ isValid: true, errors: [] });
      BcryptUtil.hashPassword.mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({ id: 'user-id', username: 'testuser' });

      await authService.register(userData);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          username: userData.username,
          passwordHash: 'hashed-password',
          displayName: userData.username,
        },
        select: expect.any(Object),
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed-password',
        displayName: 'Test User',
        bio: null,
        avatarUrl: null,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: '15m',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      BcryptUtil.comparePassword.mockResolvedValue(true);
      JwtUtil.generateTokens.mockReturnValue(mockTokens);

      const result = await authService.login(email, password);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(BcryptUtil.comparePassword).toHaveBeenCalledWith(password, mockUser.passwordHash);
      expect(JwtUtil.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        }),
        ...mockTokens,
      });
    });

    it('should throw error if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login('nonexistent@example.com', 'password'))
        .rejects.toThrow(AppError);
      await expect(authService.login('nonexistent@example.com', 'password'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw error if password is invalid', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      BcryptUtil.comparePassword.mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(AppError);
      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const decoded = { id: 'user-id', email: 'test@example.com' };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
      };

      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: '15m',
      };

      JwtUtil.verifyToken.mockReturnValue(decoded);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      JwtUtil.generateTokens.mockReturnValue(mockTokens);

      const result = await authService.refreshToken(refreshToken);

      expect(JwtUtil.verifyToken).toHaveBeenCalledWith(refreshToken);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: decoded.id } });
      expect(result).toEqual(mockTokens);
    });

    it('should throw error if token is invalid', async () => {
      JwtUtil.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(AppError);
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if user not found', async () => {
      const decoded = { id: 'nonexistent-id' };
      JwtUtil.verifyToken.mockReturnValue(decoded);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.refreshToken('valid-token')).rejects.toThrow(AppError);
      await expect(authService.refreshToken('valid-token')).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        bio: null,
        avatarUrl: null,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userFollow.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);

      const result = await authService.getCurrentUser(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
      expect(result).toEqual({
        ...mockUser,
        followersCount: 10,
        followingCount: 5,
      });
    });

    it('should throw error if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getCurrentUser('nonexistent-id')).rejects.toThrow(AppError);
      await expect(authService.getCurrentUser('nonexistent-id')).rejects.toThrow('User not found');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 'user-id';
      const currentPassword = 'OldPassword123!';
      const newPassword = 'NewPassword123!';

      const mockUser = {
        id: 'user-id',
        passwordHash: 'old-hashed-password',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      BcryptUtil.comparePassword.mockResolvedValue(true);
      BcryptUtil.validatePasswordStrength.mockReturnValue({ isValid: true, errors: [] });
      BcryptUtil.hashPassword.mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      expect(BcryptUtil.comparePassword).toHaveBeenCalledWith(currentPassword, mockUser.passwordHash);
      expect(BcryptUtil.validatePasswordStrength).toHaveBeenCalledWith(newPassword);
      expect(BcryptUtil.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: 'new-hashed-password' },
      });
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should throw error if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.changePassword('nonexistent-id', 'old', 'new')).rejects.toThrow(AppError);
      await expect(authService.changePassword('nonexistent-id', 'old', 'new'))
        .rejects.toThrow('User not found');
    });

    it('should throw error if current password is incorrect', async () => {
      const mockUser = {
        id: 'user-id',
        passwordHash: 'hashed-password',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      BcryptUtil.comparePassword.mockResolvedValue(false);

      await expect(authService.changePassword('user-id', 'wrong', 'NewPassword123!')).rejects.toThrow(AppError);
      await expect(authService.changePassword('user-id', 'wrong', 'NewPassword123!'))
        .rejects.toThrow('Current password is incorrect');
    });

    it('should throw error if new password is weak', async () => {
      const mockUser = {
        id: 'user-id',
        passwordHash: 'hashed-password',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      BcryptUtil.comparePassword.mockResolvedValue(true);
      BcryptUtil.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password too weak'],
      });

      await expect(authService.changePassword('user-id', 'OldPassword123!', 'weak'))
        .rejects.toThrow(AppError);
      await expect(authService.changePassword('user-id', 'OldPassword123!', 'weak'))
        .rejects.toThrow('Password validation failed');
    });
  });
});
