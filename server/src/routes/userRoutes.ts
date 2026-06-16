import { Router } from 'express';
import { getMyProfile, getStrictFeed, updateMyProfile, getPublicProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { cacheRequest } from '../middleware/cacheMiddleware.js';

const router = Router();

// Route 1: Get the user's profile and their own uploads (cached per-user for 60s)
router.get('/me', protect, cacheRequest(60, { userAware: true }), getMyProfile);

// Route 2: Get the strict semester-locked social feed
router.get('/feed', protect, getStrictFeed);

// Route 3: Update the user's profile (NOT cached — this is a write operation)
router.patch('/me', protect, updateMyProfile);

// Route 4: Get a public user's profile (cached for 60s — URL is unique per user)
router.get('/:id', protect, cacheRequest(60), getPublicProfile);

export default router;
