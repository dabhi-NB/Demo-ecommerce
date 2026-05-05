import mongoose, { Document, Schema } from "mongoose";

export interface ISeoMeta extends Document {
  url: string;
  title: string;
  keyword: string;
  description: string;
  last_modified?: string;
  change_frequency?: string;
  priority?: number;
  sitemap_enable?: number;
  created_at?: Date;
  updated_at: Date;
}

const SeoMetaSchema: Schema = new Schema({
  url: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  keyword: { type: String },
  description: { type: String },
  last_modified: { type: String, default: "" },
  change_frequency: { type: String, default: "Select Frequency" },
  priority: { type: Number, default: 1 },
  sitemap_enable: { type: Number, default: 1 }, // 1 = enabled, 0 = disabled
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model<ISeoMeta>("SeoMeta", SeoMetaSchema, "seo_meta");
