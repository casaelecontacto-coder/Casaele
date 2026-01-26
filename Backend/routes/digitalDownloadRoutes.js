import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import {
  verifyDownloadToken,
  trackDownload,
  serveFile,
  getOrderDownloads,
  getAllDownloads,
  resetDownloadCount
} from '../controllers/digitalDownloadController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/verify/:token', verifyDownloadToken);
router.post('/track/:token', trackDownload);
router.get('/file/:token/:fileIndex', serveFile);  // Proxy endpoint to serve files with correct headers

// Admin routes (authentication required)
router.get('/admin', verifyFirebaseToken, getAllDownloads);
router.get('/admin/orders/:orderId', verifyFirebaseToken, getOrderDownloads);
router.post('/admin/reset/:id', verifyFirebaseToken, resetDownloadCount);

export default router;
