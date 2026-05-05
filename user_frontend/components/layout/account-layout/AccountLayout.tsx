"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  Package,
  Heart,
  MapPin,
  User,
  Lock,
  Shield,
  Monitor,
  Activity,
  HelpCircle,
} from "lucide-react";

interface AccountLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const NAV_LINKS = [
  { href: "/shop/account/orders", icon: Package, label: "My Orders" },
  { href: "/shop/account/wishlist", icon: Heart, label: "Wishlist" },
  { href: "/shop/account/addresses", icon: MapPin, label: "Addresses" },
  { href: "/account/update", icon: User, label: "Profile" },
  { href: "/account/password-change", icon: Lock, label: "Password" },
  { href: "/account/tfa", icon: Shield, label: "2FA Security" },
  { href: "/account/device", icon: Monitor, label: "Devices" },
  { href: "/account/user_activity", icon: Activity, label: "Activity" },
  { href: "/contact", icon: HelpCircle, label: "Help & Support" },
];

export default function AccountLayout({
  children,
  title,
  subtitle,
}: AccountLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        {/* Mobile back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground mb-5 md:hidden hover:text-foreground"
        >
          <ChevronLeft size={15} /> Back to Home
        </Link>

        <div className="flex gap-4 items-start">
          {/* SIDEBAR — 220px fixed, matches screenshot exactly */}
          <aside className="hidden md:flex flex-col gap-3 w-[220px] flex-shrink-0">
            {/* User card */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="w-11 h-11 rounded-full bg-primary/15 border-2 border-primary/25 flex items-center justify-center mb-2.5">
                <span className="text-primary font-black text-lg leading-none">
                  {user?.first_name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <p className="font-bold text-sm text-foreground">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 break-all leading-snug">
                {user?.email}
              </p>
            </div>

            {/* Nav — matches screenshot border-l style */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {NAV_LINKS.map(({ href, icon: Icon, label }) => {
                const isActive =
                  href === "/shop/account/wishlist"
                    ? pathname === "/shop/account/wishlist"
                    : pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm border-b border-border last:border-0 transition-colors relative ${
                      isActive
                        ? "text-foreground font-semibold bg-muted/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {/* Active left border — exact like screenshot */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full" />
                    )}
                    <Icon
                      size={15}
                      className={
                        isActive ? "text-primary" : "text-muted-foreground"
                      }
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          </aside>

          {/* MAIN CONTENT — fills remaining space */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Title card */}
            <div className="bg-card border border-border rounded-2xl px-5 py-4">
              <h1
                className="text-lg font-black text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            {/* Page content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
