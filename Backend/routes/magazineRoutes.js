import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import {
  getMagazines,
  getMagazineById,
  createMagazine,
  updateMagazine,
  deleteMagazine,
  serveMagazinePdf,
} from '../controllers/magazineController.js';

const router = express.Router();

router.route('/')
  .get(getMagazines)
  .post(verifyFirebaseToken, createMagazine);

// PDF proxy endpoint must come before /:id to avoid route conflict
router.get('/:id/pdf', serveMagazinePdf);

router.route('/:id')
  .get(getMagazineById)
  .put(verifyFirebaseToken, updateMagazine)
  .delete(verifyFirebaseToken, deleteMagazine);

export default router;
