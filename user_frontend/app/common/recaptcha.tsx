"use client";

import { useEffect, useRef, useId } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";

declare global {
  interface Window {
    grecaptcha?: any;
    onRecaptchaLoad?: () => void;
  }
}

export default function RecaptchaWidget({
  onVerify,
}: {
  onVerify: (token: string) => void;
}): React.JSX.Element {
  const { googleRecaptchaEnabled, googleRecaptchaPublicKey } = useAppSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const uniqueId = useId();

  useEffect(() => {
    if (!googleRecaptchaEnabled || !googleRecaptchaPublicKey) return;

    const renderCaptcha = () => {
      if (window.grecaptcha && containerRef.current) {
        containerRef.current.innerHTML = "";

        if (widgetIdRef.current) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
          } catch (e) {}
        }

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
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => renderCaptcha());
      } else {
        setTimeout(() => {
          if (window.grecaptcha && window.grecaptcha.ready) {
            window.grecaptcha.ready(() => renderCaptcha());
          }
        }, 100);
      }
    }

    window.onRecaptchaLoad = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => renderCaptcha());
      }
    };

    return () => {
      if (widgetIdRef.current && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch (e) {}
      }
      widgetIdRef.current = null;
    };
  }, [googleRecaptchaEnabled, googleRecaptchaPublicKey, onVerify, uniqueId]);

  if (!googleRecaptchaEnabled || !googleRecaptchaPublicKey) {
    return <></>;
  }
  return <div ref={containerRef} className="mt-4"></div>;
}
