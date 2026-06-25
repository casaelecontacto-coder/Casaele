import express from 'express';
import { verifyVerifiedAdmin } from '../middleware/auth.js';
import { getCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon, toggleCouponStatus, validateCoupon } from '../controllers/couponController.js';

const router = express.Router();

// Listing/creating coupons is admin-only — the public list would otherwise leak
// every coupon code. Checkout uses the public /validate endpoint instead.
router.route('/')
  .get(verifyVerifiedAdmin, getCoupons)
  .post(verifyVerifiedAdmin, createCoupon);

router.route('/validate')
  .post(validateCoupon); // public validation endpoint (checkout)

router.route('/:id')
  .get(verifyVerifiedAdmin, getCouponById)
  .put(verifyVerifiedAdmin, updateCoupon)
  .delete(verifyVerifiedAdmin, deleteCoupon);

router.put('/:id/toggle', verifyVerifiedAdmin, toggleCouponStatus);

export default router;
