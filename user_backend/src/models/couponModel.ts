import mongoose, { Document, Schema } from "mongoose";

export interface ICoupon extends Document {
    code: string
    type: 'percent' | 'flat'
    value: number
    minOrderAmount: number
    maxDiscount?: number
    expiresAt: Date
    usageLimit: number
    usedCount: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'flat'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true })

couponSchema.index({ isActive: 1, expiresAt: 1 })
 
const Coupon = mongoose.model('Coupon', couponSchema, 'coupons')
export default Coupon
