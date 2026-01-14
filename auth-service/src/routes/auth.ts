import express, { Router } from 'express';
import authController from '../controllers/authController';
import { authenticateToken, requireModerator } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router: Router = express.Router();

// Debug middleware to track incoming auth requests
router.use((req, res, next) => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/a4396fcc-f0a9-4a0d-b201-c34d196a149e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/auth.ts:9',message:'Auth route request incoming',data:{ip:req.ip,forwardedFor:req.get('X-Forwarded-For'),endpoint:req.path,method:req.method,originalUrl:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  next();
});

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

// Moderator-only routes
router.get('/users/:id/auth-data', requireModerator, authController.getUserAuthData);
router.post('/users/:id/ban', requireModerator, authController.banUser);
router.post('/users/:id/unban', requireModerator, authController.unbanUser);
router.post('/users/:id/role', requireModerator, authController.updateUserRole);

export default router;







