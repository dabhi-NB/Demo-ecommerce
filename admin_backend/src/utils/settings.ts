import Setting from '../models/settingModel';
import { getCache, setCache } from './cache';

/**
 * Get all public settings
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const cacheKey = 'setting:all:public';

  // 🔹 Try cache
  try {
    const cached = await getCache(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch { }

  try {
    const settings = await Setting.find({ type: 0 }).lean();
    const data: Record<string, string> = {};

    settings.forEach((setting: any) => {
      if (
        (setting.key === 'setting.app_logo' ||
          setting.key === 'setting.app_favicon') &&
        setting.value
      ) {
        data[setting.key] = `upload/setting/${String(setting.value)}`;
      } else {
        data[setting.key] = String(setting.value);
      }
    });

    // 🔹 Save to cache
    await setCache(cacheKey, JSON.stringify(data), 3600); // 1 hour

    return data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
}

/**
 * Get single public setting
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await Setting.findOne({ key, type: 0 }).lean();
    return setting?.value ? String(setting.value) : null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
}

/**
 * Update or create setting
 */
export async function updateSetting(
  key: string,
  value: string | number,
  type: number = 0
): Promise<void> {
  await Setting.findOneAndUpdate(
    { key },
    { key, value, type, updated_at: new Date() },
    { upsert: true }
  );

  // Clear cache
  await setCache('setting:all:public', '', 1);
}



