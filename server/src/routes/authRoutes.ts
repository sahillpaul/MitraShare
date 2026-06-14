import { Router } from 'express';
import { googleLogin, localSignup, localLogin, logout } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Route 1: The existing Google OAuth flow
router.post('/google', authLimiter, googleLogin);

// Route 2: New Local Email/Password Signup
router.post('/signup', authLimiter, localSignup);

// Route 3: New Local Email/Password Login
router.post('/login', authLimiter, localLogin);

// Route 4: Logout (clears HTTP-only cookie)
router.post('/logout', logout);

export default router;