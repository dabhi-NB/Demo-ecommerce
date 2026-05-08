import { asyncHandler } from "../middlewares/asyncHandler";
import Coupon from "../models/couponModel";

// POST /coupons/validate
export const validateCoupon = asyncHandler(async (req: any, res: any) => {
    const { code, cartTotal } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    if (!cartTotal || isNaN(Number(cartTotal)) || Number(cartTotal) <= 0) {
        return res.status(400).json({ success: false, message: 'Valid cart total is required' });
    }

    const total = Number(cartTotal);
    const upperCode = code.trim().toUpperCase();

    const coupon = await Coupon.findOne({ code: upperCode });

    if (!coupon) {
        return res.status(200).json({
            success: true,
            data: { valid: false, discount: 0, message: 'Invalid coupon code' },
        });
    }

    if (!coupon.isActive) {
        return res.status(200).json({
            success: true,
            data: { valid: false, discount: 0, message: 'This coupon is no longer active' },
        });
    }

    const now = new Date();

    // Check validFrom — coupon not yet started
    if (now < new Date(coupon.validFrom)) {
        return res.status(200).json({
            success: true,
            data: { valid: false, discount: 0, message: 'This coupon is not yet active' },
        });
    }

    // Check validUntil — coupon expired
    if (now > new Date(coupon.validUntil)) {
        return res.status(200).json({
            success: true,
            data: { valid: false, discount: 0, message: 'This coupon has expired' },
        });
    }

    // Check usage limit (null = unlimited)
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return res.status(200).json({
            success: true,
            data: { valid: false, discount: 0, message: 'Coupon usage limit reached' },
        });
    }

    // Check minimum order amount
    if (total < coupon.minOrderAmount) {
        return res.status(200).json({
            success: true,
            data: {
                valid: false,
                discount: 0,
                message: `Minimum order amount ₹${coupon.minOrderAmount.toLocaleString('en-IN')} required for this coupon`,
            },
        });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
        const raw = (coupon.discountValue / 100) * total;
        discount = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
    } else {
        // fixed
        discount = coupon.discountValue;
    }
    discount = Math.round(discount);

    return res.status(200).json({
        success: true,
        data: {
            valid: true,
            discount,
            code: coupon.code,
            message: `Coupon applied! You save ₹${discount.toLocaleString('en-IN')}`,
        },
    });
});