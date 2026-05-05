import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/productModel';
import { asyncHandler } from '../middlewares/asyncHandler';
import { deleteProductImage } from '../utils/fileUpload';
import * as fs from 'fs';
import * as path from 'path';
import { logStockChange } from '../models/stockHistoryModel';

// Get all products with pagination, search, and filters
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
const page = parseInt(req.query.page as string) || 1;
  let limit;
  let skip;

  // Show ALL records if no limit specified
  if (!req.query.limit || req.query.limit === '0' || req.query.limit === 'all') {
    limit = 0; // Special flag
  } else {
    limit = parseInt(req.query.limit as string) || 10;
    skip = (page - 1) * limit;
  }

  // Build query
  const query: Record<string, any> = {};

    // Search by name or sku
    if (req.query.q) {
        query.$or = [
            { name: { $regex: req.query.q, $options: 'i' } },
            { sku: { $regex: req.query.q, $options: 'i' } },
        ];
    }

    // Filter by category
    if (req.query.category) {
        query.category = req.query.category;
    }

    // Filter by isActive
    if (req.query.isActive !== undefined) {
        query.isActive = req.query.isActive === 'true';
    }

    // Filter by isFeatured
    if (req.query.isFeatured !== undefined) {
        query.isFeatured = req.query.isFeatured === 'true';
    }

    // Filter by price range
    if (req.query.priceMin) {
        query.price = { $gte: parseFloat(req.query.priceMin as string) };
    }
    if (req.query.priceMax) {
        query.price = { ...query.price, $lte: parseFloat(req.query.priceMax as string) };
    }

    // Get total count
  const total = await Product.countDocuments(query);

  // Build sort options
  let sort: Record<string, 1 | -1> = { createdAt: -1 };
  if (req.query.sort) {
    const sortField = req.query.sort as string;
    if (sortField === 'price_asc') sort = { price: 1 };
    else if (sortField === 'price_desc') sort = { price: -1 };
    else if (sortField === 'name_asc') sort = { name: 1 };
    else if (sortField === 'name_desc') sort = { name: -1 };
  }

  // Get products - ALL if no limit, else paginated
  let products;
  if (limit === 0) {
    products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .lean();
  } else {
    products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip || 0)
      .limit(limit)
      .lean();
  }

    return res.status(200).json({
        status: 1,
        message: 'Products fetched successfully',
        data: products,
        total: products.length, // Actual fetched count when unlimited
        page: limit === 0 ? 1 : page,
        limit: limit === 0 ? products.length : limit,
    });

});

// Get product by ID
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ status: 0, message: 'Product ID is required' });
    }


    // Validate and check ID exists
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('❌ Invalid ObjectId format:', id);
        return res.status(400).json({ status: 0, message: 'Invalid ObjectId format' });
    }


    console.log('🔍 Looking for product:', id);
    const product = await Product.findById(id)
        .populate('category', 'name slug')
        .lean();
    console.log('📊 Product found:', !!product);

    if (!product) {
        console.log('❌ Product not found in DB:', id);
        return res.status(404).json({ status: 0, message: 'Product not found' });
    }


    return res.status(200).json({
        status: 1,
        data: product,
    });
});

