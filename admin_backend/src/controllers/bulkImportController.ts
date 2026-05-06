import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import Product from '../models/productModel';
import Category from '../models/categoryModel';
import { logStockChange } from '../models/stockHistoryModel';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ── Multer config for CSV/XLSX uploads ──
const csvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'upload', 'imports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `import_${Date.now()}${ext}`);
  },
});

export const uploadCSV = multer({
  storage: csvStorage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV/Excel files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ── Parse CSV manually (no external dep) ──
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    if (values.length < headers.length) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

// ── IMPORT PRODUCTS FROM CSV ──
export const importProducts = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ status: 0, message: 'CSV file is required' });
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();

  let rows: Record<string, string>[] = [];

  try {
    if (ext === '.csv') {
      const content = fs.readFileSync(filePath, 'utf-8');
      rows = parseCSV(content);
    } else {
      // XLSX support (dynamic import)
      try {
        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
      } catch {
        return res.status(400).json({
          status: 0,
          message: 'XLSX parsing failed. Install xlsx package: npm install xlsx',
        });
      }
    }
  } catch (err) {
    return res.status(400).json({ status: 0, message: 'Failed to parse file' });
  } finally {
    // Cleanup uploaded file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  if (!rows.length) {
    return res.status(400).json({ status: 0, message: 'No data found in file' });
  }

  const results = {
    total: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Excel row number (1-indexed + header)

    try {
      const name = (row['name'] || row['Name'] || '').trim();
      const price = parseFloat(row['price'] || row['Price'] || '0');

      if (!name) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: Name is required`);
        continue;
      }

      if (isNaN(price) || price < 0) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: Invalid price for "${name}"`);
        continue;
      }

      // Find or resolve category
      let categoryId = null;
      const categoryName = (row['category'] || row['Category'] || '').trim();
      if (categoryName) {
        const cat = await Category.findOne({
          $or: [{ name: new RegExp(`^${categoryName}$`, 'i') }, { slug: categoryName.toLowerCase() }],
        }).lean();
        if (cat) categoryId = (cat as any)._id;
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const productData: Record<string, any> = {
        name,
        slug,
        price,
        description: row['description'] || row['Description'] || '',
        sku: row['sku'] || row['SKU'] || '',
        stock: parseInt(row['stock'] || row['Stock'] || '0') || 0,
        salePrice: row['sale_price'] || row['Sale Price'] ? parseFloat(row['sale_price'] || row['Sale Price']) : null,
        brand: row['brand'] || row['Brand'] || '',
        isActive: !['false', '0', 'no'].includes((row['is_active'] || row['Active'] || 'true').toLowerCase()),
        isFeatured: ['true', '1', 'yes'].includes((row['is_featured'] || row['Featured'] || 'false').toLowerCase()),
        tags: (row['tags'] || row['Tags'] || '').split('|').map((t: string) => t.trim()).filter(Boolean),
        ...(categoryId && { category: categoryId }),
      };

      // Check if product exists by SKU or slug
      const existing = await Product.findOne({
        $or: [
          ...(productData.sku ? [{ sku: productData.sku }] : []),
          { slug },
        ],
      });

      if (existing) {
        await Product.findByIdAndUpdate(existing._id, productData);
        results.updated++;
      } else {
        await Product.create(productData);
        results.created++;
      }
    } catch (err: any) {
      results.skipped++;
      results.errors.push(`Row ${rowNum}: ${err.message}`);
    }
  }

  return res.status(200).json({
    status: 1,
    message: `Import complete: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
    data: results,
  });
});

// ── EXPORT PRODUCTS AS CSV ──
export const exportProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.find({})
    .populate('category', 'name slug')
    .lean();

  const headers = [
    'name', 'slug', 'sku', 'price', 'sale_price', 'stock',
    'category', 'brand', 'description', 'tags', 'is_active', 'is_featured',
  ];

  const csvRows = [headers.join(',')];

  for (const p of products as any[]) {
    const row = [
      `"${p.name || ''}"`,
      `"${p.slug || ''}"`,
      `"${p.sku || ''}"`,
      p.price || 0,
      p.salePrice || '',
      p.stock || 0,
      `"${p.category?.name || ''}"`,
      `"${p.brand || ''}"`,
      `"${(p.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(p.tags || []).join('|')}"`,
      p.isActive ? 'true' : 'false',
      p.isFeatured ? 'true' : 'false',
    ];
    csvRows.push(row.join(','));
  }

  const csv = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="products_${Date.now()}.csv"`);
  return res.send(csv);
});

// ── GET IMPORT TEMPLATE ──
export const getImportTemplate = asyncHandler(async (_req: Request, res: Response) => {
  const headers = [
    'name', 'slug', 'sku', 'price', 'sale_price', 'stock',
    'category', 'brand', 'description', 'tags', 'is_active', 'is_featured',
  ];

  const sampleRow = [
    '"Sample Product"', '"sample-product"', '"SKU001"', '999', '799', '50',
    '"Electronics"', '"Samsung"', '"Product description here"', '"tag1|tag2"', 'true', 'false',
  ];

  const csv = [headers.join(','), sampleRow.join(',')].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="product_import_template.csv"');
  return res.send(csv);
});
