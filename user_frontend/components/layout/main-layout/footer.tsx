"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getNavItems, type NavItem } from "@/services/nav.service";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated } = useAuth();
  const { appName, store } = useAppSettings();
  const [footerNavItems, setFooterNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    getNavItems("footer", isAuthenticated)
      .then(setFooterNavItems)
      .catch(() => {});
  }, [isAuthenticated]);

  return (
    <footer className="border-t border-border bg-muted/30 mt-12">
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          {/* Brand */}
          <div className="space-y-1">
            <p className="font-bold text-foreground">{appName || "Demo Store"}</p>
            <p className="text-sm text-muted-foreground">
              {store.currency} · {store.type?.charAt(0).toUpperCase() + (store.type?.slice(1) || "")} Store
            </p>
            <p className="text-xs text-muted-foreground">
              © {currentYear} {appName}. All rights reserved.
            </p>
          </div>

          {/* Dynamic footer nav items from admin */}
          {footerNavItems.length > 0 ? (
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {footerNavItems.map((item) => (
                <Link
                  key={item._id}
                  href={item.url}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.isExternal ? "noopener noreferrer" : undefined}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : (
            /* Fallback static links */
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/page/termscondition" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/page/privacypolicy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
