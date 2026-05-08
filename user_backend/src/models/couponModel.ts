import mongoose, { Document, Schema } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed';

export interface ICoupon extends Document {
    code: string;
    description: string;
    discountType: DiscountType;
    discountValue: number;
    minOrderAmount: number;
    maxDiscount: number | null;
    usageLimit: number | null;
    usedCount: number;
    validFrom: Date;
    validUntil: Date;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const CouponSchema = new Schema<ICoupon>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            index: true,
            trim: true,
        },
        description: { type: String, default: '' },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'percentage',
        },
        discountValue: { type: Number, required: true, min: 0 },
        minOrderAmount: { type: Number, default: 0 },
        maxDiscount: { type: Number, default: null },
        usageLimit: { type: Number, default: null },
        usedCount: { type: Number, default: 0 },
        validFrom: { type: Date, required: true },
        validUntil: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
    },
    { collection: 'coupons', timestamps: true }
);

CouponSchema.index({ isActive: 1, validUntil: 1 });

export default mongoose.models.Coupon ||
    mongoose.model<ICoupon>('Coupon', CouponSchema);