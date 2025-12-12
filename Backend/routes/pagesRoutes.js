import { Router } from 'express';
import { getHomePage, getAboutPage } from '../controllers/pagesController.js';

const router = Router();

// Combined page routes
router.get('/home', getHomePage);
router.get('/about', getAboutPage);

export default router;

