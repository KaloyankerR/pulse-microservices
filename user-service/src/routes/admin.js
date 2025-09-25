const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const { userLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply rate limiting and admin authentication to all admin routes
router.use(userLimiter);
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/users', validateRequest(schemas.pagination, 'query'), adminController.getAllUsers);
router.put('/users/:id/status', validateRequest(schemas.updateUserStatus), adminController.updateUserStatus);

module.exports = router;