// Create new product
export const createProduct = asyncHandler(async (req: any, res: Response) => {
    const {
        name,
        description,
        shortDescription,
        category,
        brand,
        sku,
        price,
        salePrice,
        stock,
        isActive,
        isFeatured,
        tags,
        weight,
        specifications,
        compatibleWith,
        variants,
        variantOptions,
    } = req.body;

    if (!name || !price) {
        return res.status(400).json({ status: 0, message: 'Name and price are required' });
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
        return res.status(400).json({ status: 0, message: 'Product with this name already exists' });
    }

    const productData: Record<string, any> = {
        name,
        slug,
        description: description || '',
        shortDescription: shortDescription || '',
        category: category || null,
        brand: brand || '',
        sku: sku || '',
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        stock: parseInt(stock) || 0,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : [],
        weight: parseFloat(weight) || 0,
        specifications: specifications || [],
        compatibleWith: compatibleWith || [],
    };

    // Handle variants - parse JSON string from FormData
    if (variants) {
        try {
            productData.variants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        } catch (e) {
            productData.variants = [];
        }
    } else {
        productData.variants = [];
    }

    // Handle variant options - parse JSON string from FormData
    if (variantOptions) {
        try {
            productData.variantOptions = typeof variantOptions === 'string' ? JSON.parse(variantOptions) : variantOptions;
        } catch (e) {
            productData.variantOptions = [];
        }
    } else {
        productData.variantOptions = [];
    }

    // Handle multiple image uploads
    if (req.files && Array.isArray(req.files)) {
        // Get category slug for the path
        let categorySlug = 'uncategorized';
        if (category) {
            try {
                const { default: Category } = await import('../models/categoryModel');
                const categoryDoc = await Category.findById(category).select('slug').lean();
                if (categoryDoc && categoryDoc.slug) {
                    categorySlug = categoryDoc.slug;
                }
            } catch (err) {
                console.error('Error fetching category slug:', err);
            }
        }

        // Save full path: categorySlug/productSlug/filename
        productData.images = req.files.map((file: any) => `${categorySlug}/${slug}/${file.filename}`);
    }

    const product = await Product.create(productData);

    return res.status(201).json({
        status: 1,
        message: 'Product created successfully',
        data: product,
    });
});

// Update product images only (separate endpoint)
export const updateProductImages = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 0, message: 'Invalid Product ID' });
  }

  const product = await Product.findById(id);

  if (!product) {
    return res.status(404).json({ status: 0, message: 'Product not found' });
  }

  let currentImages = product.images || [];

  // Get category slug and product slug
  const category = product.category;
  let categorySlug = 'uncategorized';
  if (category) {
    try {
      const { default: Category } = await import('../models/categoryModel');
      const categoryDoc = await Category.findById(category).select('slug').lean();
      if (categoryDoc && categoryDoc.slug) {
        categorySlug = categoryDoc.slug;
      }
    } catch (err) {
      console.error('Error fetching category slug:', err);
    }
  }

  const productSlug = product.slug;

  // Handle new image uploads
  if (req.files && Array.isArray(req.files)) {
    const newImages = req.files.map((file: any) => `${categorySlug}/${productSlug}/${file.filename}`);
    currentImages = [...currentImages, ...newImages].slice(-5); // Keep max 5
  }

  // Handle image removal
  if (req.body.removeImages) {
    let imagesToRemove: string[] = [];
    if (typeof req.body.removeImages === 'string') {
      try {
        imagesToRemove = JSON.parse(req.body.removeImages);
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    } else if (Array.isArray(req.body.removeImages)) {
      imagesToRemove = req.body.removeImages;
    }

    imagesToRemove.forEach((imageUrl: string) => {
      deleteProductImage(`upload/products/${imageUrl}`);
      currentImages = currentImages.filter((img: string) => img !== imageUrl);
    });
  }

  product.images = currentImages;
  await product.save();

  return res.status(200).json({
    status: 1,
    message: 'Product images updated successfully',
    data: product
  });
});

