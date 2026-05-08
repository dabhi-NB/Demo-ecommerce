"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { getCategories, searchProducts } from "@/services/product.service";
import { getNavItems, type NavItem } from "@/services/nav.service";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useFeatures } from "@/hooks/useFeatures";
import { ThemeDropdown } from "@/components/common/theme-dropdown";
import type { ICategory, IProduct } from "@/services/product.service";
import { resolveImageUrl } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Package,
  MapPin,
  Settings,
  ChevronDown,
  X,
  Menu,
  Grid3X3,
  Shield,
  HelpCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper function to validate image URL
function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith("http") || url.startsWith("/");
}

export default function Header() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<IProduct[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const searchRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const { appName, logoUrl } = useAppSettings();
  const { isEnabled } = useFeatures();

  const { user, isAuthenticated, logout } = useAuth();
  const { items: cartItems, totalItems } = useCart();
  const { wishlist } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();

  // Fetch categories once
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Fetch dynamic nav items from admin
  useEffect(() => {
    getNavItems("header", isAuthenticated)
      .then(setNavItems)
      .catch(() => {});
  }, [isAuthenticated]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    clearTimeout(searchTimerRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      setShowSuggestions(true);
      try {
        const r = await searchProducts(val);
        setSuggestions(r.slice(0, 7));
      } catch {}
      setSuggestionsLoading(false);
    }, 380);
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);
    router.push("/shop/search?q=" + encodeURIComponent(searchQuery.trim()));
  };

  const handleWishlistClick = () => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/shop/account/wishlist");
      return;
    }
    router.push("/shop/account/wishlist");
  };

  const handleCartClick = () => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/shop/account/cart");
      return;
    }
    router.push("/shop/account/cart");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        {/* ROW 1: MAIN HEADER */}
        <div className="w-full border-b border-border">
          <div className="max-w-screen-xl mx-auto px-4 md:px-6">
            <div className="h-[60px] flex items-center gap-3 md:gap-4 w-full">
              {/* LOGO & APP NAME */}
              <Link
                href={isAuthenticated ? "/dashboard" : "/"}
                className="flex items-center gap-2.5 flex-shrink-0"
              >
                {isValidImageUrl(logoUrl) ? (
                  <img
                    src={logoUrl || ""}
                    alt={appName || "My app"}
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {appName?.charAt(0) || "R"}
                    </span>
                  </div>
                )}
                <span className="font-black text-xl text-foreground hidden sm:block">
                  {appName || "My app"}
                </span>
              </Link>

              {/* SEARCH BAR */}
              <div ref={searchRef} className="flex-1 min-w-0 relative">
                <div className="flex items-center h-10 bg-muted/60 hover:bg-muted border border-border hover:border-primary/40 focus-within:border-primary focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/15 rounded-xl overflow-hidden transition-all duration-200">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() =>
                      searchQuery.length >= 2 && setShowSuggestions(true)
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                    placeholder="Search accessories, brands..."
                    className="flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground/70 text-foreground"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }}
                      className="px-2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <button
                    onClick={handleSearchSubmit}
                    className="h-full px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 text-sm font-semibold flex-shrink-0"
                  >
                    <Search size={15} />
                    <span className="hidden md:inline">Search</span>
                  </button>
                </div>

                {/* SEARCH DROPDOWN */}
                {showSuggestions && (
                  <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/20 overflow-hidden z-50 mega-menu-animate">
                    {suggestionsLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted animate-pulse flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-muted rounded-lg animate-pulse w-3/4" />
                              <div className="h-3 bg-muted rounded-lg animate-pulse w-1/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="py-2">
                        <p className="px-4 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                          Search Results
                        </p>
                        {suggestions.map((p) => (
                          <button
                            key={p._id}
                            onClick={() => {
                              router.push("/shop/products/" + p.slug);
                              setShowSuggestions(false);
                              setSearchQuery("");
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/80 transition-colors text-left group/item"
                          >
                            <div className="w-10 h-10 rounded-xl bg-muted/60 flex-shrink-0 overflow-hidden border border-border">
                              {p.images?.[0] && (
                                <Image
                                  src={p.images[0]}
                                  alt={p.name}
                                  width={40}
                                  height={40}
                                  className="object-contain w-full h-full p-0.5"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground line-clamp-1 group-hover/item:text-primary transition-colors">
                                {p.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                ₹
                                {(p.salePrice ?? p.price).toLocaleString(
                                  "en-IN",
                                )}
                              </p>
                            </div>
                          </button>
                        ))}
                        <button
                          onClick={handleSearchSubmit}
                          className="w-full flex items-center gap-2 px-4 py-3 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors border-t border-border mt-1"
                        >
                          <Search size={14} />
                          See all results for "{searchQuery}"
                        </button>
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <Search
                          size={28}
                          className="text-muted-foreground/40 mx-auto mb-2"
                        />
                        <p className="text-sm text-muted-foreground">
                          No results for "
                          <span className="font-medium text-foreground">
                            {searchQuery}
                          </span>
                          "
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT ICONS */}
              <div className="flex items-center gap-0.5 ml-auto sm:ml-0">
                {/* Mobile search icon */}
                <button
                  className="sm:hidden p-2.5 rounded-xl hover:bg-muted transition-colors"
                  onClick={() => {}}
                >
                  <Search size={20} />
                </button>

                {/* THEME TOGGLE — user dark/light/system */}
                <ThemeDropdown />

                {/* WISHLIST — only if feature enabled */}
                {isEnabled("wishlist") && (
                  <button
                    onClick={handleWishlistClick}
                    className="relative flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl hover:bg-muted transition-colors group/icon"
                    title="Wishlist"
                  >
                    <div className="relative">
                      <Heart
                        size={22}
                        className={`transition-all group-hover/icon:scale-110 ${isAuthenticated && wishlist.length > 0 ? "fill-red-500 text-red-500" : "text-foreground"}`}
                      />
                      {isAuthenticated && wishlist.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 shadow-sm">
                          {wishlist.length > 9 ? "9+" : wishlist.length}
                        </span>
                      )}
                    </div>
                    <span className="hidden lg:block text-[10px] text-muted-foreground leading-none font-medium">
                      Wishlist
                    </span>
                  </button>
                )}

                {/* CART */}
                <button
                  onClick={handleCartClick}
                  className="relative flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl hover:bg-muted transition-colors group/icon"
                  title="Cart"
                >
                  <div className="relative">
                    <ShoppingCart
                      size={22}
                      className="text-foreground transition-all group-hover/icon:scale-110"
                    />
                    {isAuthenticated && totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center px-0.5 shadow-sm">
                        {totalItems > 9 ? "9+" : totalItems}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:block text-[10px] text-muted-foreground leading-none font-medium">
                    Cart
                  </span>
                </button>

                {/* ACCOUNT */}
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl hover:bg-muted transition-colors group/icon"
                        title={user?.first_name}
                      >
                        <div className="w-[22px] h-[22px] rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center group-hover/icon:scale-110 transition-transform">
                          <span className="text-[10px] font-black text-primary leading-none">
                            {user?.first_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="hidden lg:block text-[10px] text-muted-foreground leading-none font-medium max-w-[52px] truncate">
                          {user?.first_name}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      className="w-60 rounded-2xl border-border shadow-2xl shadow-black/20 p-2"
                    >
                      {/* User info header */}
                      <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-black text-base">
                            {user?.first_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">
                            {user?.first_name} {user?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator className="mx-1" />
                      {[
                        {
                          icon: Package,
                          label: "My Orders",
                          href: "/shop/account/orders",
                        },
                        {
                          icon: Heart,
                          label: "Wishlist",
                          href: "/shop/account/wishlist",
                        },
                        {
                          icon: MapPin,
                          label: "Addresses",
                          href: "/shop/account/addresses",
                        },
                        {
                          icon: Settings,
                          label: "Account Settings",
                          href: "/account/update",
                        },
                        {
                          icon: Shield,
                          label: "2FA Security",
                          href: "/account/tfa",
                        },
                        {
                          icon: HelpCircle,
                          label: "Help & Support",
                          href: "/contact",
                        },
                      ].map(({ icon: Icon, label, href }) => (
                        <DropdownMenuItem
                          key={href}
                          onClick={() => router.push(href)}
                          className="rounded-xl cursor-pointer px-3 py-2.5 gap-2.5"
                        >
                          <Icon size={15} className="text-muted-foreground" />
                          <span className="text-sm">{label}</span>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="mx-1" />
                      <DropdownMenuItem
                        onClick={logout}
                        className="rounded-xl cursor-pointer px-3 py-2.5 gap-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <LogOut size={15} />
                        <span className="text-sm font-medium">Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  /* NOT LOGGED IN: Login + Sign Up buttons */
                  <div className="flex items-center gap-2 ml-1">
                    <Link href="/auth/login">
                      <button
                        className="
                    hidden sm:flex items-center px-4 py-2 rounded-xl text-sm font-semibold
                    border border-border text-foreground
                    hover:border-primary hover:text-primary hover:bg-primary/5
                    transition-all duration-200 btn-press
                  "
                      >
                        Login
                      </button>
                    </Link>
                    <Link href="/auth/register">
                      <button
                        className="
                    flex items-center px-4 py-2 rounded-xl text-sm font-bold
                    bg-primary text-primary-foreground
                    hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25
                    transition-all duration-200 btn-press
                  "
                      >
                        Sign Up
                      </button>
                    </Link>
                  </div>
                )}

                {/* Mobile hamburger */}
                <button
                  className="md:hidden p-2.5 rounded-xl hover:bg-muted transition-colors ml-1"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: MEGA MENU CATEGORIES */}
        <div className="hidden md:block border-t border-border/60 bg-background/80 backdrop-blur-sm">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
              {/* ALL CATEGORIES — with state-based mega menu */}
              <div
                className="relative flex-shrink-0"
                onMouseEnter={() => setShowMegaMenu(true)}
                onMouseLeave={() => setShowMegaMenu(false)}
              >
                <button
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                    pathname === "/shop/category"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => router.push("/shop/category")}
                >
                  <Grid3X3 size={14} />
                  All Categories
                  <ChevronDown
                    size={13}
                    className={`opacity-60 transition-transform ${
                      showMegaMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showMegaMenu && (
                  <div
                    ref={megaMenuRef}
                    className="absolute top-full left-0 z-50 w-[480px] bg-card border border-border rounded-b-2xl shadow-lg p-5"
                    style={{ animation: "megaMenuIn 0.15s ease forwards" }}
                  >
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                      Browse Categories
                    </p>
                    <div className="grid grid-cols-4 gap-2.5">
                      {categories.map((cat) => (
                        <Link
                          key={cat._id}
                          href={"/shop/category/" + cat.slug}
                          onClick={() => setShowMegaMenu(false)}
                          className="flex flex-col items-center gap-2 p-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                        >
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-muted/60 border border-border flex-shrink-0">
                            {cat.image ? (
                              <Image
                                src={resolveImageUrl(cat.image)}
                                alt={cat.name}
                                width={44}
                                height={44}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <Package size={18} className="text-primary" />
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] text-center text-muted-foreground hover:text-primary transition-colors leading-snug line-clamp-2 font-medium">
                            {cat.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <Link
                        href="/shop/category"
                        onClick={() => setShowMegaMenu(false)}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        View All {categories.length} Categories →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* INDIVIDUAL CATEGORY LINKS — max 5 */}
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat._id}
                  href={"/shop/category/" + cat.slug}
                  className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 font-medium ${
                    pathname === "/shop/category/" + cat.slug ||
                    pathname.startsWith("/shop/category/" + cat.slug + "/")
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}

              {categories.length > 5 && (
                <Link
                  href="/shop/category"
                  className="px-4 py-3 text-sm whitespace-nowrap border-b-2 border-transparent text-primary font-bold flex-shrink-0 flex items-center gap-1 hover:border-primary"
                >
                  More <ChevronDown size={13} />
                </Link>
              )}

              {/* DYNAMIC NAV ITEMS from admin */}
              {navItems.map((item) => (
                <Link
                  key={item._id}
                  href={item.url}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.isExternal ? "noopener noreferrer" : undefined}
                  className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-all flex-shrink-0 font-medium ${
                    pathname === item.url
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/98 backdrop-blur-xl">
            <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-1">
              {/* Mobile search */}
              <div className="flex items-center h-11 bg-muted border border-border rounded-xl overflow-hidden mb-3">
                <input
                  type="text"
                  placeholder="Search accessories..."
                  className="flex-1 bg-transparent px-4 text-sm outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearchSubmit();
                      setMobileMenuOpen(false);
                    }
                  }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  onClick={() => {
                    handleSearchSubmit();
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 h-full bg-primary text-primary-foreground"
                >
                  <Search size={16} />
                </button>
              </div>

              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2">
                Categories
              </p>
              <Link
                href="/shop/category"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Grid3X3 size={16} className="text-primary" /> All Categories
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={"/shop/category/" + cat.slug}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-6 h-6 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {cat.image ? (
                      <Image
                        src={resolveImageUrl(cat.image)}
                        alt={cat.name}
                        width={24}
                        height={24}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10" />
                    )}
                  </div>
                  {cat.name}
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="flex gap-2 pt-3 border-t border-border mt-2">
                  <Link
                    href="/auth/login"
                    className="flex-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <button className="w-full border border-border py-2.5 rounded-xl text-sm font-semibold hover:border-primary hover:text-primary transition-all">
                      Login
                    </button>
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <button className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all">
                      Sign Up
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
