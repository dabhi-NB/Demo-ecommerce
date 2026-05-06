import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import Product from '../models/productModel';
import StockHistoryModel from '../models/stockHistoryModel';

// ── GET LOW STOCK ALERTS ──
export const getLowStockAlerts = asyncHandler(async (req: Request, res: Response) => {
  const threshold = parseInt(req.query.threshold as string) || 5;

  // Base product low stock
  const lowStockProducts = await Product.find({
    isActive: true,
    $or: [
      // No variants: base stock low
      { 'variants.0': { $exists: false }, stock: { $lte: threshold, $gt: 0 } },
      // Has variants: any variant stock low
      { 'variants.stock': { $lte: threshold, $gt: 0 } },
    ],
  })
    .select('name slug stock images variants sku category')
    .populate('category', 'name slug')
    .lean();

  // Out of stock products
  const outOfStockProducts = await Product.find({
    isActive: true,
    $or: [
      { 'variants.0': { $exists: false }, stock: 0 },
      { 'variants': { $elemMatch: { stock: 0, isActive: true } } },
    ],
  })
    .select('name slug stock images variants sku')
    .lean();

  // Build alert list for variants
  const alerts: any[] = [];

  lowStockProducts.forEach((product: any) => {
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        if (variant.stock <= threshold && variant.stock > 0 && variant.isActive) {
          alerts.push({
            type: 'low_stock',
            productId: product._id,
            productName: product.name,
            productSlug: product.slug,
            variantId: variant._id,
            variantName: variant.combination
              ?.map((c: any) => `${c.name}: ${c.value}`)
              .join(', '),
            currentStock: variant.stock,
            threshold,
          });
        }
      });
    } else {
      alerts.push({
        type: 'low_stock',
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        variantId: null,
        variantName: null,
        currentStock: product.stock,
        threshold,
      });
    }
  });

  const outAlerts: any[] = [];
  outOfStockProducts.forEach((product: any) => {
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        if (variant.stock === 0 && variant.isActive) {
          outAlerts.push({
            type: 'out_of_stock',
            productId: product._id,
            productName: product.name,
            variantId: variant._id,
            variantName: variant.combination
              ?.map((c: any) => `${c.name}: ${c.value}`)
              .join(', '),
            currentStock: 0,
          });
        }
      });
    } else {
      outAlerts.push({
        type: 'out_of_stock',
        productId: product._id,
        productName: product.name,
        variantId: null,
        variantName: null,
        currentStock: 0,
      });
    }
  });

  return res.status(200).json({
    status: 1,
    data: {
      lowStock: alerts,
      outOfStock: outAlerts,
      totalLowStock: alerts.length,
      totalOutOfStock: outAlerts.length,
      threshold,
    },
  });
});

// ── GET STOCK HISTORY FOR A PRODUCT ──
export const getProductStockHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const history = await StockHistoryModel.find({ product: id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('adminId', 'first_name last_name email')
    .lean();

  const total = await StockHistoryModel.countDocuments({ product: id });

  return res.status(200).json({
    status: 1,
    data: history,
    total,
    page,
    limit,
  });
});

// ── GET INVENTORY OVERVIEW ──
export const getInventoryOverview = asyncHandler(async (_req: Request, res: Response) => {
  const [totalProducts, activeProducts, outOfStockCount, lowStockCount] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: 0, 'variants.0': { $exists: false } }),
    Product.countDocuments({ isActive: true, stock: { $lte: 5, $gt: 0 }, 'variants.0': { $exists: false } }),
  ]);

  // Top 5 recently updated stock
  const recentStockChanges = await StockHistoryModel.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('product', 'name slug')
    .lean();

  return res.status(200).json({
    status: 1,
    data: {
      totalProducts,
      activeProducts,
      outOfStockCount,
      lowStockCount,
      recentStockChanges,
    },
  });
});
