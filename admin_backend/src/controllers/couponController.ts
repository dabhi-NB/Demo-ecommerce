import { Request, Response } from 'express';
import Coupon from '../models/couponModel';
import { asyncHandler } from '../middlewares/asyncHandler';

// Get all coupons with pagination, search, and filter
export const getCoupons = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query: Record<string, any> = {};

  // Search by code
  if (req.query.q) {
    query.code = { $regex: req.query.q, $options: 'i' };
  }

  // Filter by isActive
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  // Get total count
  const total = await Coupon.countDocuments(query);

  // Get coupons with pagination
  const coupons = await Coupon.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Add computed field: isExpired
  const now = new Date();
  const couponsWithMeta = coupons.map((coupon) => ({
    ...coupon,
    isExpired: coupon.validUntil ? new Date(coupon.validUntil) < now : false,
  }));

  return res.status(200).json({
    status: 1,
    message: 'Coupons fetched successfully',
    data: couponsWithMeta,
    total,
    page,
    limit,
  });
});

// Get coupon by ID
export const getCouponById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ status: 0, message: 'Coupon ID is required' });
  }

  const coupon = await Coupon.findById(id).lean();

  if (!coupon) {
    return res.status(404).json({ status: 0, message: 'Coupon not found' });
  }

  // Add isExpired computed field
  const now = new Date();
  const couponWithMeta = {
    ...coupon,
    isExpired: coupon.validUntil ? new Date(coupon.validUntil) < now : false,
  };

  return res.status(200).json({
    status: 1,
    data: couponWithMeta,
  });
});

// Create new coupon
export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    usageLimit,
    validFrom,
    validUntil,
    isActive,
  } = req.body;

  // Validate required fields
  if (!code || !discountValue || !validFrom || !validUntil) {
    return res.status(400).json({
      status: 0,
      message: 'Code, discountValue, validFrom, and validUntil are required',
    });
  }

  // Validate discountValue > 0
  if (discountValue <= 0) {
    return res.status(400).json({
      status: 0,
      message: 'Discount value must be greater than 0',
    });
  }

  // Validate validUntil > validFrom
  if (new Date(validUntil) <= new Date(validFrom)) {
    return res.status(400).json({
      status: 0,
      message: 'Valid until must be greater than valid from',
    });
  }

  // Check if code already exists
  const existingCoupon = await Coupon.findOne({
    code: code.toUpperCase(),
  });

  if (existingCoupon) {
    return res.status(400).json({
      status: 0,
      message: 'Coupon code already exists',
    });
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    description: description || '',
    discountType: discountType || 'percentage',
    discountValue: parseFloat(discountValue),
    minOrderAmount: parseFloat(minOrderAmount) || 0,
    maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
    usageLimit: usageLimit ? parseInt(usageLimit) : null,
    validFrom: new Date(validFrom),
    validUntil: new Date(validUntil),
    isActive: isActive !== undefined ? isActive : true,
  });

  return res.status(201).json({
    status: 1,
    message: 'Coupon created successfully',
    data: coupon,
  });
});

