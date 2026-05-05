"use client";

import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";
import { useAuth } from "@/context/AuthContext";
import { CartProvider, useCart } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";
import { Providers } from "@/lib/providers";
import { ThemeProvider } from "@/components/common/theme-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import BlankLayout from "@/components/layout/blank-layout";
import { UserLayout } from "@/components/layout/main-layout/index";
import { Toaster } from "@/components/ui/sonner";
import { useAppSettings } from "@/hooks/useAppSettings";
import CartDrawer from "@/components/layout/shop-layout/CartDrawer";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { faviconUrl } = useAppSettings();
  const { isDrawerOpen, setIsDrawerOpen } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  // console.log("[LAYOUT] 🔄 LayoutContent render", {
  //   loading,
  //   isAuthenticated,
  //   pathname,
  // });

  // Define public routes that don't require authentication (e-commerce public pages)
  const publicRoutes = [
    "/",
    "/shop/products",
    "/shop/category",
    "/shop/search",
    "/contact",
    "/auth",
    "/auth/login",
    "/auth/register",
    "/auth/password-forgot",
    "/auth/verify",
    "/auth/verify-account",
  ];

  // Routes that use UserLayout even when public (with header/footer)
  const publicRoutesWithUserLayout = [
    "/",
    "/shop/products",
    "/shop/category",
    "/shop/search",
    "/contact",
    "/page/privacypolicy",
    "/page/termscondition",
  ];

  // Check if path starts with any public route
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route);
  });

  // Check if path starts with protected routes (require authentication)
  const protectedRoutes = ["/dashboard", "/account"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const isPublicWithUserLayout = publicRoutesWithUserLayout.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route);
  });

  // Home page is now accessible without login - no redirect needed

  // Dynamically set favicon from settings
  useEffect(() => {
    if (faviconUrl) {
      const link = document.querySelector(
        "link[rel*='icon']",
      ) as HTMLLinkElement;
      if (link) {
        link.href = faviconUrl;
      } else {
        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.href = faviconUrl;
        document.head.appendChild(newLink);
      }
    }
  }, [faviconUrl]);

  // For protected routes, redirect to login if not authenticated
  useEffect(() => {
    if (!loading && isProtectedRoute && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isProtectedRoute, isAuthenticated, loading, router, pathname]);

  // FIXED LAYOUT - Always render public routes like /auth/login
  // console.log("[LAYOUT] ✅ Always render public routes", {
  //   pathname,
  //   loading,
  //   isAuthenticated,
  // });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isProtectedRoute && !isAuthenticated) {
    // console.log("[LAYOUT] 🔄 Redirecting from protected route");
    router.replace("/auth/login");
    return null;
  }

  // console.log("[LAYOUT] ✅ RENDERING CONTENT", {
  //   isPublicRoute,
  //   isPublicWithUserLayout,
  //   isProtectedRoute,
  //   pathname,
  // });
  // Render appropriate layout based on route type
  if (isPublicRoute) {
    if (isPublicWithUserLayout) {
      return (
        <>
          <div className="max-w-[1600px] mx-auto px-4 md:px-4 lg:px-4">
            <UserLayout>{children}</UserLayout>
          </div>
          <CartDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
        </>
      );
    }
    return (
      <>
        <div className="max-w-[1600px] mx-auto px-4 md:px-4 lg:px-4">
          <BlankLayout>{children}</BlankLayout>
        </div>
        <CartDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
      </>
    );
  } else {
    return (
      <>
        <div className="max-w-[1600px] mx-auto px-4 md:px-4 lg:px-4">
          <UserLayout>{children}</UserLayout>
        </div>
        <CartDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
      </>
    );
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${manrope.variable} antialiased`}>
        <Providers>
          <CartProvider>
            <WishlistProvider>
              <RecentlyViewedProvider>
                <ThemeProvider>
                  <LayoutContent>{children}</LayoutContent>
                </ThemeProvider>
              </RecentlyViewedProvider>
            </WishlistProvider>
          </CartProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
