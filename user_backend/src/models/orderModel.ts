import mongoose, { Document, Schema } from "mongoose";

interface IVariantCombination {
    name: string
    value: string
}

interface IOrderItem {
    product: mongoose.Types.ObjectId
    variantId: mongoose.Types.ObjectId | null
    variantCombination: IVariantCombination[]
    name: string        // snapshot — product name at time of order
    image: string       // snapshot — first image at time of order
    price: number       // snapshot — price paid
    quantity: number
    slug: string       // snapshot — product slug
    variantSku: string // snapshot — variant SKU if applicable
}

interface IShippingAddress {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
}

interface ITimeline {
    status: string
    time: Date
    note?: string
}

export interface IOrder extends Document {
    orderNumber: string
    user: mongoose.Types.ObjectId
    items: IOrderItem[]
    shippingAddress: IShippingAddress
    paymentMethod: 'cod' | 'online'
    paymentStatus: 'pending' | 'paid' | 'failed'
    paymentId?: string
    status: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
    subtotal: number
    tax: number
    shippingCharge: number
    discount: number
    totalAmount: number
    coupon?: { code: string; discount: number }
    cancellationReason?: string
    timeline: ITimeline[]
    estimatedDelivery?: Date
    createdAt: Date
    updatedAt: Date
}

const variantCombinationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: String, required: true },
}, { _id: false })

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    variantCombination: [variantCombinationSchema],
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    slug: { type: String, required: true },
    variantSku: { type: String, default: '' },
}, { _id: false })

const shippingAddressSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
}, { _id: false })

const timelineSchema = new mongoose.Schema({
    status: { type: String, required: true },
    time: { type: Date, default: Date.now },
    note: { type: String },
}, { _id: false })

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ['cod', 'online'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paymentId: { type: String },
    status: {
        type: String,
        enum: ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'placed'
    },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    coupon: {
        code: String,
        discount: Number,
    },
    cancellationReason: { type: String },
    timeline: [timelineSchema],
    estimatedDelivery: { type: Date },
}, { timestamps: true })

// Pre-save hook
orderSchema.pre('save', function (next) {
    // Auto-generate order number for new orders
    if (this.isNew) {
        const timestamp = Date.now().toString(36).toUpperCase()
        const random = Math.random().toString(36).substring(2, 7).toUpperCase()
        this.orderNumber = 'RVM' + timestamp + random

            // Add initial timeline entry
            ; (this as any).timeline = [{
                status: 'placed',
                time: new Date(),
                note: 'Order placed successfully'
            }]

        // Set estimated delivery (5 business days from now)
        const delivery = new Date()
        delivery.setDate(delivery.getDate() + 5)
        this.estimatedDelivery = delivery
    }
    next()
})

// Indexes
orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ status: 1 })

const Order = mongoose.model('Order', orderSchema, 'orders')
export default Order
