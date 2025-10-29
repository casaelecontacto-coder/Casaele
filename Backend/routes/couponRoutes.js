import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { getCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon, toggleCouponStatus, validateCoupon } from '../controllers/couponController.js';

const router = express.Router();

router.route('/')
  .get(getCoupons) // public list (or keep protected if required)
  .post(verifyFirebaseToken, createCoupon);

router.route('/validate')
  .post(validateCoupon); // public validation endpoint

router.route('/:id')
  .get(getCouponById)
  .put(verifyFirebaseToken, updateCoupon)
  .delete(verifyFirebaseToken, deleteCoupon);

router.put('/:id/toggle', verifyFirebaseToken, toggleCouponStatus);

export default router;