// Update product (other fields)
export const updateProduct = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;


    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ status: 0, message: 'Invalid Product ID' });
    }

    const {
        name,
        description,
        shortDescription,
        category,
        brand,
        sku,
        price,
        salePrice,
        stock,
        isActive,
        isFeatured,
        tags,
        weight,
        specifications,
        compatibleWith,
        removeImages,
        variants,
        variantOptions,
    } = req.body;

    if (!id) {
        return res.status(400).json({ status: 0, message: 'Product ID is required' });
    }

    const product = await Product.findById(id);

    if (!product) {
        return res.status(404).json({ status: 0, message: 'Product not found' });
    }


    const updateData: Record<string, any> = {
        description: description || product.description,
        shortDescription: shortDescription || product.shortDescription,
        category: category || product.category,
        brand: brand !== undefined ? brand : product.brand,
        sku: sku !== undefined ? sku : product.sku,
        price: price ? parseFloat(price) : product.price,
        salePrice: salePrice !== undefined ? (salePrice ? parseFloat(salePrice) : null) : product.salePrice,
        stock: stock !== undefined ? parseInt(stock) : product.stock,
        isActive: isActive !== undefined ? isActive : product.isActive,
        isFeatured: isFeatured !== undefined ? isFeatured : product.isFeatured,
        weight: weight !== undefined ? parseFloat(weight) : product.weight,
    };

    // ✅ Parse JSON arrays from FormData
    if (specifications) {
        try {
            updateData.specifications = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
        } catch (e) {
            console.error('❌ specifications parse error:', e);
            updateData.specifications = product.specifications;
        }
    }

    if (compatibleWith) {
        try {
            updateData.compatibleWith = typeof compatibleWith === 'string' ? JSON.parse(compatibleWith) : compatibleWith;
        } catch (e) {
            console.error('❌ compatibleWith parse error:', e);
            updateData.compatibleWith = product.compatibleWith;
        }
    }

    if (tags) {
        try {
            // Prefer JSON.parse first (from frontend FormData)
            let parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            
            // Ensure it's an array of strings
            if (!Array.isArray(parsedTags)) {
                parsedTags = String(tags).split(',').map((t: string) => t.trim()).filter(Boolean);
            }
            
            updateData.tags = parsedTags;
            console.log('✅ Tags processed:', updateData.tags);
        } catch (e) {
            console.error('❌ Tags JSON parse failed:', tags, e);
            // Fallback: comma split
            updateData.tags = String(tags).split(',').map((t: string) => t.trim()).filter(Boolean);
            console.log('🔄 Tags fallback split:', updateData.tags);
        }
    }


    // Update name and slug if name is changed
    if (name && name !== product.name) {
        updateData.name = name;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Check if new slug already exists
        const existingProduct = await Product.findOne({ slug, _id: { $ne: id } });
        if (existingProduct) {
            return res.status(400).json({ status: 0, message: 'Product with this name already exists' });
        }
        updateData.slug = slug;
    }

    // Tags handling moved above (robust JSON + fallback)

    // Handle new image uploads (add to existing images)
    let currentImages = product.images || [];
    if (req.files && Array.isArray(req.files)) {
        // Get category slug for the path
        let categorySlug = 'uncategorized';
        if (category) {
            try {
                const { default: Category } = await import('../models/categoryModel');
                const categoryDoc = await Category.findById(category).select('slug').lean();
                if (categoryDoc && categoryDoc.slug) {
                    categorySlug = categoryDoc.slug;
                }
            } catch (err) {
                console.error('Error fetching category slug:', err);
            }
        }

        // Get product slug (use new one if name changed, otherwise existing)
        const productSlug = updateData.slug || product.slug;

        // Save full path: categorySlug/productSlug/filename
        const newImages = req.files.map((file: any) => `${categorySlug}/${productSlug}/${file.filename}`);
        // Limit to max 5 images
        currentImages = [...currentImages, ...newImages].slice(-5);
        updateData.images = currentImages;
    }

    // Handle image removal - FIXED JSON PARSING
    console.log('📁 Before removal images:', product.images);
    if (removeImages) {
        let imagesToRemove: string[] = [];

        // Fix: Parse JSON string from FormData
        if (typeof removeImages === 'string') {
            try {
                imagesToRemove = JSON.parse(removeImages);
                console.log('✅ Parsed JSON removeImages:', imagesToRemove);
            } catch (e) {
                console.error('❌ JSON parse error:', e);
                imagesToRemove = [];
            }
        } else if (Array.isArray(removeImages)) {
            imagesToRemove = removeImages;
            console.log('✅ Direct array removeImages:', imagesToRemove);
        }

        console.log('🗑️  Images to remove:', imagesToRemove);

        imagesToRemove.forEach((imageUrl: string) => {
            console.log('🔥 Deleting file:', `upload/products/${imageUrl}`);
            const fullFilePath = path.join(process.cwd(), `upload/products/${imageUrl}`);
            console.log('File exists?', fs.existsSync(fullFilePath));
            const deleted = deleteProductImage(`upload/products/${imageUrl}`);
            console.log('File deleted?', deleted);

            // Remove from images array - exact path match
            currentImages = currentImages.filter((img: string) => img !== imageUrl);
        });

        updateData.images = currentImages;
        console.log('📁 After removal images:', currentImages);
    } else {
        console.log('ℹ️ No images to remove');
    }

    // Handle variants - parse JSON string from FormData
    if (variants !== undefined) {
        try {
            updateData.variants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        } catch (e) {
            updateData.variants = [];
        }
    }

    // Handle variant options - parse JSON string from FormData
    if (variantOptions !== undefined) {
        try {
            updateData.variantOptions = typeof variantOptions === 'string' ? JSON.parse(variantOptions) : variantOptions;
        } catch (e) {
            updateData.variantOptions = [];
        }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    ).populate('category', 'name slug');

    return res.status(200).json({
        status: 1,
        message: 'Product updated successfully',
        data: updatedProduct,
    });
});

