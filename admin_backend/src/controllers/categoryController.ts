import { Request, Response } from 'express';
import Category from '../models/categoryModel';
import Product from '../models/productModel';
import { asyncHandler } from '../middlewares/asyncHandler';
import { deleteCategoryImage } from '../utils/fileUpload';

// ── GET ALL (flat, paginated) ──
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const query: Record<string, any> = {};
  if (req.query.q) query.name = { $regex: req.query.q, $options: 'i' };
  if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
  if (req.query.parent !== undefined) {
    query.parent = req.query.parent === 'null' ? null : req.query.parent;
  }

  const total = await Category.countDocuments(query);
  const categories = await Category.find(query)
    .populate('parent', 'name slug')
    .sort({ sortOrder: 1, name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.status(200).json({ status: 1, message: 'Categories fetched', data: categories, total, page, limit });
});

// ── GET CATEGORY TREE (nested) ──
export const getCategoryTree = asyncHandler(async (_req: Request, res: Response) => {
  const all = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Build tree
  const map: Record<string, any> = {};
  const roots: any[] = [];

  all.forEach((cat: any) => {
    map[cat._id.toString()] = { ...cat, children: [] };
  });

  all.forEach((cat: any) => {
    if (cat.parent) {
      const parentId = cat.parent.toString();
      if (map[parentId]) {
        map[parentId].children.push(map[cat._id.toString()]);
      }
    } else {
      roots.push(map[cat._id.toString()]);
    }
  });

  return res.status(200).json({ status: 1, data: roots });
});

// ── GET BY ID ──
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ status: 0, message: 'ID required' });

  const category = await Category.findById(id).populate('parent', 'name slug').lean();
  if (!category) return res.status(404).json({ status: 0, message: 'Category not found' });

  return res.status(200).json({ status: 1, data: category });
});

// ── CREATE ──
export const createCategory = asyncHandler(async (req: any, res: Response) => {
  const { name, description, isActive, sortOrder, parent, metaTitle, metaDescription } = req.body;

  if (!name) return res.status(400).json({ status: 0, message: 'Name is required' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existing = await Category.findOne({ slug });
  if (existing) return res.status(400).json({ status: 0, message: 'Category with this name already exists' });

  // Validate parent
  if (parent) {
    const parentCat = await Category.findById(parent);
    if (!parentCat) return res.status(400).json({ status: 0, message: 'Parent category not found' });
  }

  const categoryData: Record<string, any> = {
    name, slug,
    description: description || '',
    isActive: isActive !== undefined ? isActive : true,
    sortOrder: sortOrder || 0,
    parent: parent || null,
    metaTitle: metaTitle || '',
    metaDescription: metaDescription || '',
  };

  if (req.file) {
    categoryData.image = `${slug}/${req.file.filename}`;
  }

  const category = await Category.create(categoryData);

  return res.status(201).json({ status: 1, message: 'Category created successfully', data: category });
});

// ── UPDATE ──
export const updateCategory = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, description, isActive, sortOrder, parent, metaTitle, metaDescription } = req.body;

  if (!id) return res.status(400).json({ status: 0, message: 'ID required' });

  const category = await Category.findById(id);
  if (!category) return res.status(404).json({ status: 0, message: 'Category not found' });

  // Prevent circular parent
  if (parent && parent.toString() === id) {
    return res.status(400).json({ status: 0, message: 'Category cannot be its own parent' });
  }

  const updateData: Record<string, any> = {
    description: description ?? category.description,
    isActive: isActive !== undefined ? isActive : category.isActive,
    sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder,
    parent: parent !== undefined ? (parent || null) : category.parent,
    metaTitle: metaTitle ?? category.metaTitle,
    metaDescription: metaDescription ?? category.metaDescription,
  };

  if (name && name !== category.name) {
    updateData.name = name;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Category.findOne({ slug, _id: { $ne: id } });
    if (existing) return res.status(400).json({ status: 0, message: 'Category with this name already exists' });
    updateData.slug = slug;
  }

  if (req.file) {
    if (category.image) deleteCategoryImage(`upload/categories/${category.image}`);
    const newSlug = updateData.slug || category.slug;
    updateData.image = `${newSlug}/${req.file.filename}`;
  }

  const updated = await Category.findByIdAndUpdate(id, updateData, { new: true })
    .populate('parent', 'name slug')
    .lean();

  return res.status(200).json({ status: 1, message: 'Category updated', data: updated });
});

// ── DELETE ──
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ status: 0, message: 'ID required' });

  const category = await Category.findById(id);
  if (!category) return res.status(404).json({ status: 0, message: 'Category not found' });

  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    return res.status(400).json({ status: 0, message: `Cannot delete: ${productCount} product(s) using this category` });
  }

  // Check for sub-categories
  const subCount = await Category.countDocuments({ parent: id });
  if (subCount > 0) {
    return res.status(400).json({ status: 0, message: `Cannot delete: ${subCount} sub-categories exist. Delete them first.` });
  }

  if (category.image) deleteCategoryImage(`upload/categories/${category.image}`);
  await Category.findByIdAndDelete(id);

  return res.status(200).json({ status: 1, message: 'Category deleted' });
});

// ── SELECT DROPDOWN (active, flat) ──
export const getCategoriesForSelect = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true })
    .select('_id name slug parent level')
    .sort({ level: 1, sortOrder: 1, name: 1 })
    .lean();

  const formatted = categories.map((cat: any) => ({
    label: cat.level > 0 ? `${'—'.repeat(cat.level)} ${cat.name}` : cat.name,
    value: cat._id.toString(),
    parent: cat.parent,
    level: cat.level,
  }));

  return res.status(200).json({ status: 1, data: formatted });
});
