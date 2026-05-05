import { asyncHandler } from "../middlewares/asyncHandler";
import Coupon from "../models/couponModel";

// FUNCTION 1: validateCoupon - POST /coupons/validate
export const validateCoupon = asyncHandler(async (req: any, res: any) => {
    const { code, cartTotal } = req.body

    if (!code || typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({ success: false, message: 'Coupon code is required' })
    }

    if (!cartTotal || isNaN(Number(cartTotal)) || Number(cartTotal) <= 0) {
        return res.status(400).json({ success: false, message: 'Valid cart total is required' })
    }

    const total = Number(cartTotal)
    const upperCode = code.trim().toUpperCase()

    const coupon = await Coupon.findOne({ code: upperCode })

    // Does not exist
    if (!coupon) {
        return res.status(200).json({
            success: true,
            data: { valid: false, discount: 0, message: 'Invalid coupon code' },
        })
    }

    // Inactive
    if (!coupon.isActive) {
        return res.status(200).json({
            success: true,
            data: { valid: false, discount: 0, message: 'This coupon is no longer active' },
        })
    }

    // Expired
    if (new Date() > new Date(coupon.expiresAt)) {
        return res.status(200).json({
            success: true,
            data: { valid: false, discount: 0, message: 'This coupon has expired' },
        })
    }

    // Usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
        return res.status(200).json({
            success: true,
            data: { valid: false, discount: 0, message: 'Coupon usage limit reached' },
        })
    }

    // Min order amount
    if (total < coupon.minOrderAmount) {
        return res.status(200).json({
            success: true,
            data: {
                valid: false,
                discount: 0,
                message: `Minimum order amount ₹${coupon.minOrderAmount.toLocaleString('en-IN')} required for this coupon`,
            },
        })
    }

    // Calculate discount
    let discount = 0
    if (coupon.type === 'percent') {
        const raw = (coupon.value / 100) * total
        discount = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw
    } else {
        discount = coupon.value
    }
    discount = Math.round(discount)

    return res.status(200).json({
        success: true,
        data: {
            valid: true,
            discount,
            code: coupon.code,
            message: `Coupon applied! You save ₹${discount.toLocaleString('en-IN')}`,
        },
    })
})
