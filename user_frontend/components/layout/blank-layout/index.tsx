"use client";

import React from "react";
import AppConfig from "@/appConfig";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePathname } from "next/navigation";
import { useAppSettings } from "@/hooks/useAppSettings";
import CookieConsentComponent from "../../common/CookieConsent";

type BlankLayoutProps = {
  children: React.ReactNode;
};

export default function BlankLayout({ children }: BlankLayoutProps) {
  const pathname = usePathname();
  const { appName, logoUrl } = useAppSettings();

  /**
   * Footer logic
   */
  const pathnameLower = (pathname || "").toLowerCase();
  let footerContent: React.ReactNode = null;

  if (
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/password-forgot")
  ) {
    footerContent = (
      <div className="w-full space-y-2">
        <p className="text-muted-foreground text-center text-sm">
          New on our platform?{" "}
          <a
            href="/auth/register"
            className="hover:text-primary underline underline-offset-4"
          >
            Create an account
          </a>
        </p>
      </div>
    );
  } else if (pathnameLower.startsWith("/auth/register")) {
    footerContent = (
      <div className="w-full space-y-2">
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <a
            href="/auth/login"
            className="hover:text-primary underline underline-offset-4"
          >
            Log in instead
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 ">
      <Card className="w-full max-w-md gap-6 sm:p-6">
        <CardHeader>
          <div className="flex items-center space-x-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={appName}
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    AppConfig.DEFULT_IMAGE;
                }}
              />
            ) : null}

            <div>
              <CardTitle className="text-lg tracking-tight">
                Welcome to {appName} 👋
              </CardTitle>
              <CardDescription>Please Log-in to your account</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="w-full">{children}</div>
        </CardContent>

        {footerContent ? <CardFooter>{footerContent}</CardFooter> : null}
      </Card>
      {/* CookieConsentComponent DISABLED - DEBUG */}
    </div>
  );
}

