// import express from 'express';
// import { verifyFirebaseToken } from '../middleware/auth.js';
// import { getBanners, getBannerById, createBanner, updateBanner, deleteBanner, toggleBannerStatus } from '../controllers/bannerController.js';

// const router = express.Router();

// router.route('/')
//   .get(getBanners) // public banners
//   .post(verifyFirebaseToken, createBanner);

// router.route('/:id')
//   .get(getBannerById) // public banner by id
//   .put(verifyFirebaseToken, updateBanner)
//   .delete(verifyFirebaseToken, deleteBanner);

// router.put('/:id/toggle', verifyFirebaseToken, toggleBannerStatus);

// export default router;
