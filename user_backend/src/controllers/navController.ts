import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';

// Use admin_backend's NavModel via same DB
// Import from the shared model (same MongoDB connection, same collection)
const getNavModel = async () => {
  const mongoose = (await import('mongoose')).default;

  // Return existing model if already registered
  if (mongoose.models.NavItem) {
    return mongoose.models.NavItem;
  }

  const NavItemSchema = new mongoose.Schema(
    {
      label: { type: String, required: true, trim: true },
      url: { type: String, required: true },
      icon: { type: String, default: '' },
      order: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
      isExternal: { type: Boolean, default: false },
      openInNewTab: { type: Boolean, default: false },
      parent: { type: mongoose.Schema.Types.ObjectId, ref: 'NavItem', default: null },
      location: { type: String, enum: ['header', 'footer', 'sidebar'], default: 'header' },
      visibleTo: { type: String, enum: ['all', 'guest', 'user'], default: 'all' },
    },
    { collection: 'navitems', timestamps: true }
  );

  return mongoose.model('NavItem', NavItemSchema);
};

// ── GET PUBLIC NAV ITEMS ──
export const getPublicNav = asyncHandler(async (req: Request, res: Response) => {
  const { location = 'header' } = req.query;

  const validLocations = ['header', 'footer', 'sidebar'];
  const loc = validLocations.includes(String(location)) ? String(location) : 'header';

  try {
    const NavItem = await getNavModel();
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
