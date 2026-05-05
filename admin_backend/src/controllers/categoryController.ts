import { Request, Response } from 'express';
import Category from '../models/categoryModel';
import Product from '../models/productModel';
import { asyncHandler } from '../middlewares/asyncHandler';
import { deleteFile, deleteCategoryImage } from '../utils/fileUpload';

// Get all categories with pagination, search, and filter
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query: Record<string, any> = {};

  // Search by name
  if (req.query.q) {
    query.name = { $regex: req.query.q, $options: 'i' };
  }

  // Filter by isActive
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  // Get total count
  const total = await Category.countDocuments(query);

  // Get categories with pagination and sorting
  const categories = await Category.find(query)
    .sort({ sortOrder: 1, name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.status(200).json({
    status: 1,
    message: 'Categories fetched successfully',
    data: categories,
    total,
    page,
    limit,
  });
});

// Get category by ID
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ status: 0, message: 'Category ID is required' });
  }

  const category = await Category.findById(id).lean();

  if (!category) {
    return res.status(404).json({ status: 0, message: 'Category not found' });
  }

  return res.status(200).json({
    status: 1,
    data: category,
  });
});

// Create new category
export const createCategory = asyncHandler(async (req: any, res: Response) => {
  const { name, description, isActive, sortOrder } = req.body;

  if (!name) {
    return res.status(400).json({ status: 0, message: 'Name is required' });
  }

  // Generate slug from name
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Check if slug already exists
  const existingCategory = await Category.findOne({ slug });
  if (existingCategory) {
    return res.status(400).json({ status: 0, message: 'Category with this name already exists' });
  }

  const categoryData: Record<string, any> = {
    name,
    slug,
    description: description || '',
    isActive: isActive !== undefined ? isActive : true,
    sortOrder: sortOrder || 0,
  };

  // Handle image upload
  if (req.file) {
    categoryData.image = `${req.body.slug || slug}/${req.file.filename}`;
  }

  const category = await Category.create(categoryData);

  return res.status(201).json({
    status: 1,
    message: 'Category created successfully',
    data: category,
  });
});

// Update category
export const updateCategory = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, description, isActive, sortOrder } = req.body;

  if (!id) {
    return res.status(400).json({ status: 0, message: 'Category ID is required' });
  }

  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({ status: 0, message: 'Category not found' });
  }

  const updateData: Record<string, any> = {
    description: description || category.description,
    isActive: isActive !== undefined ? isActive : category.isActive,
    sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder,
  };

  // Update name and slug if name is changed
  if (name && name !== category.name) {
    updateData.name = name;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if new slug already exists
    const existingCategory = await Category.findOne({ slug, _id: { $ne: id } });
    if (existingCategory) {
      return res.status(400).json({ status: 0, message: 'Category with this name already exists' });
    }
    updateData.slug = slug;
  }

  // Handle new image upload
  if (req.file) {
    // Delete old image if exists
    if (category.image) {
      deleteCategoryImage(`categories/${category.slug}/${category.image}`);
    }
    // Save full path: slug/filename
    const newSlug = updateData.slug || category.slug;
    updateData.image = `${newSlug}/${req.file.filename}`;
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  ).lean();

  return res.status(200).json({
    status: 1,
    message: 'Category updated successfully',
    data: updatedCategory,
  });
});

// Delete category
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ status: 0, message: 'Category ID is required' });
  }

  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({ status: 0, message: 'Category not found' });
  }

  // Check if any product uses this category
  const productCount = await Product.countDocuments({ category: id });

  if (productCount > 0) {
    return res.status(400).json({
      status: 0,
      message: `Cannot delete category. ${productCount} product(s) are using this category.`,
    });
  }

  // Delete image file if exists
  if (category.image) {
    deleteCategoryImage(`categories/${category.slug}/${category.image}`);
  }

  // Delete the category
  await Category.findByIdAndDelete(id);

  return res.status(200).json({
    status: 1,
    message: 'Category deleted successfully',
  });
});

// Get categories for select/dropdown (active only)
// Get categories for select/dropdown (active only)
export const getCategoriesForSelect = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true })
    .select('_id name slug')
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Transform to label/value format for dropdown
  const formattedCategories = categories.map(cat => ({
    label: cat.name,
    value: cat._id.toString()
  }));

  return res.status(200).json({
    status: 1,
    data: formattedCategories,
  });
});
