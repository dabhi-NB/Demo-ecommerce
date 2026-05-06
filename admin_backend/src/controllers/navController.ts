import { Request, Response } from 'express';
import NavItem from '../models/navModel';
import { asyncHandler } from '../middlewares/asyncHandler';

// ── GET ALL NAV ITEMS (tree structure) ──
export const getAllNavItems = asyncHandler(async (req: Request, res: Response) => {
  const location = (req.query.location as string) || 'header';

  // Get root level items
  const items = await NavItem.find({ parent: null, location, isActive: true })
    .sort({ order: 1 })
    .populate({
      path: 'children',
      match: { isActive: true },
      options: { sort: { order: 1 } },
      populate: {
        path: 'children',
        match: { isActive: true },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  return res.status(200).json({
    status: 1,
    message: 'Nav items fetched',
    data: items,
  });
});

// ── GET ALL NAV ITEMS (flat list for admin) ──
export const getAllNavFlat = asyncHandler(async (req: Request, res: Response) => {
  const items = await NavItem.find({})
    .sort({ location: 1, order: 1 })
    .lean();

  return res.status(200).json({
    status: 1,
    data: items,
  });
});

// ── GET NAV ITEM BY ID ──
export const getNavById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await NavItem.findById(id).lean();

  if (!item) return res.status(404).json({ status: 0, message: 'Nav item not found' });

  return res.status(200).json({ status: 1, data: item });
});

// ── CREATE NAV ITEM ──
export const createNavItem = asyncHandler(async (req: Request, res: Response) => {
  const { label, url, icon, order, isActive, isExternal, openInNewTab, parent, location, visibleTo } = req.body;

  if (!label || !url) {
    return res.status(400).json({ status: 0, message: 'Label and URL are required' });
  }

  // Validate parent if provided
  if (parent) {
    const parentItem = await NavItem.findById(parent);
    if (!parentItem) {
      return res.status(400).json({ status: 0, message: 'Parent nav item not found' });
    }
  }

  const item = await NavItem.create({
    label,
    url,
    icon: icon || '',
    order: order || 0,
    isActive: isActive !== undefined ? isActive : true,
    isExternal: isExternal || false,
    openInNewTab: openInNewTab || false,
    parent: parent || null,
    location: location || 'header',
    visibleTo: visibleTo || 'all',
  });

  return res.status(201).json({
    status: 1,
    message: 'Nav item created successfully',
    data: item,
  });
});

// ── UPDATE NAV ITEM ──
export const updateNavItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { label, url, icon, order, isActive, isExternal, openInNewTab, parent, location, visibleTo } = req.body;

  const item = await NavItem.findById(id);
  if (!item) return res.status(404).json({ status: 0, message: 'Nav item not found' });

  // Prevent circular parent references
  if (parent && parent.toString() === id) {
    return res.status(400).json({ status: 0, message: 'Item cannot be its own parent' });
  }

  const updated = await NavItem.findByIdAndUpdate(
    id,
    {
      ...(label !== undefined && { label }),
      ...(url !== undefined && { url }),
      ...(icon !== undefined && { icon }),
      ...(order !== undefined && { order }),
      ...(isActive !== undefined && { isActive }),
      ...(isExternal !== undefined && { isExternal }),
      ...(openInNewTab !== undefined && { openInNewTab }),
      ...(parent !== undefined && { parent: parent || null }),
      ...(location !== undefined && { location }),
      ...(visibleTo !== undefined && { visibleTo }),
    },
    { new: true }
  ).lean();

  return res.status(200).json({
    status: 1,
    message: 'Nav item updated successfully',
    data: updated,
  });
});

// ── DELETE NAV ITEM ──
export const deleteNavItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const item = await NavItem.findById(id);
  if (!item) return res.status(404).json({ status: 0, message: 'Nav item not found' });

  // Also delete children
  await NavItem.deleteMany({ parent: id });
  await NavItem.findByIdAndDelete(id);

  return res.status(200).json({
    status: 1,
    message: 'Nav item deleted successfully',
  });
});

// ── REORDER NAV ITEMS ──
export const reorderNavItems = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body; // Array of { id, order }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 0, message: 'Items array is required' });
  }

  const bulkOps = items.map((item: { id: string; order: number }) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { $set: { order: item.order } },
    },
  }));

  await NavItem.bulkWrite(bulkOps);

  return res.status(200).json({
    status: 1,
    message: 'Nav items reordered successfully',
  });
});

// ── PUBLIC: Get nav for user frontend ──
export const getPublicNav = asyncHandler(async (req: Request, res: Response) => {
  const location = (req.query.location as string) || 'header';

  const items = await NavItem.find({ parent: null, location, isActive: true })
    .select('-__v')
    .sort({ order: 1 })
    .populate({
      path: 'children',
      match: { isActive: true },
      select: '-__v',
      options: { sort: { order: 1 } },
      populate: {
        path: 'children',
        match: { isActive: true },
        select: '-__v',
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  return res.status(200).json({
    status: 1,
    data: items,
  });
});
