import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import SeoMeta from "../models/seoMetaModel";
import { GeneralHelper } from '../utils/general';


// Get all SEO meta records
export const getAllSeoMeta = asyncHandler(async (_req: Request, res: Response) => {
  const seoList = await SeoMeta.find().sort({ url: 1 }).lean();

  return res.status(200).json({
    status: 1,
    message: "SEO Meta fetched successfully",
    data: seoList,
  });
}); 

// Get a single SEO meta by ID
export const getSeoMetaById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.body; // <-- get ID from POST body

  if (!id) {
    return res.status(400).json({ status: 0, message: "ID is required" });
  }

  const seo = await SeoMeta.findById(id).lean();
  if (!seo) {
    return res.status(404).json({ status: 0, message: "SEO Meta not found" });
  }

  return res.status(200).json({ status: 1, data: seo });
});


// Create new SEO meta
export const createSeoMeta = asyncHandler(async (req: Request, res: Response) => {
  const { url, title, keyword, description, last_modified, change_frequency, priority, sitemap_enable } = req.body;

  const existing = await SeoMeta.findOne({ url });
  if (existing) {
    return res.status(400).json({ status: 0, message: "SEO Meta for this URL already exists" });
  }

  const seo = new SeoMeta({
    url,
    title,
    keyword,
    description,
    last_modified,
    change_frequency,
    priority,
    sitemap_enable,
  });

  await seo.save();

  return res.status(201).json({ status: 1, message: "SEO Meta created successfully", data: seo });
});


export const saveSeo = asyncHandler(async (req: Request, res: Response) => {
  const id = req.body?.id;
  if (!id) {
    return res.status(400).json({ status: 0, message: "ID is required" });
  }

  const seo = await SeoMeta.findById(id);
  if (!seo) {
    return res.status(404).json({ status: 0, message: "SEO Meta not found" });
  }

  // Basic fields
  const basicFields = ["url", "title", "keyword", "description"];
  basicFields.forEach(field => {
    if (req.body[field] !== undefined) seo.set(field, req.body[field]);
  });

  // Sitemap fields
  const sitemapEnable = Number(req.body.sitemap_enable);
  seo.set("sitemap_enable", sitemapEnable);

  if (sitemapEnable === 1) {
    // Save these fields only if sitemap is enabled
    seo.set("priority", req.body.priority ?? 0);
    seo.set("change_frequency", req.body.change_frequency || "Select Frequency");

    const lastModified = req.body.last_modified
      ? new Date(req.body.last_modified)
      : new Date();

    seo.set("last_modified", GeneralHelper.formatDateTime(lastModified));
  } else {
    seo.set("priority", null);
    seo.set("last_modified", null);
    seo.set("change_frequency", null);
  }

  // Update the record's updated_at in DB format
  seo.updated_at = new Date();

  await seo.save();

  return res.status(200).json({
    status: 1,
    message: "SEO Meta updated successfully",
    data: seo,
  });
});


// Delete SEO meta
export const deleteSeoMeta = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ status: 0, message: "ID is required" });
  }

  // Hard delete: remove document from database
  const deletedSeo = await SeoMeta.findByIdAndDelete(id);

  if (!deletedSeo) {
    return res.status(404).json({ status: 0, message: "SEO Meta not found" });
  }

  return res.status(200).json({ status: 1, message: "SEO Meta deleted successfully" });
});
