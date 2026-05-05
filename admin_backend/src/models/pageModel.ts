import mongoose, { Document, Schema } from 'mongoose';

export interface IPage extends Document {
  slug: string;
  title: string;
  body: string;
  created_at?: Date;
  updated_at?: Date;
}

const PageSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: 'pages' }
);

export default mongoose.models.Page || mongoose.model<IPage>('Page', PageSchema);
