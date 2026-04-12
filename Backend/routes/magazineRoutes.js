import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import {
  getMagazines,
  getMagazineById,
  createMagazine,
  updateMagazine,
  deleteMagazine,
} from '../controllers/magazineController.js';

const router = express.Router();

router.route('/')
  .get(getMagazines)
  .post(verifyFirebaseToken, createMagazine);

router.route('/:id')
  .get(getMagazineById)
  .put(verifyFirebaseToken, updateMagazine)
  .delete(verifyFirebaseToken, deleteMagazine);

export default router;
