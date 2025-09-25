const authService = require('../services/authService');
const oauthService = require('../services/oauthService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        data: {
          user: result,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED');
      }

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just return a success message
      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);

      res.status(200).json({
        success: true,
        data: {
          user,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Google OAuth endpoints
  async googleAuth(req, res, next) {
    // Passport will handle the OAuth flow
    // This is just a placeholder - the actual logic is in passport strategy
  }

  async googleCallback(req, res, next) {
    try {
      if (req.user) {
        // Generate tokens for the authenticated user
        const result = await oauthService.generateTokensForOAuthUser(req.user);

        // In a real application, you might want to redirect to a frontend page
        // For now, we'll return the tokens in JSON format
        res.status(200).json({
          success: true,
          data: {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresIn: result.expiresIn,
            message: 'Google authentication successful',
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
      } else {
        throw new AppError('Google authentication failed', 401, 'GOOGLE_AUTH_FAILED');
      }
    } catch (error) {
      next(error);
    }
  }

  async linkGoogleAccount(req, res, next) {
    try {
      const result = await oauthService.linkGoogleAccount(req.user.id, req.body.googleProfile);

      res.status(200).json({
        success: true,
        data: {
          user: result,
          message: 'Google account linked successfully',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async unlinkGoogleAccount(req, res, next) {
    try {
      const result = await oauthService.unlinkGoogleAccount(req.user.id);

      res.status(200).json({
        success: true,
        data: {
          user: result,
          message: 'Google account unlinked successfully',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getOAuthProviders(req, res, next) {
    try {
      const providers = await oauthService.getOAuthProviders(req.user.id);

      res.status(200).json({
        success: true,
        data: {
          providers,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
