import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/asyncHandler";
import ProductModel from "../models/productModel";
import CategoryModel from "../models/categoryModel";
import { IProduct } from "../models/productModel";
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
    const existing = await ProductModel.findOne(query);
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

// Helper function to compute variant options and computed fields (full)
const computeProductResponse = (product: any) => {

  const variants = product.variants || []

  const activeVariants = variants.filter((v: any) => v.isActive)

  const variantOptionsMap = new Map<string, Set<string>>()

  activeVariants.forEach((variant: any) => {
    variant.combination?.forEach((opt: any) => {
      if (!variantOptionsMap.has(opt.name)) {
        variantOptionsMap.set(opt.name, new Set())
      }
      variantOptionsMap.get(opt.name)!.add(opt.value)
    })
  })

  const variantOptions = Array.from(variantOptionsMap.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values)
  }))

  const hasVariants = variants.length > 0
  const totalStock = hasVariants
    ? variants.filter((v: any) => v.isActive).reduce((s: number, v: any) => s + (v.stock || 0), 0)
    : product.stock

  let minPrice = product.price
  let maxPrice = product.price

  if (hasVariants && variants.length > 0) {
    const prices = variants
      .filter((v: any) => v.isActive)
      .map((v: any) => v.price ?? product.price)
      .filter((p: number) => typeof p === 'number')

    if (prices.length > 0) {
      minPrice = Math.min(...prices)
      maxPrice = Math.max(...prices)
    }
  }

  return {
    _id: product._id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    category: product.category,
    brand: product.brand,
    sku: product.sku,
    price: product.price,
    salePrice: product.salePrice,
    stock: product.stock,
    images: product.images,
    variants: variants,
    variantOptions: variantOptions,
    specifications: product.specifications && Array.isArray(product.specifications) ? product.specifications : [],
    compatibleWith: product.compatibleWith || [],
    ratings: product.ratings,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    hasVariants,
    totalStock,
    minPrice,
    maxPrice
  }
}

// Helper function for product list items (without full variants)
const computeProductListItem = (product: any) => {
  const variants = product.variants || []
  const hasVariants = variants.length > 0

  const totalStock = hasVariants
    ? variants.filter((v: any) => v.isActive).reduce((s: number, v: any) => s + (v.stock || 0), 0)
    : product.stock

  let minPrice = product.price
  let maxPrice = product.price

  if (hasVariants && variants.length > 0) {
    const prices = variants
      .filter((v: any) => v.isActive)
      .map((v: any) => v.price ?? product.price)
      .filter((p: number) => typeof p === 'number')

    if (prices.length > 0) {
      minPrice = Math.min(...prices)
      maxPrice = Math.max(...prices)
    }
  }

  return {
    _id: product._id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    category: product.category,
    brand: product.brand,
    sku: product.sku,
    price: product.price,
    salePrice: product.salePrice,
    stock: product.stock,
    images: product.images,
    specifications: product.specifications && Array.isArray(product.specifications) ? product.specifications : [],
    compatibleWith: product.compatibleWith || [],
    ratings: product.ratings,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    hasVariants,
    totalStock,
    minPrice,
    maxPrice
  }
}

