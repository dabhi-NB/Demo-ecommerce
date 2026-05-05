import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/asyncHandler";
import CategoryModel, { ICategory } from "../models/categoryModel";
import ProductModel from "../models/productModel";

interface ApiResponse {
    status: number;
    message: string;
    data: any;
}

const formatResponse = (status: number, message: string, data: any = []): ApiResponse => ({
    status,
    message,
    data,
});

// Helper to generate unique slug
const generateUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const query: any = { slug };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        const existing = await CategoryModel.findOne(query);
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
};

// Helper to generate slug from name
const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
};

// 1. getAllCategories - GET /api/categories
export const getAllCategories = asyncHandler(
    async (req: Request, res: Response) => {
        const categories = await CategoryModel.find({ isActive: true })
            .sort({ sortOrder: 1, name: 1 })
            .lean()

        return res.json({
            success: true,
            data: categories
        })
    }
)

// 2. getCategoryBySlug - GET /api/categories/slug/:slug
export const getCategoryBySlug = asyncHandler(
    async (req: Request, res: Response) => {
        const category = await CategoryModel.findOne({
            slug: req.params.slug,
            isActive: true
        }).lean()

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            })
        }

        return res.json({ success: true, data: category })
    }
)

// 3. getCategoryById - GET /api/categories/:id
export const getCategoryById = asyncHandler(
    async (req: Request, res: Response) => {
        // FIX 1: ObjectId validation
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid ID format' })
        }

        const { id } = req.params;

        const category = await CategoryModel.findById(id)
            .populate("parent", "name slug")
            .lean();

        if (!category) {
            return res.status(404).json(
                formatResponse(0, "Category not found", [])
            );
        }

        // Get product count for this category
        const productCount = await ProductModel.countDocuments({
            category: category._id,
            isActive: true,
        });

        res.status(200).json(
            formatResponse(1, "Category retrieved successfully", {
                ...category,
                productCount,
            })
        );
    }
);

// 4. createCategory - POST /api/categories (admin only)
export const createCategory = asyncHandler(
    async (req: Request, res: Response) => {
        // Check admin role (assuming role 1 is admin)
        if (req.user_role !== 1) {
            return res.status(403).json(
                formatResponse(0, "Access denied. Admin only.", [])
            );
        }

        const { name, description, image, parent, isActive, sortOrder, seoTitle, seoDescription } = req.body;

        if (!name) {
            return res.status(400).json(
                formatResponse(0, "Category name is required", [])
            );
        }

        // Generate slug
        let slug = generateSlug(name);
        slug = await generateUniqueSlug(slug);

        const category = new CategoryModel({
            name,
            slug,
            description,
            image,
            parent: parent || null,
            isActive: isActive !== undefined ? isActive : true,
            sortOrder: sortOrder || 0,
            seoTitle,
            seoDescription,
        });

        await category.save();

        res.status(201).json(
            formatResponse(1, "Category created successfully", category)
        );
    }
);

// 5. updateCategory - PUT /api/categories/:id (admin only)
export const updateCategory = asyncHandler(
    async (req: Request, res: Response) => {
        // Check admin role (assuming role 1 is admin)
        if (req.user_role !== 1) {
            return res.status(403).json(
                formatResponse(0, "Access denied. Admin only.", [])
            );
        }

        // FIX 1: ObjectId validation
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid ID format' })
        }

        const { id } = req.params;
        const { name, description, image, parent, isActive, sortOrder, seoTitle, seoDescription } = req.body;

        const category = await CategoryModel.findById(id);

        if (!category) {
            return res.status(404).json(
                formatResponse(0, "Category not found", [])
            );
        }

        // If name changed, regenerate slug
        if (name && name !== category.name) {
            const newSlug = generateSlug(name);
            category.slug = await generateUniqueSlug(newSlug, id.toString());
            category.name = name;
        }

        // Update other fields
        if (description !== undefined) category.description = description;
        if (image !== undefined) category.image = image;
        if (parent !== undefined) category.parent = parent || null;
        if (isActive !== undefined) category.isActive = isActive;
        if (sortOrder !== undefined) category.sortOrder = sortOrder;
        if (seoTitle !== undefined) category.seoTitle = seoTitle;
        if (seoDescription !== undefined) category.seoDescription = seoDescription;

        await category.save();

        res.status(200).json(
            formatResponse(1, "Category updated successfully", category)
        );
    }
);

// 6. deleteCategory - DELETE /api/categories/:id (admin only)
export const deleteCategory = asyncHandler(
    async (req: Request, res: Response) => {
        // Check admin role (assuming role 1 is admin)
        if (req.user_role !== 1) {
            return res.status(403).json(
                formatResponse(0, "Access denied. Admin only.", [])
            );
        }

        // FIX 1: ObjectId validation
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid ID format' })
        }

        const { id } = req.params;

        const category = await CategoryModel.findById(id);

        if (!category) {
            return res.status(404).json(
                formatResponse(0, "Category not found", [])
            );
        }

        // Check if any products use this category
        const productCount = await ProductModel.countDocuments({
            category: id,
        });

        if (productCount > 0) {
            return res.status(400).json(
                formatResponse(0, "Category has products, cannot delete", [])
            );
        }

        await CategoryModel.findByIdAndDelete(id);

        res.status(200).json(
            formatResponse(1, "Category deleted successfully", [])
        );
    }
);
