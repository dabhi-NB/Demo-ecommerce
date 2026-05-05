import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

// Route to permission mapping (supports dynamic routes with :id)
const routePermissions: Record<string, string> = {
  "/admin/dashboard": "admin/dashboard",
  "/admin/users": "admin/user",
  "/admin/user/create": "admin/user/create",
  "/admin/user/update/:id": "admin/user/update",
  "/admin/user/view/:id": "admin/user/view",
  "/admin/admin": "admin/admin",
  "/admin/admin/create": "admin/admin/create",
  "/admin/admin/update/:id": "admin/admin/update",
  "/admin/admin/view/:id": "admin/admin/view",
  "/admin/pages": "admin/page",
  "/admin/page/update/:id": "admin/page/update",
  "/admin/seo/meta": "admin/seo/meta",
  "/admin/seo/create": "admin/seo/create",
  "/admin/seo/update/:id": "admin/seo/update",
  "/admin/device": "admin/device",
  "/admin/user-activity": "admin/activity",
  "/admin/email-template": "admin/email_template",
  "/admin/email-template/update/:id": "admin/email_template/update",
  "/admin/email-template/view/:id": "admin/email_template/view",
  "/admin/setting/update": "admin/setting/update",
  "/admin/account/update": "admin/account/update",
  "/admin/account/change_password": "admin/account/change_password",
  "/admin/account/tfa": "admin/account/tfa",
  "/admin/account/device": "admin/account/device",
  "/admin/account/user-activity": "admin/account/user_activity",
};

function getRequiredPermission(pathname: string): string | null {
  // Check exact matches first
  if (routePermissions[pathname]) {
    return routePermissions[pathname];
  }

  // Check pattern matches (for dynamic routes)
  for (const [route, permission] of Object.entries(routePermissions)) {
    if (route.includes("/:id") || route.includes("/:slug")) {
      const pattern = route.replace(/:\w+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(pathname)) {
        return permission;
      }
    }
  }

  return null;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hydrated, setHydrated] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !redirectedRef.current) {
      // Check authentication first
      if (!isAuthenticated) {
        redirectedRef.current = true;
        navigate("/", {
          replace: true,
          state: { from: location.pathname + location.search },
        });
        return;
      }

      // Dashboard and Account routes should be accessible to all authenticated users
      if (
        location.pathname === "/admin/dashboard" ||
        location.pathname.startsWith("/admin/account/")
      ) {
        return;
      }

      // Check permissions for the current route
      const requiredPermission = getRequiredPermission(location.pathname);
      if (requiredPermission && !hasPermission(requiredPermission)) {
        redirectedRef.current = true;
        navigate("/admin/dashboard", {
          replace: true,
          state: {
            error: "You do not have permission to access this page.",
            from: location.pathname + location.search,
          },
        });
        return;
      }
    }
  }, [
    hydrated,
    isAuthenticated,
    hasPermission,
    navigate,
    location.pathname,
    location.search,
  ]);

  if (!hydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Checking session and permissions...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Double-check permissions (in case state changed)
  // Dashboard and Account routes should be accessible to all authenticated users
  if (
    location.pathname !== "/admin/dashboard" &&
    !location.pathname.startsWith("/admin/account/")
  ) {
    const requiredPermission = getRequiredPermission(location.pathname);
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          You do not have permission to access this page.
        </div>
      );
    }
  }

  return <>{children}</>;
}
