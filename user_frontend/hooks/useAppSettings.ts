"use client";
import { useEffect, useState } from "react";
import AppConfig from "@/appConfig";
import { Ajax } from "@/helper/ajax";

function resolveLogo(logo?: string) {
  if (!logo) return AppConfig.DEFULT_IMAGE;
  if (logo.startsWith("http")) return logo;

  // Use ADMIN_API_URL for images (5001), not API_URL (5000)
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
}

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
          const name = s.appName || AppConfig.APP_NAME;
          const logo = resolveLogo(s.logoUrl);
          const announcementValue = s.announcement || null;

          const newSettings: AppSettings = {
            appName: name,
            logoUrl: logo,
            faviconUrl: s.faviconUrl ?? "",
            cookieConsentEnabled: s.cookieConsentEnabled ?? true,
            announcement: announcementValue,
            payment: s.payment || DEFAULT_PAYMENT,
            googleRecaptchaEnabled: s.googleRecaptchaEnabled ?? false,
            googleRecaptchaPublicKey: s.googleRecaptchaPublicKey ?? "",
          };

          // Check if settings have changed
          const cachedSettings = localStorage.getItem("settings");
          let hasChanged = true;
          if (cachedSettings) {
            try {
              const cached = JSON.parse(cachedSettings);
              hasChanged = JSON.stringify(cached) !== JSON.stringify(newSettings);
            } catch {
              // If parsing fails, assume changed
            }
          }

          if (hasChanged) {
            setSettings(newSettings);
            localStorage.setItem("settings", JSON.stringify(newSettings));
          } else {
            // Use cached settings if no change
            if (cachedSettings) {
              const cached = JSON.parse(cachedSettings);
              setSettings({
                ...DEFAULT_SETTINGS,
                ...cached,
                faviconUrl: cached.faviconUrl ?? "",
                cookieConsentEnabled: cached.cookieConsentEnabled ?? true,
                googleRecaptchaEnabled: cached.googleRecaptchaEnabled ?? false,
                googleRecaptchaPublicKey: cached.googleRecaptchaPublicKey ?? "",
                payment: cached.payment || DEFAULT_PAYMENT,
              });
            }
          }
        }
      } catch {
        // On error, fall back to defaults or cached
        const cachedSettings = localStorage.getItem("settings");
        if (cachedSettings) {
          try {
            const cached = JSON.parse(cachedSettings);
            setSettings({
              ...DEFAULT_SETTINGS,
              ...cached,
              faviconUrl: cached.faviconUrl ?? "",
              cookieConsentEnabled: cached.cookieConsentEnabled ?? true,
              googleRecaptchaEnabled: cached.googleRecaptchaEnabled ?? false,
              googleRecaptchaPublicKey: cached.googleRecaptchaPublicKey ?? "",
              payment: cached.payment || DEFAULT_PAYMENT,
            });
          } catch {
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          setSettings(DEFAULT_SETTINGS);
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
    isLoading,
  };
}
