import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
  parent: Types.ObjectId | null;
  level: number;
  path: string;       // e.g. "electronics/mobiles/smartphones"
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },

    // ── Sub-category fields ──
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    level: { type: Number, default: 0 }, // 0 = root, 1 = sub, 2 = sub-sub
    path: { type: String, default: '' },  // slug path for breadcrumbs

    // ── SEO fields ──
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
  },
  {
    collection: 'categories',
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual: children categories
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// Pre-save: auto-generate slug and path
CategorySchema.pre('save', async function (this: ICategory, next) {
  // Auto slug from name
  if (this.isModified('name') && !this.isModified('slug')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Build path + level from parent
  if (this.parent) {
    const parent = await mongoose.model('Category').findById(this.parent).lean() as any;
    if (parent) {
      this.level = (parent.level || 0) + 1;
      this.path = parent.path ? `${parent.path}/${this.slug}` : parent.slug;
    }
  } else {
    this.level = 0;
    this.path = this.slug;
  }

  next();
});

export default mongoose.model<ICategory>('Category', CategorySchema);