// utils/upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

/**
 * =========================
 * HELPER: Get or create dynamic upload folder
 * =========================
 */
const getDynamicUploadPath = (...subFolders: string[]): string => {
  const uploadPath = path.join(process.cwd(), 'upload', ...subFolders);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

/**
 * =========================
 * ADMIN PROFILE IMAGE UPLOAD
 * =========================
 */
const adminProfileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = getDynamicUploadPath('profile');
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const randomName = crypto.randomBytes(24).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${randomName}${ext}`);
  },
});

export const uploadAdminProfile = multer({
  storage: adminProfileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

/**
 * =========================
 * USER PROFILE IMAGE UPLOAD
 * =========================
 */
const userProfileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = getDynamicUploadPath('user_profile');
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const randomName = crypto.randomBytes(24).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${randomName}${ext}`);
  },
});

export const uploadUserProfile = multer({
  storage: userProfileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

/**
 * =========================
 * LOGO / FAVICON IMAGE UPLOAD
 * =========================
 */
getDynamicUploadPath('setting');

const settingStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getDynamicUploadPath('setting'));
  },
  filename: (_req, file, cb) => {
    // Keep the original file name instead of always 'logo.png'
    cb(null, file.originalname);
  },
});

const settingFileFilter = (_req: any, file: any, cb: any) => {
  const allowedMimes = ['image/png', 'image/jpeg', 'image/x-icon'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPEG or ICO files allowed'), false);
  }
};

export const uploadLogo = multer({
  storage: settingStorage,
  fileFilter: settingFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * =========================
 * CATEGORY IMAGE UPLOAD (Dynamic folder based on category slug)
 * =========================
 */
const categoryStorage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    // Get category slug from request body or generate from name
    let categorySlug = req.body.slug;

    if (!categorySlug && req.body.name) {
      // Generate slug from name if not provided
      categorySlug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    // If still no slug, use a fallback
    if (!categorySlug) {
      categorySlug = 'uncategorized';
    }

    const uploadPath = getDynamicUploadPath('categories', categorySlug);
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const randomName = crypto.randomBytes(24).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${randomName}${ext}`);
  },
});

export const uploadCategory = multer({
  storage: categoryStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// Category image upload middleware (single)
export const uploadCategoryImage = uploadCategory.single('image');

/**
 * =========================
 * PRODUCT IMAGES UPLOAD (Dynamic folder based on category slug and product name)
 * =========================
 */
const productStorage = multer.diskStorage({
  destination: async (req: any, _file, cb) => {
    try {
      // Get product data from request body
      const { category, name } = req.body;

      // Use product slug from database (override with req.body.slug if provided for create)
      let productFolder = req.body.slug;
      if (!productFolder) {
        productFolder = 'unknown-product';
      }

      let categorySlug = 'uncategorized';

      // If category ID is provided, fetch category slug from database
      if (category) {
        try {
          // Dynamic import to avoid circular dependency
          const { default: Category } = await import('../models/categoryModel');
          const categoryDoc = await Category.findById(category).select('slug').lean();
          if (categoryDoc && categoryDoc.slug) {
            categorySlug = categoryDoc.slug;
          }
        } catch (err) {
          console.error('Error fetching category slug:', err);
        }
      }

      const uploadPath = getDynamicUploadPath('products', categorySlug, productFolder);
      cb(null, uploadPath);
    } catch (error) {
      console.error('Error in product storage destination:', error);
      // Fallback to default products folder
      cb(null, getDynamicUploadPath('products', 'uncategorized', 'unknown-product'));
    }
  },
  filename: (_req, file, cb) => {
    const randomName = crypto.randomBytes(24).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${randomName}${ext}`);
  },
});

export const uploadProductImages = multer({
  storage: productStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

// Product images upload middleware (multiple, max 5)
export const uploadProductImagesArray = uploadProductImages.array('images', 5);


/**
 * =========================
 * COMMON FILE DELETE UTILITY
 * =========================
 */
export const deleteFile = (
  folder: 'profile' | 'user_profile' | 'setting' | 'categories' | 'products',
  subFolder?: string,
  fileName?: string
): boolean => {
  try {
    if (!fileName) return false;

    // Build the file path based on whether subFolder is provided
    let filePath: string;
    if (subFolder) {
      filePath = path.join(process.cwd(), 'upload', folder, subFolder, fileName);
    } else {
      filePath = path.join(process.cwd(), 'upload', folder, fileName);
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }

    return false;
  } catch (error) {
    console.error('File delete error:', error);
    return false;
  }
};

// Helper function to delete product images with full path
export const deleteProductImage = (imagePath: string): boolean => {
  try {
    const fullPath = path.join(process.cwd(), imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Product image delete error:', error);
    return false;
  }
};

// Helper function to delete category image with full path
export const deleteCategoryImage = (imagePath: string): boolean => {
  try {
    const fullPath = path.join(process.cwd(), imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Category image delete error:', error);
    return false;
  }
};

/**
 * =========================
 * IMAGE PROCESSING WITH SHARP
 * =========================
 */
import sharp from 'sharp';

// Helper: resize and save image using sharp
export const processImage = async (
  inputPath: string,
  outputPath: string,
  options: { width?: number; height?: number; quality?: number } = {}
): Promise<string> => {
  const { width = 800, height = 800, quality = 85 } = options;

  // Get the directory and filename parts
  const dir = path.dirname(outputPath);
  const basename = path.basename(outputPath, path.extname(outputPath));
  const webpPath = path.join(dir, `${basename}.webp`);

  await sharp(inputPath)
    .resize(width, height, {
      fit: 'inside', // maintain aspect ratio, fit within box
      withoutEnlargement: true, // don't upscale small images
    })
    .webp({ quality }) // convert to webp for smaller size
    .toFile(webpPath);

  // Delete original uploaded file
  if (fs.existsSync(inputPath) && inputPath !== webpPath) {
    fs.unlinkSync(inputPath);
  }

  // Return relative path with .webp extension
  return webpPath.replace(process.cwd() + '/', '').replace(/\\/g, '/');
};
