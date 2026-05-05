import mongoose, { Document, Schema } from 'mongoose'

export interface IVariantCombination {
  name: string
  value: string
}

export interface ICartItem {
  product: mongoose.Types.ObjectId
  variantId: mongoose.Types.ObjectId | null
  variantCombination: IVariantCombination[]
  quantity: number
  price: number        // snapshot at time of adding
  name: string         // snapshot
  image: string        // snapshot
  slug: string         // snapshot
  maxStock: number     // current stock snapshot
  variantSku: string  // snapshot of variant SKU
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId
  items: ICartItem[]
  updatedAt: Date
}

const variantCombinationSchema = new Schema<IVariantCombination>({
  name: { type: String, required: true },
  value: { type: String, required: true },
}, { _id: false })

const cartItemSchema = new Schema<ICartItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId, default: null },
  variantCombination: [variantCombinationSchema],
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  slug: { type: String, required: true },
  maxStock: { type: Number, default: 999 },
  variantSku: { type: String, default: '' },
}, { _id: true })

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
)

export default mongoose.model<ICart>('Cart', cartSchema, 'carts')
