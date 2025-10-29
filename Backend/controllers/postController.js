import Post from '../models/Post.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Admin
export async function createPost(req, res) {
  try {
    const { title, description, imageUrl } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ message: 'Title and imageUrl are required' });
    }
    const post = await Post.create({
      title,
      description,
      imageUrl,
      createdBy: req.user.uid,
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
}

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
export async function getPosts(req, res) {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
}

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Admin
export async function deletePost(req, res) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    await post.deleteOne(); // Use deleteOne() for Mongoose v6+
    res.json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
}


export async function getPostById(req, res) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch post', error: error.message });
  }
}


export async function updatePost(req, res) {
  try {
    const { title, description, imageUrl } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, description, imageUrl },
      { new: true, runValidators: true }
    );
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update post', error: error.message });
  }
}