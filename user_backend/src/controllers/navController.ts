import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import NavItem from '../models/navModel';


// ── GET PUBLIC NAV ITEMS ──
export const getPublicNav = asyncHandler(async (req: Request, res: Response) => {
  const { location = 'header' } = req.query;

  const validLocations = ['header', 'footer', 'sidebar'];
  const loc = validLocations.includes(String(location)) ? String(location) : 'header';

  try {
    const items = await NavItem.find({ isActive: true, location: loc })
      .sort({ order: 1 })
      .lean();


    return res.status(200).json({
      status: 1,
      message: 'Nav items fetched',
      data: items,
    });
  } catch {
    // If collection doesn't exist yet, return empty gracefully
    return res.status(200).json({
      status: 1,
      message: 'Nav items fetched',
      data: [],
    });
  }
});
