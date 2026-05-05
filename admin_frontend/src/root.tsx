import { useEffect, useState } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import { Ajax } from "./helper/ajax";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";

import { Toaster } from "@/components/ui/sonner";
import { AuthLayout } from "./pages/admin/layouts/blank";
import { AuthenticatedLayout } from "./pages/admin/layouts/main";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ErrorPage from "./pages/error";

import appStyles from "./App.css?url";

const queryClient = new QueryClient();

export const links = () => [
  { rel: "stylesheet", href: appStyles },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [faviconLoaded, setFaviconLoaded] = useState(false);

  useEffect(() => {
    const loadFavicon = async () => {
      try {
        // Try to get settings from window first (for authenticated pages)
        let settings = (window as any).appSettings;

        // If not available, fetch settings for public pages
        if (!settings) {
          const { getPublicSettings } =
            await import("@/services/setting.service");

          settings = await getPublicSettings();
        }

        let faviconUrl = ""; // default
        if (settings && settings["setting.app_favicon"]) {
          // Import AppConfig dynamically to get API_URL
          const { default: AppConfig } = await import("@/appConfig");
          const apiBase = AppConfig.API_URL.replace(/\/$/, "");
          faviconUrl = `${apiBase}/upload/setting/${settings["setting.app_favicon"]}`;
        }

        let faviconLink = document.querySelector(
          'link[rel="icon"]',
        ) as HTMLLinkElement;
        if (!faviconLink) {
          faviconLink = document.createElement("link");
          faviconLink.rel = "icon";
          document.head.appendChild(faviconLink);
        }
        faviconLink.href = faviconUrl;
        setFaviconLoaded(true);
      } catch (error) {
        console.error("Failed to load favicon settings:", error);
        // Fallback to default favicon
        let faviconLink = document.querySelector(
          'link[rel="icon"]',
        ) as HTMLLinkElement;
        if (!faviconLink) {
          faviconLink = document.createElement("link");
          faviconLink.rel = "icon";
          document.head.appendChild(faviconLink);
        }
        faviconLink.href = "";
        setFaviconLoaded(true);
      }
    };

    if (!faviconLoaded) {
      loadFavicon();
    }
  }, [faviconLoaded]);

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const health = await Ajax.healthCheck();
        setBackendHealthy(health !== false);
      } catch {
        setBackendHealthy(false);
      }
    };

    checkBackendHealth();
  }, []);

  // Show error page if backend is not healthy
  if (backendHealthy === false) {
    return <ErrorPage />;
  }

  // Show loading or nothing while checking
  if (backendHealthy === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted">Checking server status...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/" || location.pathname.startsWith("/auth");
  const isEmailTemplateView = location.pathname.startsWith(
    "/admin/email-template/view",
  );

  if (isAuthPage) {
    return (
      <AuthLayout>
        <Outlet />
      </AuthLayout>
    );
  } else if (isEmailTemplateView) {
    return (
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    );
  } else {
    return (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <Outlet />
        </AuthenticatedLayout>
      </ProtectedRoute>
    );
  }
}
