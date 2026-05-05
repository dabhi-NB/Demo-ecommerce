"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import {
  getCategories,
  getFeaturedProducts,
  getProducts,
  getProductBySlug,
  type IProduct,
  type ICategory,
} from "@/services/product.service";
import { getMyOrders, type IOrder } from "@/services/order.service";
import ProductCard from "@/components/layout/shop-layout/ProductCard";
import ProductCardSkeleton from "@/components/layout/shop-layout/ProductCardSkeleton";
import { OrderStatusBadge } from "@/components/layout/order-layout/OrderStatusBadge";
import {
  ShoppingBag,
  Package,
  Heart,
  ShoppingCart,
  User,
  MapPin,
  Lock,
  Shield,
  Monitor,
  Activity,
  ArrowRight,
  Truck,
  Grid3X3,
  Package as PackageIcon,
} from "lucide-react";
import AppConfig from "@/appConfig";
import General from "@/lib/general";

// Greeting based on time of day
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { items: cartItems, totalItems, totalPrice } = useCart();
  const { wishlist } = useWishlist();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // State for dashboard data
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<IProduct[]>([]);
  const [activeOrders, setActiveOrders] = useState<IOrder[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<IProduct[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadRecentlyViewed = async () => {
      try {
        const slugs: string[] = JSON.parse(
          localStorage.getItem("rv_recently_viewed") || "[]",
        );
        if (slugs.length === 0) return;
        const products = await Promise.allSettled(
          slugs.slice(0, 6).map((slug) => getProductBySlug(slug)),
        );
        setRecentlyViewed(
          products
            .filter((r) => r.status === "fulfilled")
            .map((r: any) => r.value),
        );
      } catch {}
    };

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
      getMyOrders(1, "active")
        .then((r) => {
          setActiveOrders(r.orders.slice(0, 3));
          setOrdersTotal(r.total);
        })
        .catch(() => {}),
      loadRecentlyViewed(),
    ]).finally(() => setDataLoading(false));
  }, [isAuthenticated]);

  // Auth loading state - return full page skeleton
  if (authLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen">
      {/* WELCOME BANNER */}
      <div className="border-b border-border bg-gradient-to-r from-primary/8 via-primary/4 to-transparent">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              {getGreeting()},
            </p>
            <h1
              className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {user?.first_name} {user?.last_name} 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Welcome back to RV Mobile Solutions
            </p>
          </div>
          <Link href="/shop/products">
            <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all btn-press flex items-center gap-2 flex-shrink-0">
              <ShoppingBag size={15} />
              <span className="hidden sm:inline">Shop Now</span>
            </button>
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              href: "/shop/account/orders",
              icon: Package,
              label: "Total Orders",
              value: ordersTotal,
              bg: "bg-blue-500/10",
              color: "text-blue-500",
            },
            {
              href: "/shop/account/orders?status=active",
              icon: Truck,
              label: "Active Orders",
              value: activeOrders.length,
              bg: "bg-orange-500/10",
              color: "text-orange-500",
            },
            {
              href: "/shop/account/wishlist",
              icon: Heart,
              label: "Wishlist",
              value: wishlist.length,
              bg: "bg-red-500/10",
              color: "text-red-500",
            },
            {
              href: "/shop/account/cart",
              icon: ShoppingCart,
              label: "In Cart",
              value: totalItems,
              bg: "bg-green-500/10",
              color: "text-green-500",
            },
          ].map(({ href, icon: Icon, label, value, bg, color }) => (
            <Link href={href} key={label}>
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/35 hover:shadow-md transition-all duration-200 cursor-pointer group/stat card-lift">
                <div
                  className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 group-hover/stat:scale-110 transition-transform duration-200`}
                >
                  <Icon size={19} className={color} />
                </div>
                <div>
                  <p
                    className="text-2xl font-black text-foreground leading-none"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {value}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    {label}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ACTIVE ORDERS */}
      {activeOrders.length > 0 && (
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 pb-5">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-base font-black flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span className="w-1 h-5 bg-primary rounded-full inline-block" />
              Active Orders
            </h2>
            <Link
              href="/shop/account/orders"
              className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeOrders.slice(0, 3).map((order) => (
              <Link href={"/shop/account/orders/" + order._id} key={order._id}>
                <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/35 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      #{order.orderNumber}
                    </span>
                    <OrderStatusBadge status={order.status} size="sm" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-2 line-clamp-1">
                    {order.items[0]?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.items.length} item(s)
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="font-black text-sm">
                      ₹{order.totalAmount.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-primary font-bold flex items-center gap-0.5">
                      Track <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY PILLS */}
      <section className="border-b border-border bg-muted/20">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-4">
            Shop by Category
          </p>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
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
            {dataLoading
              ? [1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 min-w-[72px] flex flex-col items-center gap-2 px-3 py-2"
                  >
                    <div className="w-11 h-11 rounded-xl bg-muted animate-pulse" />
                    <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                  </div>
                ))
              : categories.slice(0, 10).map((cat) => (
                  <Link href={"/shop/category/" + cat.slug} key={cat._id}>
                    <div className="flex-shrink-0 flex flex-col items-center gap-2 px-3 py-2 rounded-2xl border border-border hover:border-primary bg-card hover:bg-primary/5 transition-all cursor-pointer group min-w-[72px]">
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-border group-hover:border-primary/50 transition-colors bg-muted flex-shrink-0">
                        {cat.image ? (
                          <img
                            src={General.getCategoryImageUrl(cat.image)}
                            alt={cat.name}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                AppConfig.DEFULT_IMAGE;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <PackageIcon size={18} className="text-primary" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary transition-colors text-center max-w-[64px] line-clamp-2">
                        {cat.name}
                      </span>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* RECENTLY VIEWED */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2
                className="text-base font-black flex items-center gap-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                Recently Viewed
              </h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {dataLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="min-w-[165px] flex-shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))
              : recentlyViewed.map((p) => (
                  <div
                    key={p._id}
                    className="min-w-[165px] md:min-w-[190px] flex-shrink-0"
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
          </div>
        </section>
      )}

      {/* RECOMMENDED */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 pb-6">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[11px] font-black text-primary uppercase tracking-[0.15em] mb-1.5">
              Curated for you
            </p>
            <h2
              className="text-xl font-black"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Recommended
            </h2>
          </div>
          <Link
            href="/shop/products"
            className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {dataLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : featuredProducts
                .slice(0, 10)
                .map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>

      {/* NEW ARRIVALS */}
      <section className="bg-muted/20 border-y border-border py-8">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.15em] mb-1.5">
                Just Arrived
              </p>
              <h2
                className="text-xl font-black"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                New Arrivals
              </h2>
            </div>
            <Link
              href="/shop/products?sort=newest"
              className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {dataLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="min-w-[165px] flex-shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))
              : newArrivals.map((p) => (
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

      {/* ACCOUNT LINKS */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 pb-12">
        <h2
          className="text-base font-black mb-4 flex items-center gap-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span className="w-1 h-5 bg-primary rounded-full inline-block" />
          My Account
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              href: "/shop/account/orders",
              icon: Package,
              label: "My Orders",
              sub: "Track & manage",
            },
            {
              href: "/shop/account/wishlist",
              icon: Heart,
              label: "Wishlist",
              sub: `${wishlist.length} saved items`,
            },
            {
              href: "/shop/account/addresses",
              icon: MapPin,
              label: "Addresses",
              sub: "Delivery locations",
            },
            {
              href: "/account/update",
              icon: User,
              label: "Profile",
              sub: "Personal info",
            },
            {
              href: "/account/password-change",
              icon: Lock,
              label: "Password",
              sub: "Security",
            },
            {
              href: "/account/tfa",
              icon: Shield,
              label: "2FA Auth",
              sub: "Extra security",
            },
            {
              href: "/account/device",
              icon: Monitor,
              label: "Devices",
              sub: "Active sessions",
            },
            {
              href: "/account/user_activity",
              icon: Activity,
              label: "Activity Log",
              sub: "Login history",
            },
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link href={href} key={href}>
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/35 hover:shadow-md transition-all duration-200 cursor-pointer group/acc card-lift">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover/acc:bg-primary/20 transition-colors">
                  <Icon size={17} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {sub}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Full page skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Welcome banner skeleton */}
      <div className="border-b border-border bg-gradient-to-r from-primary/8 via-primary/4 to-transparent py-5 px-4 md:px-8">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="h-4 w-24 bg-muted rounded mb-2" />
            <div className="h-6 w-48 bg-muted rounded mb-1" />
            <div className="h-3 w-36 bg-muted rounded" />
          </div>
          <div className="h-10 w-28 bg-muted rounded-xl" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-xl" />
                <div>
                  <div className="h-6 w-12 bg-muted rounded mb-1" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories skeleton */}
      <section className="border-b border-border bg-muted/20 py-6 px-4 md:px-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="h-3 w-32 bg-muted rounded mb-4" />
          <div className="flex gap-2.5 overflow-x-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 min-w-[72px]">
                <div className="w-11 h-11 bg-muted rounded-xl mb-2" />
                <div className="h-3 w-12 bg-muted rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products skeleton */}
      <section className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
        <div className="h-5 w-40 bg-muted rounded mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Account links skeleton */}
      <section className="max-w-screen-xl mx-auto px-4 md:px-8 pb-12">
        <div className="h-5 w-32 bg-muted rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-muted rounded-xl" />
                <div>
                  <div className="h-4 w-20 bg-muted rounded mb-1" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
