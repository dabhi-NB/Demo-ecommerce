import mongoose, { Document, Schema } from "mongoose";

export interface ISeoMeta extends Document {
    url: string;
    title: string;
    keyword: string;
    description: string;
    sitemap_enable: number;
    last_modified: string;
    change_frequency: string;
    priority: number;
    created_at: Date;
    updated_at: Date;
}

interface ISeoMetaModel extends mongoose.Model<ISeoMeta> {
    getActiveSitemapEntries(): Promise<ISeoMeta[]>;
    getMetaData(url: string): Promise<ISeoMeta | null>;
}

const SeoMetaSchema: Schema<ISeoMeta> = new Schema(
    {
        url: { type: String, unique: true, index: true, required: true },
        title: { type: String },
        keyword: { type: String },
        description: { type: String },
        sitemap_enable: { type: Number, default: 1, index: true }, // 1 = enabled, 0 = disabled
        last_modified: { type: String, default: () => new Date().toISOString() },
        change_frequency: { type: String, default: "weekly" }, // daily, weekly, monthly, yearly
        priority: { type: Number, default: 0.5, min: 0.0, max: 1.0 },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
        collection: "seo_meta",
    }
);

// Static methods
SeoMetaSchema.statics.getActiveSitemapEntries = function () {
    return this.find({ sitemap_enable: 1 }).sort({ priority: -1 });
};

SeoMetaSchema.statics.getMetaData = function (url: string) {
    return this.findOne({ url });
};

// Pre-save middleware to update timestamps
SeoMetaSchema.pre<ISeoMeta>("save", function (next) {
    this.updated_at = new Date();
    if (!this.created_at) {
        this.created_at = new Date();
    }
    next();
});

const SeoMetaModel = mongoose.model<ISeoMeta, ISeoMetaModel>("SeoMeta", SeoMetaSchema, "seo_meta");

export default SeoMetaModel;
