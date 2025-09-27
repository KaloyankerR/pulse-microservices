const prisma = require('../config/database');
const JwtUtil = require('../utils/jwt');
const BcryptUtil = require('../utils/bcrypt');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class AuthService {
  async register(userData) {
    const { email, username, password, displayName } = userData;

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username },
          ],
        },
      });

      if (existingUser) {
        const field = existingUser.email === email ? 'email' : 'username';
        throw new AppError(`User with this ${field} already exists`, 409, 'USER_EXISTS');
      }

      // Validate password strength
      const passwordValidation = BcryptUtil.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new AppError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400, 'WEAK_PASSWORD');
      }

      // Hash password
      const hashedPassword = await BcryptUtil.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash: hashedPassword,
          displayName: displayName || username,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      return user;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Check user status
      // Account is always active (status field removed from schema)


      // Verify password
      const isPasswordValid = await BcryptUtil.comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Generate tokens
      const tokens = JwtUtil.generateTokens(user);

      const userResponse = {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        verified: user.verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      return {
        user: userResponse,
        ...tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = JwtUtil.verifyToken(refreshToken);
      
      // Find user to ensure they still exist and are active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
      }

      // Generate new tokens
      const tokens = JwtUtil.generateTokens(user);

      logger.info('Token refreshed successfully', { userId: user.id });

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }
  }

  async getCurrentUser(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Get follower counts
      const [followersCount, followingCount] = await Promise.all([
        prisma.userFollow.count({ where: { followingId: user.id } }),
        prisma.userFollow.count({ where: { followerId: user.id } }),
      ]);

      return {
        ...user,
        followersCount,
        followingCount,
      };
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Verify current password
      const isCurrentPasswordValid = await BcryptUtil.comparePassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
      }

      // Validate new password strength
      const passwordValidation = BcryptUtil.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400, 'WEAK_PASSWORD');
      }

      // Hash new password
      const hashedNewPassword = await BcryptUtil.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedNewPassword },
      });

      logger.info('Password changed successfully', { userId });

      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
