import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVariant {
  color?: string;
  storage?: string;
}

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  variant?: IVariant;
  variantId?: string;
  variantName?: string;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface ITimeline {
  status: string;
  time: Date;
  note: string;
}

export type PaymentMethod = 'cod' | 'online';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface IOrder extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId: string;
  paymentGateway: string;
  status: OrderStatus;
  couponCode: string;
  couponDiscount: number;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  estimatedDelivery?: Date;
  timeline: ITimeline[];
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderNumber: { type: String, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [{
      product: { type: Schema.Types.ObjectId, ref: 'Product' },
      name: { type: String },
      slug: { type: String },
      image: { type: String },
      price: { type: Number },
      quantity: { type: Number },
      variant: {
        color: { type: String },
        storage: { type: String }
      },
      variantId: { type: String, default: '' },
      variantName: { type: String, default: '' }
    }],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' }
    },
    paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentId: { type: String, default: '' },
    paymentGateway: { type: String, default: '' },
    status: { type: String, enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'], default: 'placed' },
    couponCode: { type: String, default: '' },
    couponDiscount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    estimatedDelivery: { type: Date },
    timeline: [{
      status: { type: String },
      time: { type: Date },
      note: { type: String }
    }],
    notes: { type: String, default: '' }
  },
  {
    collection: 'orders',
    timestamps: true
  }
);

// Pre-save hook for auto-generating order number
OrderSchema.pre('save', function (this: IOrder, next) {
  if (!this.orderNumber) {
    this.orderNumber = 'RVM' + Date.now().toString().slice(-8);
  }
  next();
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
