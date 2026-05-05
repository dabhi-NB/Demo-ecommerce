import { useEffect, useState } from "react";
import AppConfig from "@/appConfig";
import { Ajax } from "@/helper/ajax";

function resolveLogo(logo?: string) {
    if (!logo) return AppConfig.DEFAULT_IMAGE;
    if (logo.startsWith("http")) return logo;

    return `${AppConfig.API_URL.replace(/\/$/, "")}/upload/setting/${logo.replace(/^\/+/, "")}`;
}

export function useAppSettings() {
    const [appName, setAppName] = useState(AppConfig.APP_NAME);
    const [logoUrl, setLogoUrl] = useState(AppConfig.DEFAULT_IMAGE);
    const [faviconUrl, setFaviconUrl] = useState(AppConfig.DEFAULT_IMAGE);
    const [googleRecaptchaEnabled, setGoogleRecaptchaEnabled] = useState(false);
    const [googleRecaptchaPublicKey, setGoogleRecaptchaPublicKey] = useState("");
    const [cookieConsentEnabled, setCookieConsentEnabled] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await Ajax.post("setting/public/get", {});
                if (res?.status === 1 && res.data) {
                    const s = res.data;
                    const name = s["setting.app_name"] || AppConfig.APP_NAME;
                    const logo = resolveLogo(s["setting.app_logo"]);
                    const favicon = resolveLogo(s["setting.app_favicon"]);
                    const recaptchaEnabled = s["setting.google_recaptcha"] === 1 || s["setting.google_recaptcha"] === "1";
                    const recaptchaPublicKey =
                        s["setting.google_recaptcha_public_key"] || "";
                    const cookieConsentEnabledValue = Number(s["setting.cookie_consent"]) === 1;

                    const newSettings = {
                        appName: name,
                        logoUrl: logo,
                        faviconUrl: favicon,
                        googleRecaptchaEnabled: recaptchaEnabled,
                        googleRecaptchaPublicKey: recaptchaPublicKey,
                        cookieConsentEnabled: cookieConsentEnabledValue,
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
                        setAppName(name);
                        setLogoUrl(logo);
                        setFaviconUrl(favicon);
                        setGoogleRecaptchaEnabled(recaptchaEnabled);
                        setGoogleRecaptchaPublicKey(recaptchaPublicKey);
                        setCookieConsentEnabled(cookieConsentEnabledValue);
                        localStorage.setItem("settings", JSON.stringify(newSettings));
                    } else {
                        // Use cached settings if no change
                        if (cachedSettings) {
                            const cached = JSON.parse(cachedSettings);
                            setAppName(cached.appName || AppConfig.APP_NAME);
                            setLogoUrl(cached.logoUrl || AppConfig.DEFAULT_IMAGE);
                            setFaviconUrl(cached.faviconUrl || AppConfig.DEFAULT_IMAGE);
                            setGoogleRecaptchaEnabled(cached.googleRecaptchaEnabled || false);
                            setGoogleRecaptchaPublicKey(cached.googleRecaptchaPublicKey || "");
                            setCookieConsentEnabled(cached.cookieConsentEnabled || false);
                        }
                    }
                }
            } catch {
                // On error, fall back to defaults or cached
                const cachedSettings = localStorage.getItem("settings");
                if (cachedSettings) {
                    try {
                        const cached = JSON.parse(cachedSettings);
                        setAppName(cached.appName || AppConfig.APP_NAME);
                        setLogoUrl(cached.logoUrl || AppConfig.DEFAULT_IMAGE);
                        setFaviconUrl(cached.faviconUrl || AppConfig.DEFAULT_IMAGE);
                        setGoogleRecaptchaEnabled(cached.googleRecaptchaEnabled || false);
                        setGoogleRecaptchaPublicKey(cached.googleRecaptchaPublicKey || "");
                        setCookieConsentEnabled(cached.cookieConsentEnabled || false);
                    } catch {
                        setAppName(AppConfig.APP_NAME);
                        setLogoUrl(AppConfig.DEFAULT_IMAGE);
                        setFaviconUrl(AppConfig.DEFAULT_IMAGE);
                        setGoogleRecaptchaEnabled(false);
                        setGoogleRecaptchaPublicKey("");
                        setCookieConsentEnabled(false);
                    }
                } else {
                    setAppName(AppConfig.APP_NAME);
                    setLogoUrl(AppConfig.DEFAULT_IMAGE);
                    setFaviconUrl(AppConfig.DEFAULT_IMAGE);
                    setGoogleRecaptchaEnabled(false);
                    setGoogleRecaptchaPublicKey("");
                    setCookieConsentEnabled(false);
                }
            }
        };

        fetchSettings();
    }, []);

    return {
        appName,
        logoUrl,
        faviconUrl,
        googleRecaptchaEnabled,
        googleRecaptchaPublicKey,
        cookieConsentEnabled,
    };
}
