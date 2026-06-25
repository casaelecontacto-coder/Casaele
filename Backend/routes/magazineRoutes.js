import express from 'express';
import { verifyFirebaseToken, verifyVerifiedAdmin } from '../middleware/auth.js';
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
  .post(verifyVerifiedAdmin, createMagazine);

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

router.patch('/:id/toggle-active', verifyVerifiedAdmin, async (req, res) => {
  try {
    const { default: Mag } = await import('../models/Magazine.js');
    const newActive = req.body.isActive;
    if (typeof newActive !== 'boolean') return res.status(400).json({ message: 'isActive boolean is required' });
    const updated = await Mag.findByIdAndUpdate(req.params.id, { $set: { isActive: newActive } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Magazine not found' });
    res.json({ _id: updated._id, isActive: updated.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling magazine visibility' });
  }
});

router.route('/:id')
  .get(getMagazineById)
  .put(verifyVerifiedAdmin, updateMagazine)
  .delete(verifyVerifiedAdmin, deleteMagazine);

export default router;
