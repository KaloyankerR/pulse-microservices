const express = require('express');
const { param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { socialLimiter } = require('../middleware/rateLimiter');
const socialController = require('../controllers/socialController');

const router = express.Router();

/**
 * @swagger
 * /api/v1/social/follow/{userId}:
 *   post:
 *     summary: Follow a user
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to follow
 *     responses:
 *       200:
 *         description: Successfully followed user
 *       400:
 *         description: Invalid operation (e.g., following yourself)
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Already following this user
 */
router.post(
  '/follow/:userId',
  authenticateToken,
  socialLimiter,
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
  ],
  validate,
  socialController.followUser
);

/**
 * @swagger
 * /api/v1/social/follow/{userId}:
 *   delete:
 *     summary: Unfollow a user
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to unfollow
 *     responses:
 *       200:
 *         description: Successfully unfollowed user
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not following this user
 */
router.delete(
  '/follow/:userId',
  authenticateToken,
  socialLimiter,
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
  ],
  validate,
  socialController.unfollowUser
);

/**
 * @swagger
 * /api/v1/social/followers/{userId}:
 *   get:
 *     summary: Get user's followers
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of followers
 *       400:
 *         description: Invalid parameters
 */
router.get(
  '/followers/:userId',
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  socialController.getFollowers
);

/**
 * @swagger
 * /api/v1/social/following/{userId}:
 *   get:
 *     summary: Get users that a user is following
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of users being followed
 *       400:
 *         description: Invalid parameters
 */
router.get(
  '/following/:userId',
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  socialController.getFollowing
);

/**
 * @swagger
 * /api/v1/social/block/{userId}:
 *   post:
 *     summary: Block a user
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to block
 *     responses:
 *       200:
 *         description: Successfully blocked user
 *       400:
 *         description: Invalid operation
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Already blocked this user
 */
router.post(
  '/block/:userId',
  authenticateToken,
  socialLimiter,
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
  ],
  validate,
  socialController.blockUser
);

/**
 * @swagger
 * /api/v1/social/block/{userId}:
 *   delete:
 *     summary: Unblock a user
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to unblock
 *     responses:
 *       200:
 *         description: Successfully unblocked user
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not blocked
 */
router.delete(
  '/block/:userId',
  authenticateToken,
  socialLimiter,
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
  ],
  validate,
  socialController.unblockUser
);

/**
 * @swagger
 * /api/v1/social/recommendations:
 *   get:
 *     summary: Get user recommendations (friend suggestions)
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: List of recommended users
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/recommendations',
  socialLimiter,
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  ],
  validate,
  socialController.getRecommendations
);

/**
 * @swagger
 * /api/v1/social/stats/{userId}:
 *   get:
 *     summary: Get user's social statistics
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User social statistics
 *       400:
 *         description: Invalid user ID
 */
router.get(
  '/stats/:userId',
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
  ],
  validate,
  socialController.getSocialStats
);

/**
 * @swagger
 * /api/v1/social/sync-users:
 *   post:
 *     summary: Sync users from user service
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users synced successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/sync-users',
  authenticateToken,
  socialController.syncUsers
);

/**
 * @swagger
 * /api/v1/social/status/{userId}:
 *   get:
 *     summary: Get follow status with a user
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Follow status information
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/status/:userId',
  authenticateToken,
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
  ],
  validate,
  socialController.getFollowStatus
);

module.exports = router;

