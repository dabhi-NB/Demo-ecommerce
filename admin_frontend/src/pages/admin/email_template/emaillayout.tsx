import { useEffect, useState } from "react";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import AppConfig from "@/appConfig";
import { getSettings } from "@/services/setting.service";

interface EmailLayoutProps {
  children: React.ReactNode;
}

const EmailLayout: React.FC<EmailLayoutProps> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string>(AppConfig.DEFAULT_IMAGE);

  useEffect(() => {
    // Fetch logo from settings (API)
    getSettings().then((settings) => {
      const apiBase = (AppConfig.API_URL || "").replace(/\/$/, "");
      const logoSetting = (settings as any)?.["setting.app_logo"];
      if (logoSetting) {
        setLogoUrl(`${apiBase}/${logoSetting}`);
      }
    });
    // Set body background
    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;
    document.body.style.backgroundColor = "#d9d9d9";
    document.body.style.color = "#222";
    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#d9d9d9] py-8 px-2">
      <Card className="w-full max-w-2xl bg-white text-black shadow-2xl rounded-2xl border border-neutral-200">
        <CardContent>
          {/* Header with logo */}
          <div className="flex flex-col items-center justify-center bg-white rounded-t-2xl border-b border-neutral-200">
            <img
              src={logoUrl}
              alt="Logo"
              height={50}
              className="mb-4 w-20 h-14 object-contain"
            />
          </div>
          {children}
          {/* Footer */}
          <div className="rounded-b-2xl bg-white border-t border-neutral-200 text-center text-muted text-sm py-4 mt-4">
            © {new Date().getFullYear()}. All rights reserved.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailLayout;
