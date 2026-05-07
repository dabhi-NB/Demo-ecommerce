import { Request, Response } from "express";
import {
  getAllSettings,
  getSetting,
  updateSetting,
} from "../utils/settingsHelper";
import { asyncHandler } from "../middlewares/asyncHandler";
import Setting from "../models/settingModel";

// ── All toggleable feature keys (must match admin_backend) ──
const FEATURE_KEYS = [
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

export const getPublicSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const settings = await getAllSettings();

    // ── Fetch theme settings ──
    const themeKeys = ['theme.primary_color', 'theme.secondary_color', 'theme.font', 'theme.dark_mode'];
    const themeSettings = await Setting.find({ key: { $in: themeKeys } }).lean();
    const themeMap: Record<string, string> = {};
    themeSettings.forEach((s: any) => (themeMap[s.key] = s.value));

    const theme = {
      primaryColor: themeMap['theme.primary_color'] || '#6366f1',
      secondaryColor: themeMap['theme.secondary_color'] || '#f59e0b',
      font: themeMap['theme.font'] || 'Inter',
      darkMode: themeMap['theme.dark_mode'] === 'true',
    };

    // ── Fetch feature toggles ──
    const featureSettings = await Setting.find({ key: { $in: FEATURE_KEYS } }).lean();
    const featureMap: Record<string, string> = {};
    featureSettings.forEach((s: any) => (featureMap[s.key] = s.value));

    const features: Record<string, boolean> = {};
    for (const key of FEATURE_KEYS) {
      const val = featureMap[key] ?? FEATURE_DEFAULTS[key] ?? 'false';
      features[key.replace('feature.', '')] = val === 'true';
    }

    // ── Fetch store settings ──
    const storeKeys = ['store.type', 'store.currency', 'store.currency_symbol'];
    const storeSettings = await Setting.find({ key: { $in: storeKeys } }).lean();
    const storeMap: Record<string, string> = {};
    storeSettings.forEach((s: any) => (storeMap[s.key] = s.value));

    const store = {
      type: storeMap['store.type'] || 'general',
      currency: storeMap['store.currency'] || 'INR',
      currencySymbol: storeMap['store.currency_symbol'] || '₹',
    };

    res.status(200).json({
      status: 1,
      message: "Settings retrieved successfully",
      data: {
        ...settings,
        theme,
        features,
        store,
      },
    });
  },
);

export const getSettingValue = asyncHandler(
  async (req: Request, res: Response) => {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({
        status: 0,
        message: "Setting key is required",
        data: {},
      });
    }

    const value = await getSetting(key);
    res.status(200).json({
      status: 1,
      message: "Setting retrieved successfully",
      data: { key, value },
    });
  },
);

export const updateSettingValue = asyncHandler(
  async (req: Request, res: Response) => {
    const { key, value, type } = req.body;

    if (!key || !value) {
      return res.status(400).json({
        status: 0,
        message: "Key and value are required",
        data: {},
      });
    }

    try {
      await updateSetting(key, value, type || 0);
      res.status(200).json({
        status: 1,
        message: "Setting updated successfully",
        data: { key, value, type: type || 0 },
      });
    } catch (error) {
      res.status(500).json({
        status: 0,
        message: "Failed to update setting",
        data: {},
      });
    }
  },
);