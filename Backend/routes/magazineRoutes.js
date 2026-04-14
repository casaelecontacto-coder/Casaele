import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import {
  getMagazines,
  getMagazineById,
  createMagazine,
  updateMagazine,
  deleteMagazine,
  serveMagazinePdf,
  checkMagazineAccess,
} from '../controllers/magazineController.js';

const router = express.Router();

router.route('/')
  .get(getMagazines)
  .post(verifyFirebaseToken, createMagazine);

// PDF proxy endpoint must come before /:id to avoid route conflict
router.get('/:id/pdf', serveMagazinePdf);

// Access check endpoint (requires auth)
router.get('/:id/access', verifyFirebaseToken, checkMagazineAccess);

// Complementary material download (requires auth)
router.get('/:id/material', verifyFirebaseToken, async (req, res) => {
  try {
    const { default: Magazine } = await import('../models/Magazine.js');
    const { default: mongoose } = await import('mongoose');
    const { getFileStreamFromDrive } = await import('../services/googleDriveService.js');

    let magazine;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      magazine = await Magazine.findById(req.params.id);
    }
    if (!magazine) {
      magazine = await Magazine.findOne({ slug: req.params.id });
    }
    if (!magazine || !magazine.complementaryMaterialUrl) {
      return res.status(404).json({ message: 'No complementary material available' });
    }

    const url = magazine.complementaryMaterialUrl;
    if (url.startsWith('gdrive://')) {
      const fileId = url.replace('gdrive://', '');
      const { stream, size, fileName } = await getFileStreamFromDrive(fileId);
      const downloadName = magazine.complementaryMaterialName || fileName || 'material.zip';
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      if (size) res.setHeader('Content-Length', size);
      stream.pipe(res);
    } else {
      res.redirect(url);
    }
  } catch (error) {
    console.error('Error serving complementary material:', error);
    res.status(500).json({ message: 'Server error serving material' });
  }
});

router.route('/:id')
  .get(getMagazineById)
  .put(verifyFirebaseToken, updateMagazine)
  .delete(verifyFirebaseToken, deleteMagazine);

export default router;
