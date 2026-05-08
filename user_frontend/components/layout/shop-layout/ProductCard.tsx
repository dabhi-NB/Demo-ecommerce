"use client";

import { toast } from "sonner";
import { cn, resolveImageUrl } from "@/lib/utils";
import AppConfig from "@/appConfig";
import General from "@/lib/general";
import { Heart, ShoppingCart, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { IProduct } from "@/services/product.service";
import { useStore } from "@/hooks/useStore";

interface ProductCardProps {
  product: IProduct;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const { addToCart, isInCart, openDrawer } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const router = useRouter();
  const { formatPrice } = useStore();

  // DEBUG STOCK - console.log(`Product ${product._id}: hasVariants=${product.hasVariants}, stock=${product.stock}, totalStock=${product.totalStock}, displayStock=${totalStock}`);

  const hasVariants = product.hasVariants || false;
  const totalStock = hasVariants
    ? (product.totalStock ?? 0)
    : (product.stock ?? 0);
  const minPrice = product.minPrice ?? product.salePrice ?? product.price ?? 0;
  const maxPrice = product.maxPrice ?? product.price ?? 0;
  const price = product.salePrice ?? product.price;
  const disc = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;
  const inCart = isAuthenticated && isInCart(product._id);
  const wished = isAuthenticated && isWishlisted(product._id);

  // Button label logic
  const buttonLabel = (() => {
    if (hasVariants) return "Select Options";
    if (inCart) return "Go to Cart";
    return "Add to Cart";
  })();

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Always go to product page for products with variants
    if (hasVariants) {
      router.push("/shop/products/" + product.slug);
      return;
    }

    if (!isAuthenticated) {
      router.push(
        "/auth/login?redirect=" +
          encodeURIComponent("/shop/products/" + product.slug),
      );
      return;
    }
    if (inCart) {
      openDrawer();
      return;
    }
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.salePrice ?? product.price,
      image: product.images?.[0] || "",
      quantity: 1,
      maxStock: product.stock,
      slug: product.slug,
      variantId: null,
      variant: undefined,
    });
    toast.success("Added to cart!", { duration: 1600 });
  };

  const onWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/shop/account/wishlist");
      return;
    }
    toggleWishlist(product._id);
    toast.success(wished ? "Removed from wishlist" : "Saved to wishlist ♥", {
      duration: 1400,
    });
  };

  // Safe check for variantOptions
  const hasVariantOptions = !!(
    product.variantOptions && product.variantOptions.length > 0
  );

  return (
    <Link
      href={"/shop/products/" + product.slug}
      className={cn(
        "group block bg-card border border-border rounded-2xl overflow-hidden card-lift",
        className,
      )}
    >
      {/* IMAGE */}
      <div className="relative bg-muted/30" style={{ aspectRatio: "1/1" }}>
        {product.images?.[0] ? (
          <img
            src={General.getProductImageUrl(product.images[0])}
            alt={product.name}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: "12px",
              transition: "transform 400ms",
            }}
            className="group-hover:scale-[1.06]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <img
            src={AppConfig.DEFULT_IMAGE}
            alt="No image"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: "12px",
              opacity: 0.2,
            }}
            loading="lazy"
          />
        )}

        {/* Variant count badge */}
        {hasVariantOptions && (
          <div className="absolute bottom-2 left-2">
            <span className="text-[10px] bg-background/90 backdrop-blur-sm border border-border px-2 py-0.5 rounded-full font-semibold">
              {product.variants?.length || ""} options
            </span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {disc >= 5 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
              {disc}% OFF
            </span>
          )}
          {!product.salePrice && totalStock > 0 && totalStock <= 5 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
              Only {totalStock} left
            </span>
          )}
        </div>

        {/* Wishlist button — appears on hover */}
        <button
          onClick={onWish}
          className="absolute top-2.5 right-2.5 w-8 h-8 bg-background/90 backdrop-blur-sm border border-border/70 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 hover:scale-110 hover:border-red-300 transition-all duration-200"
        >
          <Heart
            size={14}
            className={
              wished ? "fill-red-500 text-red-500" : "text-muted-foreground"
            }
          />
        </button>

        {/* Out of stock */}
        {totalStock === 0 && (
          <div className="absolute inset-0 bg-background/65 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-background/95 border border-border text-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* INFO */}
      <div className="p-3">
        {product.brand && (
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
            {product.brand}
          </p>
        )}

        <p
          className="text-sm font-semibold text-foreground line-clamp-2 leading-snug"
          style={{ minHeight: "2.5rem" }}
        >
          {product.name}
        </p>

        {product.ratings.count > 4 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">
              {product.ratings.avg.toFixed(1)} ★
            </span>
            <span className="text-[11px] text-muted-foreground">
              (
              {product.ratings.count >= 1000
                ? (product.ratings.count / 1000).toFixed(1) + "k"
                : product.ratings.count}
              )
            </span>
          </div>
        )}

        {/* Price Display - handles variant min/max prices */}
        <div className="flex items-baseline gap-2 mt-2 flex-wrap">
          {hasVariants && minPrice !== maxPrice ? (
            <p className="text-base font-black text-foreground">
              {formatPrice(minPrice ?? 0)} – {formatPrice(maxPrice ?? 0)}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-black text-foreground">
                {formatPrice(price ?? 0)}
              </span>
              {product.salePrice && (
                <span className="text-xs text-muted-foreground/70 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stock indicator */}
        {totalStock === 0 ? (
          <p className="text-xs text-destructive font-semibold mt-1">
            Out of Stock
          </p>
        ) : totalStock <= 5 ? (
          <p className="text-xs text-orange-500 font-semibold mt-1">
            Only {totalStock} left
          </p>
        ) : null}

        <p
          className={`text-[11px] mt-0.5 font-medium ${price >= 999 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
        >
          {price >= 999 ? "✓ Free delivery" : "+ ₹99 delivery"}
        </p>

        <button
          onClick={handleCartClick}
          disabled={totalStock === 0}
          className={cn(
            "w-full mt-2.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 btn-press flex items-center justify-center gap-1.5",
            totalStock === 0
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : inCart
                ? "bg-primary/12 text-primary border border-primary/40 hover:bg-primary/20"
                : hasVariants
                  ? "bg-muted text-foreground border border-border hover:bg-muted/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-sm hover:shadow-primary/10",
          )}
        >
          <ShoppingCart size={14} />
          {totalStock === 0 ? "Out of Stock" : buttonLabel}
        </button>
      </div>
    </Link>
  );
}
