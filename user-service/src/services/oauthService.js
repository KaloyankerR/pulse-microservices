const prisma = require('../config/database');
const JwtUtil = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class OAuthService {
  async linkGoogleAccount(userId, googleProfile) {
    try {
      // Check if Google account is already linked to another user
      const existingGoogleUser = await prisma.user.findFirst({
        where: {
          providerId: googleProfile.id,
          provider: 'GOOGLE',
          id: { not: userId },
        },
      });

      if (existingGoogleUser) {
        throw new AppError('Google account is already linked to another user', 409, 'GOOGLE_ACCOUNT_LINKED');
      }

      // Update user with Google provider information
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          provider: 'GOOGLE',
          providerId: googleProfile.id,
          verified: true, // Google users are automatically verified
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          verified: true,
          status: true,
          provider: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('Google account linked successfully', { userId, googleId: googleProfile.id });

      return user;
    } catch (error) {
      logger.error('Link Google account error:', error);
      throw error;
    }
  }

  async unlinkGoogleAccount(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (user.provider !== 'GOOGLE') {
        throw new AppError('User account is not linked to Google', 400, 'NOT_GOOGLE_ACCOUNT');
      }

      if (!user.password) {
        throw new AppError('Cannot unlink Google account without setting a password first', 400, 'NO_PASSWORD_SET');
      }

      // Remove Google provider information
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          provider: 'LOCAL',
          providerId: null,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          verified: true,
          status: true,
          provider: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('Google account unlinked successfully', { userId });

      return updatedUser;
    } catch (error) {
      logger.error('Unlink Google account error:', error);
      throw error;
    }
  }

  async getOAuthProviders(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          provider: true,
          providerId: true,
          password: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const providers = [];

      // Add local provider if user has a password
      if (user.password) {
        providers.push({
          provider: 'LOCAL',
          linked: true,
        });
      }

      // Add Google provider
      providers.push({
        provider: 'GOOGLE',
        linked: user.provider === 'GOOGLE',
        providerId: user.providerId,
      });

      return providers;
    } catch (error) {
      logger.error('Get OAuth providers error:', error);
      throw error;
    }
  }

  async generateTokensForOAuthUser(user) {
    try {
      // Get follower counts
      const [followersCount, followingCount] = await Promise.all([
        prisma.userFollow.count({ where: { followingId: user.id } }),
        prisma.userFollow.count({ where: { followerId: user.id } }),
      ]);

      const userResponse = {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        verified: user.verified,
        status: user.status,
        provider: user.provider,
        followersCount,
        followingCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      // Generate JWT tokens
      const tokens = JwtUtil.generateTokens(user);

      logger.info('OAuth user authenticated successfully', { 
        userId: user.id, 
        provider: user.provider 
      });

      return {
        user: userResponse,
        ...tokens,
      };
    } catch (error) {
      logger.error('Generate tokens for OAuth user error:', error);
      throw error;
    }
  }

  async checkExistingUser(email, provider, providerId) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { providerId, provider },
          ],
        },
      });

      return user;
    } catch (error) {
      logger.error('Check existing user error:', error);
      throw error;
    }
  }
}

module.exports = new OAuthService();

