import { useEffect, useRef, useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSettings, getPublicSettings } from "@/services/setting.service";

declare global {
  interface Window {
    grecaptcha?: any;
    onRecaptchaLoad?: () => void;
  }
}

export default function RecaptchaWidget({
  onVerify,
  isPublic = false,
}: {
  onVerify: (token: string) => void;
  isPublic?: boolean;
}): React.JSX.Element {
  // For public pages, use public settings endpoint
  const { data: settings } = useQuery({
    queryKey: isPublic ? ["settings-public"] : ["settings"],
    queryFn: isPublic ? getPublicSettings : getSettings,
    retry: false, // Don't retry on failure
  });

  // Use settings from table for both public and private pages
  const googleRecaptchaEnabled =
    settings?.["setting.google_recaptcha"] == 1 || false;
  const googleRecaptchaPublicKey =
    (settings?.["setting.google_recaptcha_public_key"] as string) || "";

  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const uniqueId = useId();

  useEffect(() => {
    if (!googleRecaptchaEnabled || !googleRecaptchaPublicKey) return;

    const renderCaptcha = () => {
      if (window.grecaptcha && containerRef.current) {
        // Clear any existing content to reset
        containerRef.current.innerHTML = "";

        // Remove previous widget if exists
        if (widgetIdRef.current) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
          } catch (e) {
            // Ignore errors
          }
        }

        // Render the widget
        const widgetId = window.grecaptcha.render(containerRef.current, {
          sitekey: googleRecaptchaPublicKey,
          callback: (token: string) => {
            onVerify(token);
          },
          "expired-callback": () => {
            onVerify("");
          },
        });
        widgetIdRef.current = widgetId;
      }
    };

    // Load the script once globally
    const scriptSrc = "https://www.google.com/recaptcha/api.js";
    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => renderCaptcha());
        }
      };
      document.body.appendChild(script);
    } else {
      // Script already exists, try to render immediately
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => renderCaptcha());
      } else {
        // Wait a bit and try again
        setTimeout(() => {
          if (window.grecaptcha && window.grecaptcha.ready) {
            window.grecaptcha.ready(() => renderCaptcha());
          }
        }, 100);
      }
    }

    // Set up the callback for when reCAPTCHA is ready
    window.onRecaptchaLoad = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => renderCaptcha());
      }
    };

    return () => {
      // Cleanup on unmount
      if (widgetIdRef.current && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch (e) {
          // Ignore errors
        }
      }
      widgetIdRef.current = null;
    };
  }, [googleRecaptchaEnabled, googleRecaptchaPublicKey, onVerify, uniqueId]);

  if (!googleRecaptchaEnabled || !googleRecaptchaPublicKey) {
    return <></>;
  }

  return (
    <div ref={containerRef} id={`recaptcha-${uniqueId}`} className="mt-6"></div>
  );
}