// 1. getProducts
export const getProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = '1',
      limit = '12',
      search,
      compatibleWith,
      featured
    } = req.query

    const pageNum = parseInt(page as string) || 1
    const limitNum = parseInt(limit as string) || 12
    const skip = (pageNum - 1) * limitNum

    // Build filter
    const filter: any = {
      isActive: true, $or: [
        { stock: { $gt: 0 } },
        { "variants.stock": { $gt: 0 } }
      ]
    }

    // Category filter — lookup by slug first
    if (category) {
      const cat = await CategoryModel.findOne({ slug: category, isActive: true }).lean()
      if (cat) {
        filter.category = cat._id
      }
    }

    // Featured filter
    if (featured === 'true') {
      filter.isFeatured = true
    }

    // Brand filter
    if (brand) {
      filter.brand = new RegExp(brand as string, 'i')
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = parseInt(minPrice as string)
      if (maxPrice) filter.price.$lte = parseInt(maxPrice as string)
    }

    // Search filter (text search)
    if (search) {
      filter.$and = filter.$and || []

      filter.$and.push({
        $or: [
          { name: new RegExp(search as string, 'i') },
          { brand: new RegExp(search as string, 'i') },
          { tags: { $in: [new RegExp(search as string, 'i')] } },
          { description: new RegExp(search as string, 'i') }
        ]
      })
    }

    // compatibleWith filter
    if (compatibleWith) {
      filter.compatibleWith = { $in: [compatibleWith as string] }
    }

    // Sort options
    let sortObj: any = { createdAt: -1 }
    if (sort === 'price_asc') sortObj = { price: 1 }
    else if (sort === 'price_desc') sortObj = { price: -1 }
    else if (sort === 'popular') sortObj = { 'ratings.count': -1 }
    else if (sort === 'top_rated') sortObj = { 'ratings.avg': -1 }
    else if (sort === 'newest') sortObj = { createdAt: -1 }

    // Execute query
    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .populate('category', 'name slug')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ProductModel.countDocuments(filter)
    ])

    // Add computed fields to each product (without full variants array)
    const productsWithComputed = products.map(computeProductListItem)

    return res.json({
      success: true,
      data: {
        products: productsWithComputed,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: pageNum < Math.ceil(total / limitNum)
      }
    })
  }
)

// 2. getProductBySlug - GET /api/products/slug/:slug
export const getProductBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await ProductModel.findOne({
      slug: req.params.slug,
      isActive: true
    })
      .populate('category', 'name slug')
      .lean()

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }

    return res.json({ success: true, data: computeProductResponse(product) })
  }
)

// 2b. getProductVariants - GET /api/products/:slug/variants
export const getProductVariants = asyncHandler(
  async (req: any, res: any) => {
    const product: any = await ProductModel.findOne({
      slug: req.params.slug,
      isActive: true
    })
      .select('variants')
      .lean()

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

    const variants = product.variants || []
    const activeVariants = variants.filter((v: any) => v.isActive)

    // Compute variantOptions from active variants
    const variantOptions = product.variantOptions || [];

    return res.status(200).json({
      success: true,
      data: {
        variantOptions,
        variants: activeVariants,
      }
    })
  }
)

// 3. getFeaturedProducts - GET /api/products/featured
export const getFeaturedProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 8

    const products = await ProductModel.find({
      isFeatured: true,
      isActive: true
    })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    // Add computed fields to each product
    const productsWithComputed = products.map(computeProductListItem)

    return res.json({ success: true, data: productsWithComputed })
  }
)

// 4. getRelatedProducts - GET /api/products/:id/related
export const getRelatedProducts = asyncHandler(
  async (req: Request, res: Response) => {
    // FIX 1: ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' })
    }

    const product = await ProductModel.findById(req.params.id).lean<IProduct | null>()
    if (!product) {
      return res.json({ success: true, data: [] })
    }

    const prod = product as IProduct;

    const related = await ProductModel.find({
      category: prod.category,
      _id: { $ne: prod._id },
      isActive: true
    })
      .populate('category', 'name slug')
      .sort({ 'ratings.avg': -1 })
      .limit(6)
      .lean()

    // Add computed fields to each product
    const relatedWithComputed = related.map(computeProductListItem)

    return res.json({ success: true, data: relatedWithComputed })
  }
)

// 5. searchProducts - GET /api/products/search?q=
export const searchProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const q = req.query.q as string

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] })
    }

    const products = await ProductModel.find({
      isActive: true,
      $or: [
        { name: new RegExp(q, 'i') },
        { brand: new RegExp(q, 'i') },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    })
      .select('name slug images price salePrice category brand')
      .populate('category', 'name slug')
      .limit(6)
      .lean()

    // Add computed fields to each product
    const productsWithComputed = products.map(computeProductListItem)

    return res.json({ success: true, data: productsWithComputed })
  }
)

