import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string
  slug: string
  description?: string
  image?: string
  parent?: mongoose.Types.ObjectId
  isActive: boolean
  sortOrder: number
  seoTitle?: string
  seoDescription?: string
  createdAt: Date
  updatedAt: Date
}

const CategorySchema: Schema<ICategory> = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, trim: true },
  image: { type: String },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  seoTitle: { type: String },
  seoDescription: { type: String },
}, { timestamps: true })

// Index for faster queries
CategorySchema.index({ isActive: 1, sortOrder: 1 })

const Category = mongoose.model('Category', CategorySchema, 'categories')
export default Category
