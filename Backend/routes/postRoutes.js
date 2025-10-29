import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { createPost, getPosts, getPostById, updatePost, deletePost } from '../controllers/postController.js';

const router = express.Router();

// Routes for listing all posts and creating a new one
router.route('/')
  .get(getPosts)
  .post(verifyFirebaseToken, createPost);

// Routes for getting, updating, and deleting a single post by its ID
router.route('/:id')
  .get(getPostById) // Publicly get a single post if needed
  .put(verifyFirebaseToken, updatePost)
  .delete(verifyFirebaseToken, deletePost);

export default router;