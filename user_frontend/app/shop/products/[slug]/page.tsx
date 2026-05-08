"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Package,
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/layout/shop-layout/ProductCard";
import {
  getProductBySlug,
  getRelatedProducts,
  type Product,
} from "@/services/product.service";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/hooks/useStore";
import AppConfig from "@/appConfig";
import General from "@/lib/general";
import { toast } from "sonner";

type TabType = "description" | "specifications" | "compatible";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { isAuthenticated } = useAuth();
  const { formatPrice } = useStore();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // New variant selection state
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [mainImage, setMainImage] = useState<string>("");

  // Helper to find matching variant from selected options
  const findMatchingVariant = (options: Record<string, string>) => {
    if (!product?.variants || product.variants.length === 0) return null;
    return (
      product.variants.find(
        (v: any) =>
          v.combination?.every((c: any) => options[c.name] === c.value) &&
          v.isActive,
      ) || null
    );
  };

  // Handle option selection
  const handleOptionSelect = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);

    // Auto-find variant when all options are selected
    const variantOptionsLength = product?.variantOptions?.length || 0;
    if (
      product?.variantOptions &&
      Object.keys(newOptions).length === variantOptionsLength
    ) {
      const matched = findMatchingVariant(newOptions);
      setSelectedVariant(matched);
      if (!matched) {
        setSelectedVariant(null);
      }
    }
  };

  // Display price based on variant
  const displayPrice = selectedVariant
    ? (selectedVariant.salePrice ??
      selectedVariant.price ??
      product?.salePrice ??
      product?.price ??
      0)
    : (product?.salePrice ?? product?.price ?? 0);

  const originalPrice = selectedVariant
    ? (selectedVariant.price ?? product?.price ?? 0)
    : (product?.price ?? 0);

  // Display stock based on variant
  const displayStock = selectedVariant
    ? selectedVariant.stock
    : product?.hasVariants
      ? product.variants?.reduce(
          (sum: number, v: any) => sum + (v.stock || 0),
          0,
        ) || 0
      : (product?.stock ?? 0);

  const wishlisted = product ? isWishlisted(product.slug) : false;
  const inCart = isInCart(product?._id ?? "");
  const discountPct =
    originalPrice > displayPrice
      ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
      : 0;

  // Initialize main image
  useEffect(() => {
    if (product?.images?.[0]) {
      setMainImage(product.images[0]);
    }
  }, [product]);

  // Update main image when variant changes
  useEffect(() => {
    if (selectedVariant?.images?.[0]) {
      setMainImage(selectedVariant.images[0]);
    } else if (product?.images?.[0]) {
      setMainImage(product.images[0]);
    }
  }, [selectedVariant, product]);

  // Fetch product and update recently viewed
  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const productData = await getProductBySlug(slug);
        setProduct(productData);

        // Update localStorage for recently viewed
        if (typeof window !== "undefined") {
          const slugs = JSON.parse(
            localStorage.getItem("rv_recently_viewed") || "[]",
          );
          const updated = [
            slug,
            ...slugs.filter((s: string) => s !== slug),
          ].slice(0, 6);
          localStorage.setItem("rv_recently_viewed", JSON.stringify(updated));
        }

        // Fetch related products
        if (productData.category?._id) {
          const related = await getRelatedProducts(
            productData._id,
            productData.category._id,
          );
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/shop/products/${slug}`);
      return;
    }

    // Validate variant selection
    const variantOptionsLength = product.variantOptions?.length ?? 0;
    if (
      product.hasVariants &&
      Object.keys(selectedOptions).length < variantOptionsLength
    ) {
      toast.error("Please select all options before adding to cart");
      return;
    }

    if (displayStock === 0) {
      toast.error("This item is out of stock");
      return;
    }

    addToCart({
      productId: product._id,
      name: product.name,
      price: displayPrice,
      image: mainImage || product.images?.[0],
      quantity,
      maxStock: displayStock,
      slug: product.slug,
      variantId: selectedVariant?._id || null,
      variant: selectedVariant
        ? { combination: selectedVariant.combination }
        : undefined,
    });
    toast.success("Added to cart!");
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/shop/products/${slug}`);
      return;
    }

    // Validate variant selection
    const variantOptionsLength = product.variantOptions?.length ?? 0;
    if (
      product.hasVariants &&
      Object.keys(selectedOptions).length < variantOptionsLength
    ) {
      toast.error("Please select all options before adding to cart");
      return;
    }

    if (displayStock === 0) {
      toast.error("This item is out of stock");
      return;
    }

    addToCart({
      productId: product._id,
      name: product.name,
      price: displayPrice,
      image: mainImage || product.images?.[0],
      quantity,
      maxStock: displayStock,
      slug: product.slug,
      variantId: selectedVariant?._id || null,
      variant: selectedVariant
        ? { combination: selectedVariant.combination }
        : undefined,
    });
    router.push("/shop/account/checkout");
  };

  const handleWishlist = () => {
    if (!product) return;
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/shop/account/wishlist");
      return;
    }
    toggleWishlist(product.slug);
    toast.success(wishlisted ? "Removed from wishlist" : "Saved to wishlist ♥");
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= displayStock) setQuantity(newQty);
  };

  const renderStars = (avg: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(avg) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-4">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <div className="aspect-square bg-muted/30 rounded-2xl animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-16 h-16 bg-muted/30 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
            <div className="h-10 w-3/4 bg-muted/30 rounded animate-pulse" />
            <div className="h-6 w-32 bg-muted/30 rounded animate-pulse" />
            <div className="h-16 w-full bg-muted/30 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-4 text-center py-20">
        <Package size={48} className="text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <p className="text-muted-foreground text-sm mt-1">
          The product you're looking for doesn't exist.
        </p>
        <Link href="/shop/products">
          <Button className="mt-4 rounded-xl">Browse Products</Button>
        </Link>
      </div>
    );
  }

  const variantOptionsLength = product.variantOptions?.length || 0;

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-4 pb-24 md:pb-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight size={13} />
        <Link
          href={`/shop/category/${product.category?.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {product.category?.name || "Products"}
        </Link>
        <ChevronRight size={13} />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Product Section */}
      <div className="md:grid md:grid-cols-2 gap-10">
        {/* LEFT - Image Gallery */}
        <div className="md:sticky md:top-24 md:h-fit">
          <div className="relative aspect-square bg-muted/20 rounded-2xl border border-border overflow-hidden">
            {mainImage ? (
              <img
                src={General.getProductImageUrl(mainImage)}
                alt={product.name}
                className="w-full h-full object-contain p-5"
                loading="eager"
              />
            ) : (
              <img
                src={AppConfig.DEFULT_IMAGE}
                alt="No image"
                className="w-full h-1/2 object-contain p-5 opacity-20"
              />
            )}
          </div>
          <div className="flex gap-2 mt-3">
            {product.images?.map((img, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveImageIndex(i);
                  setMainImage(img);
                }}
                className={`relative w-16 h-16 rounded-xl border-2 cursor-pointer bg-muted/20 ${activeImageIndex === i ? "border-primary shadow-sm shadow-primary/20" : "border-transparent hover:border-primary/40"} overflow-hidden`}
              >
                <img
                  src={General.getProductImageUrl(img)}
                  alt={`${product.name} ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT - Product Info */}
        <div>
          {/* Brand */}
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1">
            {product.brand}
          </p>

          {/* Name */}
          <h1
            className="text-2xl md:text-3xl font-black leading-snug"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {product.name}
          </h1>

          {/* Rating */}
          {(product.ratings?.count ?? 0) > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-xl inline-flex items-center gap-1">
                {product.ratings?.avg?.toFixed(1)} ★
              </span>
              <span className="text-sm text-muted-foreground">
                {product.ratings?.count} ratings
              </span>
            </div>
          )}

          {/* VARIANT SELECTION UI */}
          {product.variantOptions && product.variantOptions.length > 0 && (
            <div className="space-y-4 border-t border-border pt-4 mt-4">
              {product.variantOptions.map((option: any) => (
                <div key={option.name}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold">
                      {option.name}:
                    </span>
                    {selectedOptions[option.name] && (
                      <span className="text-sm text-muted-foreground">
                        {selectedOptions[option.name]}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value: string) => {
                      const testOptions = {
                        ...selectedOptions,
                        [option.name]: value,
                      };
                      const matchingVariant = findMatchingVariant(
                        Object.keys(testOptions).length === variantOptionsLength
                          ? testOptions
                          : {},
                      );
                      const isOutOfStock =
                        Object.keys(testOptions).length === variantOptionsLength
                          ? !matchingVariant || matchingVariant.stock === 0
                          : false;
                      const isSelected = selectedOptions[option.name] === value;

                      // COLOR OPTION — show color circles
                      if (option.name.toLowerCase() === "color") {
                        const COLOR_MAP: Record<string, string> = {
                          black: "#1a1a1a",
                          white: "#f5f5f5",
                          red: "#ef4444",
                          blue: "#3b82f6",
                          green: "#22c55e",
                          gold: "#d4af37",
                          silver: "#c0c0c0",
                          purple: "#a855f7",
                          pink: "#ec4899",
                          orange: "#f97316",
                          grey: "#6b7280",
                          gray: "#6b7280",
                        };
                        const colorHex =
                          COLOR_MAP[value.toLowerCase()] || "#e5e7eb";

                        return (
                          <button
                            key={value}
                            onClick={() =>
                              !isOutOfStock &&
                              handleOptionSelect(option.name, value)
                            }
                            disabled={isOutOfStock}
                            title={
                              value + (isOutOfStock ? " — Out of stock" : "")
                            }
                            className={`relative w-9 h-9 rounded-full border-2 transition-all ${
                              isSelected
                                ? "border-primary scale-110 shadow-md shadow-primary/20"
                                : "border-border hover:border-primary/50"
                            } ${isOutOfStock ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                            style={{ backgroundColor: colorHex }}
                          >
                            {isSelected && (
                              <svg
                                className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                />
                              </svg>
                            )}
                            {isOutOfStock && (
                              <div className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center">
                                <div className="w-full h-px bg-destructive rotate-45" />
                              </div>
                            )}
                          </button>
                        );
                      }

                      // OTHER OPTIONS — text buttons
                      return (
                        <button
                          key={value}
                          onClick={() =>
                            !isOutOfStock &&
                            handleOptionSelect(option.name, value)
                          }
                          disabled={isOutOfStock}
                          className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 text-primary font-bold"
                              : "border-border text-foreground hover:border-primary/50"
                          } ${isOutOfStock ? "opacity-40 cursor-not-allowed line-through" : "cursor-pointer"}`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Variant validation message */}
              {variantOptionsLength > 0 &&
                Object.keys(selectedOptions).length < variantOptionsLength && (
                  <p className="text-xs text-orange-500">
                    Please select:{" "}
                    {product.variantOptions
                      .filter((o: any) => !selectedOptions[o.name])
                      .map((o: any) => o.name)
                      .join(", ")}
                  </p>
                )}
              {selectedVariant && selectedVariant.sku && (
                <p className="text-xs text-muted-foreground">
                  SKU: {selectedVariant.sku}
                </p>
              )}
            </div>
          )}

          {/* Price Box */}
          <div className="bg-muted/30 rounded-2xl p-4 mt-4 border border-border/50">
            <div className="flex items-baseline gap-3">
              <span
                className="text-3xl font-black text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {formatPrice(displayPrice ?? 0)}
              </span>
              {originalPrice && originalPrice !== displayPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(originalPrice ?? 0)}
                </span>
              )}
              {originalPrice &&
                displayPrice &&
                originalPrice !== displayPrice && (
                  <span className="text-sm bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold">
                    {Math.round(
                      ((originalPrice - displayPrice) / originalPrice) * 100,
                    )}
                    % off
                  </span>
                )}
            </div>

            {/* Stock Display */}
            {displayStock === 0 ? (
              <p className="text-sm text-destructive font-semibold flex items-center gap-1 mt-2">
                <X size={14} /> Out of Stock
              </p>
            ) : displayStock <= 5 ? (
              <p className="text-sm text-orange-500 font-semibold mt-2">
                Only {displayStock} left!
              </p>
            ) : (
              <p className="text-sm text-green-600 font-semibold flex items-center gap-1 mt-2">
                <Check size={14} /> In Stock
              </p>
            )}
          </div>

          {/* Quantity */}
          {displayStock > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">Quantity</p>
              <div className="flex items-center gap-0 border border-border rounded-xl w-fit overflow-hidden">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity === 1}
                  className="w-10 h-10 hover:bg-muted disabled:opacity-50"
                >
                  <Minus className="w-4 h-4 mx-auto" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= displayStock}
                  className="w-10 h-10 hover:bg-muted disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex flex-col gap-3 mt-6">
            <Button
              onClick={handleAddToCart}
              disabled={displayStock === 0}
              className="w-full py-3.5 rounded-2xl font-bold text-sm btn-press bg-primary text-primary-foreground"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {inCart
                ? "Go to Cart"
                : displayStock === 0
                  ? "Out of Stock"
                  : "Add to Cart"}
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={displayStock === 0}
              variant="outline"
              className="w-full py-3.5 rounded-2xl font-bold text-sm btn-press border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Buy Now
            </Button>
            <button
              onClick={handleWishlist}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mt-2"
            >
              <Heart
                size={15}
                className={wishlisted ? "fill-red-500 text-red-500" : ""}
              />
              {wishlisted ? "Saved to Wishlist" : "Add to Wishlist"}
            </button>
          </div>

          {/* Features Grid */}
          <div className="bg-muted/20 rounded-2xl p-4 grid grid-cols-2 gap-3 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              100% Genuine
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-4 h-4 text-blue-500" />
              Free delivery ₹999+
            </div>
            <div className="flex items-center gap-2 text-sm">
              <RotateCcw className="w-4 h-4 text-orange-500" />
              7-Day Returns
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-purple-500" />
              Secure packaging
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Actions */}
      <div className="fixed bottom-0 left-0 right-0 flex gap-2 p-3 bg-background/95 backdrop-blur-md border-t border-border z-40 md:hidden">
        <Button
          onClick={handleAddToCart}
          disabled={displayStock === 0}
          className="flex-1 py-3 rounded-2xl font-bold text-sm"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {inCart ? "Cart" : "Add"}
        </Button>
        <Button
          onClick={handleBuyNow}
          disabled={displayStock === 0}
          variant="outline"
          className="flex-1 py-3 rounded-2xl font-bold text-sm border-2 border-primary"
        >
          Buy Now
        </Button>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="flex border-b border-border">
          {(["description", "specifications", "compatible"] as TabType[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 text-sm font-medium ${activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab === "description"
                  ? "Description"
                  : tab === "specifications"
                    ? "Product Details"
                    : "Compatible With"}
              </button>
            ),
          )}
        </div>
        <div className="mt-4 text-sm text-muted-foreground leading-relaxed">
          {activeTab === "description" &&
            (product.description || "No description available.")}
          {activeTab === "specifications" &&
            (product.specs && Object.keys(product.specs).length > 0 ? (
              <div className="divide-y divide-border">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-3">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No specifications available</p>
            ))}
          {activeTab === "compatible" &&
            (product.compatible?.length ? (
              <div className="flex flex-wrap gap-2">
                {product.compatible?.map((item, i) => (
                  <Badge key={i} variant="outline" className="rounded-full">
                    {item}
                  </Badge>
                ))}
              </div>
            ) : (
              <p>Compatible with all phones</p>
            ))}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-14">
          <h2
            className="text-2xl font-black mb-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Similar Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