// Delete product
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ status: 0, message: 'Product ID is required' });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ status: 0, message: 'Invalid Product ID' });
    }

    const product = await Product.findById(id);

    if (!product) {
        return res.status(404).json({ status: 0, message: 'Product not found' });
    }

    // Delete all product images from disk (regardless of orders)
    if (product.images && product.images.length > 0) {
        product.images.forEach((image: string) => {
            deleteProductImage(`upload/products/${image}`);
        });
    }

    // Hard delete the product (regardless of orders)
    await Product.findByIdAndDelete(id);

    return res.status(200).json({
        status: 1,
        message: 'Product deleted successfully',
    });
});

// Get featured products (for dashboard)
export const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
    const products = await Product.find({ isFeatured: true, isActive: true })
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    return res.status(200).json({
        status: 1,
        data: products,
    });
});

// Update product stock (supports base stock and variant stock)
export const updateProductStock = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const { stock, variantId } = req.body;

    if (!id) {
        return res.status(400).json({ status: 0, message: 'Product ID is required' });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ status: 0, message: 'Invalid Product ID' });
    }

    if (stock === undefined || stock === null || isNaN(parseInt(stock))) {
        return res.status(400).json({ status: 0, message: 'Stock value is required' });
    }

    const newStock = parseInt(stock);

    // Update variant stock if variantId is provided
    if (variantId) {
        // Use findOneAndUpdate for direct MongoDB update
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: id, 'variants._id': variantId },
            { $set: { 'variants.$.stock': newStock } },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ status: 0, message: 'Product or variant not found' });
        }

        // Find the variant to get variant details for logging
        const variant = updatedProduct.variants.find((v: any) => v._id.toString() === variantId);

        // Log stock history
        const variantName = variant?.combination
            ? variant.combination.map((c: any) => `${c.name}: ${c.value}`).join(', ')
            : '';

        // Get previous stock from the updated product for logging
        const previousStock = variant?.stock || 0;

        await logStockChange({
            product: updatedProduct._id,
            variantId: variantId,
            variantName: variantName,
            previousStock: previousStock,
            newStock: newStock,
            reason: 'admin_update',
            adminId: req.userData?._id,
        });

        return res.status(200).json({
            status: 1,
            message: 'Variant stock updated successfully',
            data: { _id: updatedProduct._id, variantId, stock: newStock },
        });
    }

    // Update base stock using findByIdAndUpdate
    const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { stock: newStock },
        { new: true }
    );

    if (!updatedProduct) {
        return res.status(404).json({ status: 0, message: 'Product not found' });
    }

    // Log stock history
    const previousStock = updatedProduct.stock || 0;

    await logStockChange({
        product: updatedProduct._id,
        previousStock: previousStock,
        newStock: newStock,
        reason: 'admin_update',
        adminId: req.userData?._id,
    });

    return res.status(200).json({
        status: 1,
        message: 'Product stock updated successfully',
        data: { _id: updatedProduct._id, stock: updatedProduct.stock },
    });
});

