import { Router } from 'express';
import Feedback from '../models/Feedback.js';
import { verifyFirebaseToken } from '../middleware/auth.js'; // Admin auth middleware

const router = Router();

// Backed by the unified Feedback collection now (see models/Feedback.js) —
// a "review" is just a Feedback doc with a rating and a course set. The
// response shape below is kept identical to the old Review model on
// purpose so Reviews.jsx/ReviewsData.jsx/ReviewsManager don't need any
// changes.
const toReviewShape = (f) => ({
  _id: f._id,
  course: f.course,
  name: f.name,
  rating: f.rating,
  comment: f.text,
  status: f.status,
  createdAt: f.createdAt,
  updatedAt: f.updatedAt,
});

// --- PUBLIC ROUTES ---

// POST /api/reviews - Submit a new review
router.post('/', async (req, res) => {
  try {
    const { course, name, rating, comment } = req.body;

    if (!course || !name || !rating || !comment) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    await Feedback.create({
      course,
      name,
      rating,
      text: comment,
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
    const reviews = await Feedback.find({
      course: courseId,
      status: 'approved',
      rating: { $exists: true }
    }).sort({ createdAt: -1 });

    res.json(reviews.map(toReviewShape));
  } catch (e) {
    console.error('Error fetching approved reviews:', e);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});


// --- ADMIN ROUTES ---

// GET /api/reviews - Get ALL reviews (pending, approved, rejected)
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const reviews = await Feedback.find({ rating: { $exists: true } })
      .populate('course', 'title') // Show the course title
      .sort({ createdAt: -1 });
    res.json(reviews.map(toReviewShape));
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

    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('course', 'title');

    if (!updated) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(toReviewShape(updated));
  } catch (e) {
    console.error('Error updating review status:', e);
    res.status(500).json({ message: 'Failed to update review' });
  }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (e) {
    console.error('Error deleting review:', e);
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

export default router;
