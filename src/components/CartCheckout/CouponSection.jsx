import React, { useState } from 'react';
import { FiTag, FiCheck, FiX, FiPercent, FiDollarSign } from 'react-icons/fi';

function CouponSection({ totalPrice, onCouponApplied, appliedCoupon, onRemoveCoupon }) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderAmount: totalPrice
        })
      });

      const data = await response.json();

      if (data.valid) {
        setSuccess(data.message);
        onCouponApplied(data.coupon, data.coupon.discountAmount);
        setCouponCode('');
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setError('Failed to validate coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    setError('');
    setSuccess('');
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply Coupon</h3>
      
      {appliedCoupon ? (
        // Applied Coupon Display
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-900">
                  {appliedCoupon.code} Applied!
                </div>
                <div className="text-sm text-green-700">
                  {appliedCoupon.discountType === 'percentage' ? (
                    <span className="flex items-center gap-1">
                      <FiPercent className="w-4 h-4" />
                      {appliedCoupon.discountValue}% off
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <FiDollarSign className="w-4 h-4" />
                      ₹{appliedCoupon.discountValue} off
                    </span>
                  )}
                </div>
                {appliedCoupon.description && (
                  <div className="text-xs text-green-600 mt-1">
                    {appliedCoupon.description}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-800 p-1 rounded"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        // Coupon Input Form
        <div>
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <div className="flex-1 relative">
              <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !couponCode.trim()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  Apply
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FiX className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CouponSection;
