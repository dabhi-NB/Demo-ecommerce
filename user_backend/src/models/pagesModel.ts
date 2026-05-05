import mongoose, { Document, Schema } from "mongoose";

export interface IPage extends Document {
  slug: string;
  title: string;
  body: string;
}

interface IPageModel extends mongoose.Model<IPage> {
  findBySlug(slug: string): Promise<IPage | null>;
}

const PageSchema: Schema = new Schema(
  {
    slug: { type: String, unique: true, index: true },
    title: { type: String },
    body: { type: String },
  },
  {
    timestamps: false,
    collection: "pages",
  }
);

PageSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug });
};

export default mongoose.model<IPage, IPageModel>("Page", PageSchema, "pages");