// 6. createProduct - POST /api/products (admin only)
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    // Check admin role (assuming role 1 is admin)
    if (req.user_role !== 1) {
      return res.status(403).json(
        formatResponse(0, "Access denied. Admin only.", [])
      );
    }

    const {
      name,
      description,
      category,
      brand,
      images,
      price,
      salePrice,
      stock,
      sku,
      variants,
      specifications,
      tags,
      isFeatured,
      isActive,
      seoTitle,
      seoDescription,
    } = req.body;

    // FIX 3: Handle file upload paths (Windows compatibility)
    let productImages = images
    if (req.files && Array.isArray(req.files)) {
      productImages = req.files.map((f: any) =>
        f.path.replace(/\\/g, '/')
      )
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json(
        formatResponse(0, "Product name is required", [])
      );
    }
    if (!description) {
      return res.status(400).json(
        formatResponse(0, "Product description is required", [])
      );
    }
    if (!category) {
      return res.status(400).json(
        formatResponse(0, "Product category is required", [])
      );
    }
    if (!productImages || productImages.length === 0) {
      return res.status(400).json(
        formatResponse(0, "At least one product image is required", [])
      );
    }
    if (price === undefined || price === null) {
      return res.status(400).json(
        formatResponse(0, "Product price is required", [])
      );
    }
    if (!sku) {
      return res.status(400).json(
        formatResponse(0, "Product SKU is required", [])
      );
    }

    // Generate slug
    let slug = generateSlug(name);
    slug = await generateUniqueSlug(slug);

    const product = new ProductModel({
      name,
      slug,
      description,
      category,
      brand,
      images: productImages,
      price,
      salePrice,
      stock: stock || 0,
      sku,
      variants,
      specifications,
      tags,
      isFeatured: isFeatured || false,
      isActive: isActive !== undefined ? isActive : true,
      seoTitle,
      seoDescription,
    });

    await product.save();

    res.status(201).json(
      formatResponse(1, "Product created successfully", product)
    );
  }
);

// 7. updateProduct - PUT /api/products/:id (admin only)
export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    // Check admin role
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

    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json(
        formatResponse(0, "Product not found", [])
      );
    }

    const {
      name,
      description,
      category,
      brand,
      images,
      price,
      salePrice,
      stock,
      sku,
      variants,
      specifications,
      tags,
      isFeatured,
      isActive,
      seoTitle,
      seoDescription,
    } = req.body;

    // FIX 3: Handle file upload paths (Windows compatibility)
    let productImages = images
    if (req.files && Array.isArray(req.files)) {
      productImages = req.files.map((f: any) =>
        f.path.replace(/\\/g, '/')
      )
    }

    // If name changed, regenerate slug
    if (name && name !== product.name) {
      const newSlug = generateSlug(name);
      product.slug = await generateUniqueSlug(newSlug, id);
      product.name = name;
    }

    // Update other fields
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (brand !== undefined) product.brand = brand;
    if (productImages !== undefined) product.images = productImages;
    if (price !== undefined) product.price = price;
    if (salePrice !== undefined) product.salePrice = salePrice;
    if (stock !== undefined) product.stock = stock;
    if (sku !== undefined) product.sku = sku;
    if (variants !== undefined) product.variants = variants;
    if (specifications !== undefined) product.specifications = specifications;
    if (tags !== undefined) product.tags = tags;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    if (isActive !== undefined) product.isActive = isActive;
    if (seoTitle !== undefined) product.seoTitle = seoTitle;
    if (seoDescription !== undefined) product.seoDescription = seoDescription;

    await product.save();

    res.status(200).json(
      formatResponse(1, "Product updated successfully", product)
    );
  }
);

// 8. deleteProduct - DELETE /api/products/:id (admin only)
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    // Check admin role
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

    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json(
        formatResponse(0, "Product not found", [])
      );
    }

    // Soft delete: set isActive = false
    product.isActive = false;
    await product.save();

    res.status(200).json(
      formatResponse(1, "Product deleted successfully", [])
    );
  }
);
