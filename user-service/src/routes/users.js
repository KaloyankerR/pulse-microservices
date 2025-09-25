const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const { userLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply rate limiting to all user routes
router.use(userLimiter);

// Public routes (with optional authentication)
router.get('/search', validateRequest(schemas.searchUsers, 'query'), optionalAuth, userController.searchUsers);
router.get('/:id', optionalAuth, userController.getUserById);
router.get('/:id/followers', validateRequest(schemas.pagination, 'query'), userController.getFollowers);
router.get('/:id/following', validateRequest(schemas.pagination, 'query'), userController.getFollowing);

// Protected routes
router.use(authenticateToken);

router.put('/:id', validateRequest(schemas.updateProfile), userController.updateProfile);
router.delete('/:id', userController.deleteUser);
router.post('/:id/follow', userController.followUser);
router.delete('/:id/follow', userController.unfollowUser);
router.get('/:id/follow-status', userController.getFollowStatus);

module.exports = router;
