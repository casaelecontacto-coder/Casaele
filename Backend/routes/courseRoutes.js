import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../controllers/courseController.js';

// 1. Import the upload middleware
import { upload } from '../config/cloudinaryConfig.js';

const router = express.Router();

router.route('/')
  .get(getCourses) // Public
  // 2. Add 'upload.single("image")' here
  .post(verifyFirebaseToken, upload.single('image'), createCourse); // Admin protected

router.route('/:id')
  .get(getCourseById) // Public
  // 3. Add 'upload.single("image")' here
  .put(verifyFirebaseToken, upload.single('image'), updateCourse) // Admin protected
  .delete(verifyFirebaseToken, deleteCourse); // Admin protected

export default router;