// Update coupon
export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    code,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    usageLimit,
    validFrom,
    validUntil,
    isActive,
  } = req.body;

  if (!id) {
    return res.status(400).json({ status: 0, message: 'Coupon ID is required' });
  }

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    return res.status(404).json({ status: 0, message: 'Coupon not found' });
  }

  // Check if code is being changed and if new code already exists
  if (code && code.toUpperCase() !== coupon.code) {
    const existingCoupon = await Coupon.findOne({
      code: code.toUpperCase(),
      _id: { $ne: id },
    });

    if (existingCoupon) {
      return res.status(400).json({
        status: 0,
        message: 'Coupon code already exists',
      });
    }
  }

  // Validate discountValue > 0 if provided
  if (discountValue !== undefined && discountValue <= 0) {
    return res.status(400).json({
      status: 0,
      message: 'Discount value must be greater than 0',
    });
  }

  // Validate validUntil > validFrom if both provided
  if (validFrom && validUntil && new Date(validUntil) <= new Date(validFrom)) {
    return res.status(400).json({
      status: 0,
      message: 'Valid until must be greater than valid from',
    });
  }

  // Update fields
  const updateData: Record<string, any> = {
    description: description !== undefined ? description : coupon.description,
    discountType: discountType || coupon.discountType,
    discountValue: discountValue !== undefined ? parseFloat(discountValue) : coupon.discountValue,
    minOrderAmount: minOrderAmount !== undefined ? parseFloat(minOrderAmount) : coupon.minOrderAmount,
    maxDiscount: maxDiscount !== undefined ? (maxDiscount ? parseFloat(maxDiscount) : null) : coupon.maxDiscount,
    usageLimit: usageLimit !== undefined ? (usageLimit ? parseInt(usageLimit) : null) : coupon.usageLimit,
    isActive: isActive !== undefined ? isActive : coupon.isActive,
  };

  if (code) {
    updateData.code = code.toUpperCase();
  }

  if (validFrom) {
    updateData.validFrom = new Date(validFrom);
  }

  if (validUntil) {
    updateData.validUntil = new Date(validUntil);
  }

  const updatedCoupon = await Coupon.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  ).lean();

  return res.status(200).json({
    status: 1,
    message: 'Coupon updated successfully',
    data: updatedCoupon,
  });
});

// Delete coupon
export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ status: 0, message: 'Coupon ID is required' });
  }

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    return res.status(404).json({ status: 0, message: 'Coupon not found' });
  }

  // Check if coupon has been used
  if (coupon.usedCount && coupon.usedCount > 0) {
    return res.status(400).json({
      status: 0,
      message: `Cannot delete coupon. It has been used ${coupon.usedCount} time(s).`,
    });
  }

  await Coupon.findByIdAndDelete(id);

  return res.status(200).json({
    status: 1,
    message: 'Coupon deleted successfully',
  });
});

// Validate coupon (PUBLIC endpoint for users)
export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, cartTotal } = req.body;

  if (!code) {
    return res.status(400).json({
      status: 0,
      valid: false,
      message: 'Coupon code is required',
    });
  }

  if (cartTotal === undefined || cartTotal === null) {
    return res.status(400).json({
      status: 0,
      valid: false,
      message: 'Cart total is required',
    });
  }

  const cartTotalNum = parseFloat(cartTotal);

  // Find coupon
  const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();

  if (!coupon) {
    return res.status(200).json({
      status: 1,
      valid: false,
      message: 'Invalid coupon code',
    });
  }

  const now = new Date();

  // Check if active
  if (!coupon.isActive) {
    return res.status(200).json({
      status: 1,
      valid: false,
      message: 'Coupon is not active',
    });
  }

  // Check if expired
  if (coupon.validUntil && new Date(coupon.validUntil) < now) {
    return res.status(200).json({
      status: 1,
      valid: false,
      message: 'Coupon has expired',
    });
  }

  // Check if not yet valid
  if (coupon.validFrom && new Date(coupon.validFrom) > now) {
    return res.status(200).json({
      status: 1,
      valid: false,
      message: 'Coupon is not yet valid',
    });
  }

  // Check usage limit
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return res.status(200).json({
      status: 1,
      valid: false,
      message: 'Coupon usage limit reached',
    });
  }

  // Check minimum order amount
  if (coupon.minOrderAmount && cartTotalNum < coupon.minOrderAmount) {
    return res.status(200).json({
      status: 1,
      valid: false,
      message: `Minimum order amount of ${coupon.minOrderAmount} required`,
    });
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (cartTotalNum * coupon.discountValue) / 100;
    // Apply max discount cap if set
    if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
    // Don't allow discount greater than cart total
    if (discount > cartTotalNum) {
      discount = cartTotalNum;
    }
  }

  return res.status(200).json({
    status: 1,
    valid: true,
    discount: Math.round(discount * 100) / 100,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    message: 'Coupon applied successfully',
  });
});

// Increment coupon usage count (internal helper - called by order placement)
export const incrementCouponUsage = async (couponCode: string): Promise<void> => {
  await Coupon.findOneAndUpdate(
    { code: couponCode.toUpperCase() },
    { $inc: { usedCount: 1 } }
  );
};
