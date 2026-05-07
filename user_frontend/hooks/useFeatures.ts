"use client";
import { useAppSettings, type AppFeatures } from "@/hooks/useAppSettings";

/**
 * Hook to check feature toggles set by admin.
 * Usage:
 *   const { isEnabled, features } = useFeatures();
 *   if (isEnabled('wishlist')) { ... }
 */
export function useFeatures() {
  const { features } = useAppSettings();

  const isEnabled = (feature: keyof AppFeatures): boolean => {
    return features[feature] ?? false;
  };

  return { isEnabled, features };
}

/**
 * Standalone helper — use in non-hook contexts
 * Reads from localStorage cache set by useAppSettings
 */
export function getFeatureFlag(feature: keyof AppFeatures): boolean {
  if (typeof window === "undefined") return true; // SSR: assume enabled
  try {
    const cached = localStorage.getItem("app_settings");
    if (cached) {
      const settings = JSON.parse(cached);
      return settings?.features?.[feature] ?? true;
    }
  } catch {}
  return true; // default: enabled
}