// Get product variants (public - for user side)
export const getProductVariants = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ status: 0, message: 'Product ID is required' });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ status: 0, message: 'Invalid Product ID' });
    }

    const product = await Product.findById(id)
        .select('name variants variantOptions price salePrice stock images')
        .lean() as any;

    if (!product) {
        return res.status(404).json({ status: 0, message: 'Product not found' });
    }

    // Return variantOptions for selection UI
    const variantOptions = product.variantOptions || [];

    // Return active variants with stock > 0 highlighted
    const variants = (product.variants || []).map((v: any) => ({
        _id: v._id,
        combination: v.combination,
        sku: v.sku,
        price: v.price !== null ? v.price : product.price,
        salePrice: v.salePrice !== null ? v.salePrice : product.salePrice,
        stock: v.stock,
        isActive: v.isActive,
        images: v.images && v.images.length > 0 ? v.images : product.images,
        inStock: v.stock > 0 && v.isActive,
    }));

    return res.status(200).json({
        status: 1,
        data: {
            productName: product.name,
            basePrice: product.price,
            baseSalePrice: product.salePrice,
            baseStock: product.stock,
            baseImages: product.images,
            variantOptions,
            variants,
        },
    });
});

// Bulk stock update
export const getBulkStockUpdate = asyncHandler(async (req: any, res: Response) => {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ status: 0, message: 'Updates array is required' });
    }

    let successCount = 0;
    let failedCount = 0;
    const failedUpdates: any[] = [];

    for (const update of updates) {
        try {
            const { productId, variantId, stock } = update;

            if (!productId || stock === undefined) {
                failedCount++;
                failedUpdates.push({ productId, reason: 'Missing productId or stock' });
                continue;
            }

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                failedCount++;
                failedUpdates.push({ productId, reason: 'Invalid Product ID' });
                continue;
            }

            const product = await Product.findById(productId);
            if (!product) {
                failedCount++;
                failedUpdates.push({ productId, reason: 'Product not found' });
                continue;
            }

            const newStock = parseInt(stock);

            if (variantId) {
                // Update variant stock
                const variant = product.variants.find((v: any) => v._id.toString() === variantId);
                if (!variant) {
                    failedCount++;
                    failedUpdates.push({ productId, variantId, reason: 'Variant not found' });
                    continue;
                }

                const previousStock = variant.stock;
                variant.stock = newStock;

                // Log stock history
                const variantName = variant.combination
                    ? variant.combination.map((c: any) => `${c.name}: ${c.value}`).join(', ')
                    : '';

                await logStockChange({
                    product: product._id,
                    variantId: variantId,
                    variantName: variantName,
                    previousStock: previousStock,
                    newStock: newStock,
                    reason: 'bulk_update',
                    adminId: req.userData?._id,
                });
            } else {
                // Update base stock
                const previousStock = product.stock;
                product.stock = newStock;

                // Log stock history
                await logStockChange({
                    product: product._id,
                    previousStock: previousStock,
                    newStock: newStock,
                    reason: 'bulk_update',
                    adminId: req.userData?._id,
                });
            }

            await product.save();
            successCount++;
        } catch (error) {
            failedCount++;
            failedUpdates.push({ productId: update.productId, reason: 'Error processing update' });
        }
    }

    return res.status(200).json({
        status: 1,
        message: `Bulk stock update completed: ${successCount} succeeded, ${failedCount} failed`,
        data: {
            successCount,
            failedCount,
            failedUpdates,
        },
    });
});

// Get products for select/dropdown (active only)
export const getProductsForSelect = asyncHandler(async (_req: Request, res: Response) => {
    const products = await Product.find({ isActive: true })
        .select('_id name slug price stock')
        .sort({ name: 1 })
        .lean();

    return res.status(200).json({
        status: 1,
        data: products,
    });
});
