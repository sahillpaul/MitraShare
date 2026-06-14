import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getUploadUrl, confirmUpload, getSecureViewUrl, getLibraryFiles, searchFiles, toggleUpvote, deleteFile } from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js'; // Import the guard
import { cacheRequest } from '../middleware/cacheMiddleware.js';

const router = Router();
const uploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20 });

router.post('/request-upload', protect, uploadLimiter, getUploadUrl);
router.post('/confirm-upload', confirmUpload);
router.get('/:fileId/view', getSecureViewUrl);
router.get('/library', protect, cacheRequest(60), getLibraryFiles);
router.get('/search', cacheRequest(60), searchFiles);
router.post('/:fileId/upvote', protect, toggleUpvote);
router.delete('/:fileId', protect, deleteFile);
export default router;
