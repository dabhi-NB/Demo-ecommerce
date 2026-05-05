import mongoose, { Document, Schema } from 'mongoose'

export interface IWishlist extends Document {
  user: mongoose.Types.ObjectId
  products: mongoose.Types.ObjectId[]   // product IDs (unique)
}

const wishlistSchema = new Schema<IWishlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
)

// Ensure no duplicate product IDs in wishlist
wishlistSchema.index({ user: 1, 'products': 1 })

export default mongoose.model<IWishlist>('Wishlist', wishlistSchema, 'wishlists')
