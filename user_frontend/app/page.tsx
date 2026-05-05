"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  getCategories,
  getFeaturedProducts,
  getProducts,
  type IProduct,
  type ICategory,
} from "@/services/product.service";
import General from "@/lib/general";
import { resolveImageUrl } from "@/lib/utils";
import AppConfig from "@/appConfig";
import ProductCard from "@/components/layout/shop-layout/ProductCard";
import ProductCardSkeleton from "@/components/layout/shop-layout/ProductCardSkeleton";
import {
  X,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
  Grid3X3,
  Package,
  Zap,
} from "lucide-react";

export default function HomePage() {
  console.log("[HOME] 🔄 HomePage render START");
  const { isAuthenticated, loading: authLoading } = useAuth();

  const router = useRouter();
  console.log("[HOME] 📊 HomePage auth state:", {
    isAuthenticated,
    authLoading,
  });

  // Redirect authenticated users to dashboard
  useEffect(() => {
    console.log("[HOME] 🔄 useEffect redirect check", {
      isAuthenticated,
      authLoading,
    });
    if (isAuthenticated && !authLoading) {
      console.log("[HOME] ➡️ Redirecting to /dashboard");
      router.replace("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  console.log("[HOME] 🚫 Showing full skeleton because authLoading=true");
  // Show full page skeleton while auth is loading
  if (authLoading) {
    return <HomePageFullSkeleton />;
  }
  console.log("[HOME] ✅ Showing HomePageContent");

  return <HomePageContent />;
}

function HomePageContent() {
  const router = useRouter();
  const { announcement: appAnnouncement } = useAppSettings();

  // State for all data
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Initialize dismissed state from sessionStorage
  useEffect(() => {
    const dismissed = sessionStorage.getItem("ann_dismissed");
    if (dismissed === "1") {
      setIsDismissed(true);
    }
  }, []);

  // Fetch all data in parallel
  useEffect(() => {
    Promise.allSettled([
      getCategories()
        .then(setCategories)
        .catch(() => setCategories([])),
      getFeaturedProducts()
        .then(setFeaturedProducts)
        .catch(() => setFeaturedProducts([])),
      getProducts({ sort: "newest", limit: 10 })
        .then((r) => setNewArrivals(r.products))
        .catch(() => setNewArrivals([])),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ANNOUNCEMENT BAR - from useAppSettings */}
      {appAnnouncement && !isDismissed && (
        <div className="relative bg-primary text-primary-foreground py-2 px-4 text-center">
          <p className="text-xs md:text-sm font-semibold">{appAnnouncement}</p>
          <button
            onClick={() => {
              sessionStorage.setItem("ann_dismissed", "1");
              setIsDismissed(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/6 pointer-events-none" />
        <div className="absolute right-0 top-0 w-2/3 h-full bg-gradient-to-l from-primary/4 to-transparent pointer-events-none" />
        {/* Decorative circles */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-1/3 w-48 h-48 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

        <div className="relative max-w-screen-xl mx-auto px-4 md:px-8 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* LEFT */}
            <div>
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 border border-primary/25 bg-primary/8 text-primary text-xs font-bold px-3.5 py-1.5 backdrop-blur-sm rounded-full mb-6">
                <Sparkles size={12} className="fill-primary/60" />
                India&apos;s #1 Mobile Accessories Store
              </div>

              <h1
                className="text-[42px] md:text-[58px] font-black leading-[1.06] tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                The Best
                <br />
                <span className="text-accent-foreground">Accessories</span>
                <br />
                <span className="text-[32px] md:text-[44px] font-bold text-muted-foreground">
                  For Your Device.
                </span>
              </h1>

              <p className="mt-5 text-base text-muted-foreground max-w-sm leading-relaxed">
                Premium cases, fast chargers, earphones & more — for every
                budget, every phone.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="/shop/products">
                  <button className="group bg-primary text-primary-foreground px-7 py-3.5 rounded-2xl font-bold text-sm hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 transition-all duration-200 btn-press flex items-center gap-2">
                    <ShoppingBag size={17} />
                    Shop Now
                    <ArrowRight
                      size={15}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </button>
                </Link>
                <Link href="/shop/category">
                  <button className="px-7 py-3.5 rounded-2xl font-bold text-sm border-2 border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 btn-press">
                    Browse Categories
                  </button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-9 pt-7 border-t border-border/60">
                {[
                  { icon: ShieldCheck, text: "100% Genuine" },
                  { icon: Truck, text: "Free delivery ₹999+" },
                  { icon: RefreshCw, text: "7-day returns" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={13} className="text-primary" />
                    </div>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — 2x2 live product preview */}
            <div className="hidden md:grid grid-cols-2 gap-3">
              {loading
                ? [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-muted/60 rounded-2xl animate-pulse"
                    />
                  ))
                : featuredProducts.slice(0, 4).map((p) => (
                    <Link key={p._id} href={"/shop/products/" + p.slug}>
                      <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer group aspect-square flex flex-col items-center justify-center gap-3">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <img
                            src={resolveImageUrl(p.images?.[0])}
                            alt={p.name}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              transition: "transform 300ms",
                            }}
                            className="group-hover:scale-110"
                            loading="lazy"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold line-clamp-2 leading-snug">
                            {p.name}
                          </p>
                          <p className="text-xs font-black text-primary mt-1">
                            ₹{(p.salePrice ?? p.price).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CATEGORY PILLS ═══ */}
      <section className="border-b border-border bg-muted/20">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-4">
            Shop by Category
          </p>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {/* All */}
            <Link href="/shop/category">
              <div className="flex-shrink-0 flex flex-col items-center gap-2 px-3 py-2 rounded-2xl border border-border hover:border-primary bg-card hover:bg-primary/5 transition-all cursor-pointer group min-w-[72px]">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Grid3X3 size={20} className="text-primary" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors text-center">
                  All
                </span>
              </div>
            </Link>

            {loading
              ? [1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 min-w-[72px] flex flex-col items-center gap-2 px-3 py-2"
                  >
                    <div className="w-11 h-11 rounded-xl bg-muted animate-pulse" />
                    <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                  </div>
                ))
              : categories.map((cat) => (
                  <Link href={"/shop/category/" + cat.slug} key={cat._id}>
                    <div className="flex-shrink-0 flex flex-col items-center gap-2 px-3 py-2 rounded-2xl border border-border hover:border-primary bg-card hover:bg-primary/5 transition-all cursor-pointer group min-w-[72px]">
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-border group-hover:border-primary/50 transition-colors bg-muted flex-shrink-0">
                        {cat.image ? (
                          <img
                            src={General.getCategoryImageUrl(cat.image)}
                            alt={cat.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <Package size={18} className="text-primary" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors text-center max-w-[64px] line-clamp-2 leading-snug">
                        {cat.name}
                      </span>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <section className="border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Truck, title: "Free Delivery", sub: "Orders above ₹999" },
              {
                icon: ShieldCheck,
                title: "100% Genuine",
                sub: "Authorized products",
              },
              {
                icon: RefreshCw,
                title: "7-Day Returns",
                sub: "Hassle-free policy",
              },
              {
                icon: Headphones,
                title: "24/7 Support",
                sub: "Always here for you",
              },
            ].map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={17} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-none">
                    {title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED PRODUCTS ═══ */}
      <section className="bg-muted/20 border-y border-border py-10">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5">
                <Sparkles size={11} /> Editor&apos;s Top Picks
              </p>
              <h2
                className="text-2xl font-black text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Best Sellers
              </h2>
            </div>
            <Link
              href="/shop/products"
              className="flex items-center gap-1 text-primary text-sm font-bold hover:underline"
            >
              View All <ArrowRight size={15} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="min-w-[165px] flex-shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))
              : featuredProducts.map((p) => (
                  <div
                    key={p._id}
                    className="min-w-[165px] md:min-w-[190px] flex-shrink-0"
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ═══ PROMO BANNERS ═══ */}
      <section className="max-w-screen-xl mx-auto px-4 md:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              href: "/shop/products",
              bg: "from-primary/12 to-primary/4",
              border: "border-primary/20",
              icon: Zap,
              color: "text-primary",
              title: "Fast Chargers",
              sub: "65W GaN chargers. From ₹649",
            },
            {
              href: "/shop/category/phone-cases-covers",
              bg: "from-blue-500/12 to-blue-500/4",
              border: "border-blue-500/20",
              icon: ShieldCheck,
              color: "text-blue-500",
              title: "Cases & Covers",
              sub: "200+ styles. Starting ₹149",
            },
            {
              href: "/shop/category/earphones-headphones",
              bg: "from-violet-500/12 to-violet-500/4",
              border: "border-violet-500/20",
              icon: Headphones,
              color: "text-violet-500",
              title: "Earphones & Buds",
              sub: "ANC, TWS & wired. Best quality",
            },
          ].map(({ href, bg, border, icon: Icon, color, title, sub }) => (
            <Link key={title} href={href}>
              <div
                className={`relative overflow-hidden bg-gradient-to-br ${bg} border ${border} rounded-2xl p-5 flex gap-4 items-center hover:shadow-lg transition-all duration-200 cursor-pointer group/promo`}
              >
                <div className="w-12 h-12 rounded-xl bg-background/70 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover/promo:scale-110 transition-transform duration-200">
                  <Icon size={24} className={color} />
                </div>
                <div>
                  <p
                    className="font-black text-sm text-foreground"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  <p
                    className={`text-xs font-bold mt-2 flex items-center gap-1 ${color}`}
                  >
                    Shop Now <ArrowRight size={11} />
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ NEW ARRIVALS ═══ */}
      <section className="bg-muted/20 border-y border-border py-10">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.15em] mb-1.5">
                Just Arrived
              </p>
              <h2
                className="text-2xl font-black text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                New Arrivals
              </h2>
            </div>
            <Link
              href="/shop/products?sort=newest"
              className="flex items-center gap-1 text-primary text-sm font-bold hover:underline"
            >
              View All <ArrowRight size={15} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="min-w-[165px] flex-shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))
              : newArrivals.map((p) => (
                  <div
                    key={p._id}
                    className="min-w-[165px] md:min-w-[165px] flex-shrink-0"
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ═══ SIGN UP CTA ═══ */}
      <section className="max-w-screen-xl mx-auto px-4 md:px-8 py-14">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/6 to-background border border-primary/20 rounded-3xl p-8 md:p-12 text-center">
          {/* Decoration */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="w-14 h-14 bg-primary/12 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Sparkles size={26} className="text-primary" />
            </div>
            <h2
              className="text-2xl md:text-3xl font-black"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Join Thousands of Happy Customers
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
              Create a free account to track orders, save to wishlist, and get
              exclusive member deals.
            </p>
            <div className="flex gap-3 justify-center mt-7 flex-wrap">
              <Link href="/auth/register">
                <button className="bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 transition-all btn-press">
                  Create Free Account
                </button>
              </Link>
              <Link href="/auth/login">
                <button className="border-2 border-border px-8 py-3.5 rounded-2xl font-bold text-sm hover:border-primary hover:text-primary hover:bg-primary/5 transition-all btn-press">
                  Sign In
                </button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              🔒 No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* === FULL PAGE SKELETON === */
function HomePageFullSkeleton() {
  return (
    <div className="animate-pulse space-y-8 p-6">
      <div className="h-2 bg-muted w-full" /> {/* announcement */}
      <div className="h-[60vh] bg-muted rounded-3xl" /> {/* hero */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 bg-muted rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="aspect-square bg-muted rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
