import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { updateSetting } from '../utils/settings';
import Setting from '../models/settingModel';

// ── All toggleable features ──
export const FEATURE_KEYS = [
  'feature.sub_categories',
  'feature.product_variants',
  'feature.bulk_stock',
  'feature.guest_checkout',
  'feature.wallet',
  'feature.coupon_system',
  'feature.sms_notifications',
  'feature.review_system',
  'feature.wishlist',
  'feature.compare_products',
  'feature.live_chat',
  'feature.invoice_download',
];

// ── Default values ──
const FEATURE_DEFAULTS: Record<string, string> = {
  'feature.sub_categories': 'true',
  'feature.product_variants': 'true',
  'feature.bulk_stock': 'true',
  'feature.guest_checkout': 'false',
  'feature.wallet': 'false',
  'feature.coupon_system': 'true',
  'feature.sms_notifications': 'false',
  'feature.review_system': 'true',
  'feature.wishlist': 'true',
  'feature.compare_products': 'false',
  'feature.live_chat': 'false',
  'feature.invoice_download': 'true',
};

// ── GET ALL FEATURE TOGGLES ──
export const getFeatureToggles = asyncHandler(async (_req: Request, res: Response) => {
  const features: Record<string, boolean> = {};

  const settings = await Setting.find({ key: { $in: FEATURE_KEYS } }).lean();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s: any) => (settingsMap[s.key] = s.value));

  for (const key of FEATURE_KEYS) {
    const val = settingsMap[key] ?? FEATURE_DEFAULTS[key] ?? 'false';
    features[key.replace('feature.', '')] = val === 'true';
  }

  return res.status(200).json({
    status: 1,
    message: 'Feature toggles fetched',
    data: features,
  });
});

// ── SAVE FEATURE TOGGLES ──
export const saveFeatureToggles = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body; // { sub_categories: true, wallet: false, ... }

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ status: 0, message: 'Invalid data' });
  }

  const bulkOps = [];

  for (const [shortKey, value] of Object.entries(updates)) {
    const fullKey = `feature.${shortKey}`;
    if (!FEATURE_KEYS.includes(fullKey)) continue;

    bulkOps.push({
      updateOne: {
        filter: { key: fullKey },
        update: { $set: { key: fullKey, value: String(value), type: 0, updated_at: new Date() } },
        upsert: true,
      },
    });
  }

  if (bulkOps.length > 0) {
    await Setting.bulkWrite(bulkOps);
  }

  return res.status(200).json({
    status: 1,
    message: 'Feature toggles saved successfully',
  });
});

// ── PUBLIC: Get active features (for frontend) ──
export const getPublicFeatures = asyncHandler(async (_req: Request, res: Response) => {
  const cacheKey = 'features:public';

  // Try cache
  const { getCache } = await import('../utils/cache');
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json({ status: 1, data: cached });
  }

  const settings = await Setting.find({ key: { $in: FEATURE_KEYS } }).lean();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s: any) => (settingsMap[s.key] = s.value));

  const features: Record<string, boolean> = {};
  for (const key of FEATURE_KEYS) {
    const val = settingsMap[key] ?? FEATURE_DEFAULTS[key] ?? 'false';
    features[key.replace('feature.', '')] = val === 'true';
  }

  // Cache for 10 minutes
  const { setCache } = await import('../utils/cache');
  await setCache(cacheKey, features, 600);

  return res.status(200).json({
    status: 1,
    data: features,
  });
});