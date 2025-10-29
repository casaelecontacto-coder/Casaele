import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../controllers/courseController.js';

const router = express.Router();

router.route('/')
  .get(getCourses) // Public
  .post(verifyFirebaseToken, createCourse); // Admin protected

router.route('/:id')
  .get(getCourseById) // Public
  .put(verifyFirebaseToken, updateCourse) // Admin protected
  .delete(verifyFirebaseToken, deleteCourse); // Admin protected

export default router