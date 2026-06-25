import express from 'express';
import { verifyFirebaseToken, verifyAdmin } from '../middleware/auth.js';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../controllers/courseController.js';

// 1. Import the upload middleware
import { upload } from '../config/cloudinaryConfig.js';

const router = express.Router();

router.route('/')
  .get(getCourses) // Public
  // 2. Add 'upload.single("image")' here
  .post(verifyFirebaseToken, verifyAdmin, upload.single('image'), createCourse); // Admin protected

router.patch('/:id/toggle-active', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const Course = (await import('../models/Course.js')).default;
    const newActive = req.body.isActive;
    if (typeof newActive !== 'boolean') return res.status(400).json({ message: 'isActive boolean is required' });
    const updated = await Course.findByIdAndUpdate(req.params.id, { $set: { isActive: newActive } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Course not found' });
    res.json({ _id: updated._id, isActive: updated.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling course visibility' });
  }
});

router.route('/:id')
  .get(getCourseById)
  // 3. Add 'upload.single("image")' here
  .put(verifyFirebaseToken, verifyAdmin, upload.single('image'), updateCourse) // Admin protected
  .delete(verifyFirebaseToken, verifyAdmin, deleteCourse); // Admin protected

export default router;