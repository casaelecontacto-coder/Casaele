import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { createPost, getPosts, getPostById, updatePost, deletePost } from '../controllers/postController.js';

const router = express.Router();

// Routes for listing all posts and creating a new one
router.route('/')
  .get(getPosts)
  .post(verifyFirebaseToken, createPost);

// Toggle visibility
router.patch('/:id/toggle-active', verifyFirebaseToken, async (req, res) => {
  try {
    const Post = (await import('../models/Post.js')).default;
    const newActive = req.body.isActive;
    if (typeof newActive !== 'boolean') return res.status(400).json({ message: 'isActive boolean is required' });
    const updated = await Post.findByIdAndUpdate(req.params.id, { $set: { isActive: newActive } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Post not found' });
    res.json({ _id: updated._id, isActive: updated.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling post visibility' });
  }
});

// Routes for getting, updating, and deleting a single post by its ID
router.route('/:id')
  .get(getPostById)
  .put(verifyFirebaseToken, updatePost)
  .delete(verifyFirebaseToken, deletePost);

export default router;