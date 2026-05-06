import Setting from "../models/settingModel";
import { getCache } from "./cache";

/**
 * Get all public settings from cache or database
 * @returns Promise<object> Settings object with key-value pairs
 */
export async function getAllSettings(): Promise<any> {
  const cacheKey = "setting:all:public";

  try {
    const cached = await getCache(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) { }

  try {
    // Include settings where type is 0 OR type is undefined (for backward compatibility)
    const settings = await Setting.find({
      $or: [{ type: 0 }, { type: { $exists: false } }, { type: null }]
    }).lean();
    const data: Record<string, string> = {};

    const ADMIN_BASE_URL = process.env.ADMIN_APP_URL || "http://127.0.0.1:5001";

    settings.forEach((setting: any) => {
      if (
        (setting.key === "setting.app_logo" ||
          setting.key === "setting.app_favicon") &&
        setting.value
      ) {
        data[setting.key] = `${ADMIN_BASE_URL}/upload/setting/${setting.value}`;
      } else {
        data[setting.key] = setting.value;
      }
    });

    // Remap for frontend compatibility (Next.js expects flat keys)
    const publicSettings = {
      appName: data["setting.app_name"] || "RV Mobile",
      logoUrl: data["setting.app_logo"] || `${ADMIN_BASE_URL}/upload/setting/no-image.jpg`,
      faviconUrl: data["setting.app_favicon"] || "",
      announcement: data["setting.announcement"] || null,
      cookieConsentEnabled: data["setting.cookie_consent_enabled"] === "1" || true,
      payment: {
        gateways: [],
        codEnabled: data["setting.cod_enabled"] === "1" || true,
        onlinePaymentEnabled: data["setting.online_payment_enabled"] === "1" || false,
        currency: data["setting.currency"] || "INR",
        orderAmountMin: parseFloat(data["setting.order_amount_min"] || "0"),
      },
      googleRecaptchaEnabled: data["setting.google_recaptcha_enabled"] === "1" || false,
      googleRecaptchaPublicKey: data["setting.google_recaptcha_public_key"] || "",
      // Raw data preserved for other uses
      raw: data
    };

    return publicSettings;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return {};
  }
}

/**
 * Get a specific setting value by key
 * @param key Setting key
 * @returns Promise<string | null> Setting value or null
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await Setting.findOne({
      $or: [{ key, type: 0 }, { key, type: { $exists: false } }, { key, type: null }]
    }).lean();
    return setting ? setting.value : null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
}

/**
 * Update or create a setting
 * @param key Setting key
 * @param value Setting value
 * @param type Setting type (0 = public, 1 = private)
 */
export async function updateSetting(
  key: string,
  value: string,
  type: number = 0
): Promise<void> {
  try {
    await Setting.findOneAndUpdate(
      { key },
      { key, value, type, updated_at: new Date() },
      { upsert: true, new: true }
    );

    // Invalidate cache
    await invalidateSettingsCache();
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }
}

/**
 * Invalidate settings cache
 */
export async function invalidateSettingsCache(): Promise<void> {
  try {
    const cacheKey = "setting:all:public";
    // Redis delete would go here if implemented
    // For now, relying on cache TTL
  } catch (error) {
    console.error("Error invalidating cache:", error);
  }
}

// Lazy import to avoid circular deps
export const getSettingValue = async (key: string, fallback = ''): Promise<string> => {
  try {
    const Setting = (await import('../models/settingModel')).default;
    const setting = await Setting.findOne({ key }).lean() as any;
    return setting?.value || fallback;
  } catch {
    return fallback;
  }
};
