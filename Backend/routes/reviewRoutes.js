import { Router } from 'express';
import Review from '../models/Review.js';
import { verifyFirebaseToken } from '../middleware/auth.js'; // Admin auth middleware

const router = Router();

// --- PUBLIC ROUTES ---

// POST /api/reviews - Submit a new review
router.post('/', async (req, res) => {
  try {
    const { course, name, rating, comment } = req.body;

    if (!course || !name || !rating || !comment) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newReview = await Review.create({
      course,
      name,
      rating,
      comment,
      status: 'pending' // All new reviews are pending approval
    });
    
    // We don't send the full review back, just a success message
    res.status(201).json({ message: 'Review submitted successfully and is pending approval.' });
  } catch (e) {
    console.error('Error submitting review:', e);
    res.status(500).json({ message: 'Failed to submit review' });
  }
});

// GET /api/reviews/approved/:courseId - Get all APPROVED reviews for a specific course
router.get('/approved/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const reviews = await Review.find({ 
      course: courseId, 
      status: 'approved' 
    }).sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (e) {
    console.error('Error fetching approved reviews:', e);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});


// --- ADMIN ROUTES ---

// GET /api/reviews - Get ALL reviews (pending, approved, rejected)
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('course', 'title') // Show the course title
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (e) {
    console.error('Error fetching all reviews:', e);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// PUT /api/reviews/:id - Update a review's status (approve/reject)
router.put('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('course', 'title');

    if (!updatedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json(updatedReview);
  } catch (e) {
    console.error('Error updating review status:', e);
    res.status(500).json({ message: 'Failed to update review' });
  }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(req.params.id);
    if (!deletedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (e) {
    console.error('Error deleting review:', e);
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

export default router;