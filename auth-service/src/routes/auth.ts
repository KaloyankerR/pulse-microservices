import express, { Router } from 'express';
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router: Router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Public routes
router.post('/register', validateRequest(schemas.register), authController.register);
router.post('/login', validateRequest(schemas.login), authController.login);
router.post('/refresh', validateRequest(schemas.refreshToken), authController.refreshToken);

// Protected routes
router.use(authenticateToken);
router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);
router.post('/change-password', validateRequest(schemas.changePassword), authController.changePassword);

export default router;




