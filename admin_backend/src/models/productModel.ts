import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISpecification {
  key: string;
  value: string;
}

export interface IRatings {
  avg: number;
  count: number;
}

export interface IVariantOption {
  name: string;
  values: string[];
}

export interface IVariantCombination {
  name: string;
  value: string;
}

export interface IVariant {
  _id: Types.ObjectId;
  combination: IVariantCombination[];
  sku: string;
  price: number | null;
  salePrice: number | null;
  stock: number;
  images: string[];
  isActive: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: Types.ObjectId;
  brand: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  images: string[];
  specifications: ISpecification[];
  compatibleWith: string[];
  ratings: IRatings;
  isActive: boolean;
  isFeatured: boolean;
  hasVariants: boolean;
  tags: string[];
  weight: number;
  variantOptions: IVariantOption[];
  variants: IVariant[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: String, default: '' },
    sku: { type: String, default: '', index: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: null },
    stock: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
    specifications: { type: [{ key: String, value: String }], default: [] },
    compatibleWith: { type: [String], default: [] },
    ratings: {
      avg: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    hasVariants: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    weight: { type: Number, default: 0 },
    variantOptions: {
      type: [{
        name: { type: String },
        values: { type: [String] }
      }],
      default: []
    },
    variants: {
      type: [{
        _id: { type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
        combination: [{
          name: { type: String },
          value: { type: String }
        }],
        sku: { type: String, default: '' },
        price: { type: Number, default: null },
        salePrice: { type: Number, default: null },
        stock: { type: Number, default: 0 },
        images: { type: [String], default: [] },
        isActive: { type: Boolean, default: true }
      }],
      default: []
    }
  },
  {
    collection: 'products',
    timestamps: true
  }
);

// Virtual for total stock (sum of all variant stocks if hasVariants is true)
ProductSchema.virtual('totalStock').get(function (this: IProduct) {
  if (this.hasVariants && this.variants && this.variants.length > 0) {
    return this.variants
      .filter((v: any) => v.isActive)
      .reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
  }
  return this.stock || 0;
});

// Set toJSON and toObject to include virtuals
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

// Pre-save hook for auto-generating slug from name
ProductSchema.pre('save', function (this: IProduct, next) {
  if (this.isModified('name') && !this.isModified('slug')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);