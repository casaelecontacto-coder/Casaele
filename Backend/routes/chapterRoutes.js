// Backend/routes/chapterRoutes.js
import express from 'express';
import { verifyAdminAccess } from '../middleware/superAdminAuth.js';
import {
  createChapter,
  getAllChapters,
  getChapterById,
  updateChapter,
  deleteChapter,
  reorderChapters,
  exportChapterData
} from '../controllers/chapterController.js';

const router = express.Router();

// Public routes
router.get('/', getAllChapters);
router.get('/:id', getChapterById);

// Admin only routes
router.post('/', verifyAdminAccess, createChapter);
router.put('/:id', verifyAdminAccess, updateChapter);
router.delete('/:id', verifyAdminAccess, deleteChapter);
router.post('/reorder', verifyAdminAccess, reorderChapters);
router.get('/:id/export', verifyAdminAccess, exportChapterData);

export default router;
