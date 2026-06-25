import express from 'express';
import { verifyVerifiedAdmin } from '../middleware/auth.js';
// Import controller functions (assuming they exist)
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';

const router = express.Router();

router.route('/')
  .get(getProducts) // Public
  .post(verifyVerifiedAdmin, createProduct); // Admin protected

router.patch('/:id/toggle-active', verifyVerifiedAdmin, async (req, res) => {
  try {
    const Product = (await import('../models/Product.js')).default;
    const newActive = req.body.isActive;
    if (typeof newActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive boolean is required' });
    }
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: newActive } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    console.log(`[Toggle] Product ${req.params.id} isActive set to ${updated.isActive}`);
    res.json({ _id: updated._id, isActive: updated.isActive });
  } catch (error) {
    console.error('Toggle product error:', error);
    res.status(500).json({ message: 'Error toggling product visibility' });
  }
});

router.route('/:id')
  .get(getProductById)
  .put(verifyVerifiedAdmin, updateProduct)
  .delete(verifyVerifiedAdmin, deleteProduct);

export default router;