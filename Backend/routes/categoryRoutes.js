import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';

const router = express.Router();

router.route('/')
  .get(getCategories) // public list
  .post(verifyFirebaseToken, createCategory);

router.route('/:id')
  .get(getCategoryById) // public detail
  .put(verifyFirebaseToken, updateCategory)
  .delete(verifyFirebaseToken, deleteCategory);

export default router;
