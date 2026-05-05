import { Request, Response } from 'express';
import Page from '../models/pageModel';
import { asyncHandler } from '../middlewares/asyncHandler';
import mongoose from 'mongoose';
// Get all pages
export const getAllPages = asyncHandler(async (_req: Request, res: Response) => {
  const pages = await Page.find({}).sort({ created_at: -1 }).lean();

  return res.status(200).json({
    status: 1,
    message: 'Pages fetched successfully',
    data: pages,
  });
});


export const getPageById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.body; // ID comes from POST body

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 0, message: 'Page ID is required or invalid' });
  }

  const page = await Page.findById(id).lean();
  if (!page) return res.status(404).json({ status: 0, message: 'Page not found' });

  return res.status(200).json({ status: 1, data: page });
});


// Update page by ID
export const savePage = asyncHandler(async (req: Request, res: Response) => {
  const { id, title, slug, body } = req.body;

  // Validate ID
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 0, message: 'Page ID is required or invalid' });
  }

  // Update page
  const page = await Page.findByIdAndUpdate(
    id,
    { title, slug, body, updated_at: new Date() },
    { new: true }
  ).lean();

  if (!page) {
    return res.status(404).json({ status: 0, message: 'Page not found' });
  }

  return res.status(200).json({ status: 1, message: 'Page updated successfully', data: page });
});
