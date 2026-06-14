import { Router } from 'express';
import { getMyProfile, getStrictFeed, updateMyProfile, getPublicProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Route 1: Get the user's profile and their own uploads
router.get('/me', protect, getMyProfile);

// Route 2: Get the strict semester-locked social feed
router.get('/feed', protect, getStrictFeed);

// Route 3: Update the user's profile
router.patch('/me', protect, updateMyProfile);

// Route 4: Get a public user's profile
router.get('/:id', protect, getPublicProfile);

export default router;
