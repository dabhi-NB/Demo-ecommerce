"use client";
import { useEffect, useState } from "react";
import AppConfig from "@/appConfig";
import { Ajax } from "@/helper/ajax";

function resolveLogo(logo?: string) {
  if (!logo) return AppConfig.DEFULT_IMAGE;
  if (logo.startsWith("http")) return logo;
  return `${AppConfig.ADMIN_API_URL.replace(/\/$/, "")}/${logo.replace(/^\/+/, "")}`;
}

export interface PaymentGatewayPublic {
  id: string;
  type: string;
  displayName: string;
  isDefault: boolean;
  supportedMethods: string[];
  userDisplayConfig: {
    label: string;
    description: string;
    iconUrl?: string;
  };
  mode: "test" | "live";
  keyId: string;
}

export interface AppTheme {
  primaryColor: string;
  secondaryColor: string;
  font: string;
  darkMode: boolean;
}

export interface AppFeatures {
  sub_categories: boolean;
  product_variants: boolean;
  bulk_stock: boolean;
  guest_checkout: boolean;
  wallet: boolean;
  coupon_system: boolean;
  sms_notifications: boolean;
  review_system: boolean;
  wishlist: boolean;
  compare_products: boolean;
  live_chat: boolean;
  invoice_download: boolean;
}

export interface AppStore {
  type: string;
  currency: string;
  currencySymbol: string;
}

export interface AppSettings {
  appName: string;
  logoUrl: string;
  announcement: string | null;
  faviconUrl?: string;
  cookieConsentEnabled: boolean;
  payment: {
    gateways: PaymentGatewayPublic[];
    codEnabled: boolean;
    onlinePaymentEnabled: boolean;
    currency: string;
    orderAmountMin: number;
  };
  googleRecaptchaEnabled: boolean;
  googleRecaptchaPublicKey: string;
  theme: AppTheme;
  features: AppFeatures;
  store: AppStore;
}

const DEFAULT_THEME: AppTheme = {
  primaryColor: "#6366f1",
  secondaryColor: "#f59e0b",
  font: "Inter",
  darkMode: false,
};

const DEFAULT_FEATURES: AppFeatures = {
  sub_categories: true,
  product_variants: true,
  bulk_stock: true,
  guest_checkout: false,
  wallet: false,
  coupon_system: true,
  sms_notifications: false,
  review_system: true,
  wishlist: true,
  compare_products: false,
  live_chat: false,
  invoice_download: true,
};

const DEFAULT_STORE: AppStore = {
  type: "general",
  currency: "INR",
  currencySymbol: "₹",
};

const DEFAULT_PAYMENT = {
  gateways: [],
  codEnabled: true,
  onlinePaymentEnabled: false,
  currency: "INR",
  orderAmountMin: 0,
};

const DEFAULT_SETTINGS: AppSettings = {
  appName: AppConfig.APP_NAME,
  logoUrl: AppConfig.DEFULT_IMAGE,
  faviconUrl: "",
  cookieConsentEnabled: true,
  announcement: null,
  payment: DEFAULT_PAYMENT,
  googleRecaptchaEnabled: false,
  googleRecaptchaPublicKey: "",
  theme: DEFAULT_THEME,
  features: DEFAULT_FEATURES,
  store: DEFAULT_STORE,
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await Ajax.get("/settings/public");
        if (res?.status === 1 && res.data) {
          const s = res.data;

          const newSettings: AppSettings = {
            appName: s.appName || AppConfig.APP_NAME,
            logoUrl: resolveLogo(s.logoUrl),
            faviconUrl: s.faviconUrl ?? "",
            cookieConsentEnabled: s.cookieConsentEnabled ?? true,
            announcement: s.announcement || null,
            payment: s.payment || DEFAULT_PAYMENT,
            googleRecaptchaEnabled: s.googleRecaptchaEnabled ?? false,
            googleRecaptchaPublicKey: s.googleRecaptchaPublicKey ?? "",
            // ── NEW: theme from admin ──
            theme: s.theme
              ? {
                primaryColor: s.theme.primaryColor || DEFAULT_THEME.primaryColor,
                secondaryColor: s.theme.secondaryColor || DEFAULT_THEME.secondaryColor,
                font: s.theme.font || DEFAULT_THEME.font,
                darkMode: s.theme.darkMode ?? DEFAULT_THEME.darkMode,
              }
              : DEFAULT_THEME,
            // ── NEW: feature toggles from admin ──
            features: s.features
              ? { ...DEFAULT_FEATURES, ...s.features }
              : DEFAULT_FEATURES,
            // ── NEW: store config from admin ──
            store: s.store
              ? {
                type: s.store.type || DEFAULT_STORE.type,
                currency: s.store.currency || DEFAULT_STORE.currency,
                currencySymbol: s.store.currencySymbol || DEFAULT_STORE.currencySymbol,
              }
              : DEFAULT_STORE,
          };

          const cachedSettings = localStorage.getItem("app_settings");
          let hasChanged = true;
          if (cachedSettings) {
            try {
              const cached = JSON.parse(cachedSettings);
              hasChanged = JSON.stringify(cached) !== JSON.stringify(newSettings);
            } catch { }
          }

          if (hasChanged) {
            setSettings(newSettings);
            localStorage.setItem("app_settings", JSON.stringify(newSettings));
          } else if (cachedSettings) {
            try {
              setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(cachedSettings) });
            } catch { }
          }
        }
      } catch {
        // Fallback to cache
        const cachedSettings = localStorage.getItem("app_settings");
        if (cachedSettings) {
          try {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(cachedSettings) });
          } catch {
            setSettings(DEFAULT_SETTINGS);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return {
    appName: settings.appName,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    cookieConsentEnabled: settings.cookieConsentEnabled,
    announcement: settings.announcement,
    payment: settings.payment,
    googleRecaptchaEnabled: settings.googleRecaptchaEnabled,
    googleRecaptchaPublicKey: settings.googleRecaptchaPublicKey,
    theme: settings.theme,
    features: settings.features,
    store: settings.store,
    isLoading,
  };
}