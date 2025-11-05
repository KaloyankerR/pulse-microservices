import express, { Router } from 'express';
import userController from '../controllers/userController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';
import { userLimiter } from '../middleware/rateLimiter';

const router: Router = express.Router();

// Apply rate limiting to all user routes
router.use(userLimiter);

// Internal endpoint for auth-service to create profile
router.post('/create-profile', validateRequest(schemas.createProfile), userController.createProfile);

// Specific routes that must come before parameterized routes
router.get('/profile', authenticateToken, userController.getCurrentUserProfile);
router.put('/profile', authenticateToken, validateRequest(schemas.updateProfile), userController.updateCurrentUserProfile);

// Public routes (with optional authentication)
router.get('/search', validateRequest(schemas.searchUsers, 'query'), optionalAuth, userController.searchUsers);
router.get('/:id', optionalAuth, userController.getUserById);
router.get('/:id/followers', validateRequest(schemas.pagination, 'query'), userController.getFollowers);
router.get('/:id/following', validateRequest(schemas.pagination, 'query'), userController.getFollowing);

// Protected routes
router.put('/:id', authenticateToken, validateRequest(schemas.updateProfile), userController.updateProfile);
router.delete('/:id', authenticateToken, userController.deleteUser);
router.post('/:id/follow', authenticateToken, userController.followUser);
router.delete('/:id/follow', authenticateToken, userController.unfollowUser);
router.get('/:id/follow-status', authenticateToken, userController.getFollowStatus);

export default router;







