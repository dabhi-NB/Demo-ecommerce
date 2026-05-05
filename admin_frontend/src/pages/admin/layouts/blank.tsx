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
import { useLocation } from "react-router";
import { useAppSettings } from "@/hooks/useAppSettings";

type AuthLayoutProps = {
  children: React.ReactNode;
  showLoginHeader?: boolean;
  showFooter?: boolean;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  const location = useLocation();
  const { appName, logoUrl } = useAppSettings();

  /**
   * Footer logic (UNCHANGED)
   */
  const pathname = (location.pathname || "").toLowerCase();
  let footerContent: React.ReactNode = null;

  // if (
  //   pathname.startsWith("/auth/login") ||
  //   pathname.startsWith("/auth/password-forgot")
  // ) {
  //   footerContent = (
  //     <div className="w-full space-y-2">
  //       <p className="text-muted-foreground text-center text-sm">
  //         New on our platform?{" "}
  //         <a
  //           href="/register"
  //           className="hover:text-primary underline underline-offset-4"
  //         >
  //           Create an account
  //         </a>
  //       </p>
  //     </div>
  //   );
  // } else
  if (
    pathname.startsWith("/register") ||
    pathname.startsWith("/site/register")
  ) {
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
    <>
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
        <Card className="w-full max-w-md gap-6 sm:p-6">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <img
                src={logoUrl}
                alt={appName}
                className="h-20 w-20 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    AppConfig.DEFAULT_IMAGE;
                }}
              />

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
      </div>
    </>
  );
}
