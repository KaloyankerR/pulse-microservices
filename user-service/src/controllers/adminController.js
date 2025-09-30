const userService = require('../services/userService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class AdminController {
  async getAllUsers(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await userService.getAllUsers(parseInt(page), parseInt(limit));

      res.status(200).json({
        success: true,
        data: {
          users: result.users,
          pagination: result.pagination,
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

module.exports = new AdminController();

