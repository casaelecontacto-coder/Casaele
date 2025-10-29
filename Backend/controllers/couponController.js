import Coupon from '../models/Coupon.js';

// @route   GET /api/coupons
// @desc    Get all coupons
// @access  Admin
export async function getCoupons(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const coupons = await Coupon.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Coupon.countDocuments(query);

    res.status(200).json({
      coupons,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

// @route   GET /api/coupons/:id
// @desc    Get single coupon
// @access  Admin
export async function getCouponById(req, res) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.status(200).json(coupon);
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

// @route   POST /api/coupons
// @desc    Create new coupon
// @access  Admin
export async function createCoupon(req, res) {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({ message: 'Coupon created successfully', coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Coupon with this code already exists' });
    }
    console.error('Error creating coupon:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

// @route   PUT /api/coupons/:id
// @desc    Update coupon
// @access  Admin
export async function updateCoupon(req, res) {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.status(200).json({ message: 'Coupon updated successfully', coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Coupon with this code already exists' });
    }
    console.error('Error updating coupon:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

// @route   DELETE /api/coupons/:id
// @desc    Delete coupon
// @access  Admin
export async function deleteCoupon(req, res) {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

// @route   PUT /api/coupons/:id/toggle
// @desc    Toggle coupon active status
// @access  Admin
export async function toggleCouponStatus(req, res) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    
    res.status(200).json({ 
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`, 
      coupon 
    });
  } catch (error) {
    console.error('Error toggling coupon status:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

// @route   POST /api/coupons/validate
// @desc    Validate coupon code
// @access  Public
export async function validateCoupon(req, res) {
  try {
    const { code, orderAmount = 0 } = req.body;

    if (!code) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Coupon code is required' 
      });
    }

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(), 
      isActive: true 
    });

    if (!coupon) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Invalid coupon code' 
      });
    }

    // Check if coupon is expired
    if (coupon.isExpired) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Coupon has expired' 
      });
    }

    // Check if coupon has reached usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Coupon usage limit exceeded' 
      });
    }

    // Check minimum purchase requirement
    if (coupon.minPurchase > 0 && orderAmount < coupon.minPurchase) {
      return res.status(400).json({ 
        valid: false, 
        message: `Minimum purchase amount of ₹${coupon.minPurchase} required` 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    res.status(200).json({
      valid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
        description: coupon.description
      },
      message: 'Coupon applied successfully'
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
}
