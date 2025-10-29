import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
// Import controller functions (assuming they exist)
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js'; 

const router = express.Router();

router.route('/')
  .get(getProducts) // Public
  .post(verifyFirebaseToken, createProduct); // Admin protected

router.route('/:id')
  .get(getProductById) // Public
  .put(verifyFirebaseToken, updateProduct) // Admin protected
  .delete(verifyFirebaseToken, deleteProduct); // Admin protected

export default router;