"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ChevronDown, Package } from "lucide-react";
import ProductCard from "@/components/layout/shop-layout/ProductCard";
import ProductCardSkeleton from "@/components/layout/shop-layout/ProductCardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCategories,
  getProducts,
  clearProductCache,
  type Product,
  type Category,
  type ProductFilters,
} from "@/services/product.service";
import { RefreshCw } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

const PRICE_RANGES = [
  { label: "Under ₹299", min: 0, max: 299 },
  { label: "₹300–₹999", min: 300, max: 999 },
  { label: "₹1,000–₹2,000", min: 1000, max: 2000 },
  { label: "₹2,000+", min: 2000, max: undefined },
];

const PRODUCTS_PER_PAGE = 12;

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [filter, setFilter] = useState({
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "newest",
  });

  // Collapsible states
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
  });

  // Fetch categories
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ProductFilters = {
        category: filter.category || undefined,
        minPrice: filter.minPrice ? Number(filter.minPrice) : undefined,
        maxPrice: filter.maxPrice ? Number(filter.maxPrice) : undefined,
        sort: filter.sort || undefined,
        page,
        limit: PRODUCTS_PER_PAGE,
      };
      const res = await getProducts(filters);
      setProducts(res.products);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update URL
  const updateURL = (updates: Record<string, string>, newPage = 1) => {
    const params = new URLSearchParams();
    Object.entries({ ...filter, ...updates }).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    if (newPage > 1) params.set("page", String(newPage));
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const setFilterCategory = (slug: string) => {
    const newCat = filter.category === slug ? "" : slug;
    setFilter((f) => ({ ...f, category: newCat }));
    updateURL({ category: newCat }, 1);
  };

  const setPriceRange = (min?: number, max?: number) => {
    const newMin = min === undefined ? "" : String(min);
    const newMax = max === undefined ? "" : String(max);
    setFilter((f) => ({ ...f, minPrice: newMin, maxPrice: newMax }));
    updateURL({ minPrice: newMin, maxPrice: newMax }, 1);
  };

  const setCustomPrice = () => {
    updateURL({ minPrice: filter.minPrice, maxPrice: filter.maxPrice }, 1);
  };

  const setSort = (value: string) => {
    setFilter((f) => ({ ...f, sort: value }));
    updateURL({ sort: value }, 1);
  };

  const resetFilters = () => {
    setFilter({ category: "", minPrice: "", maxPrice: "", sort: "newest" });
    router.push("/shop/products", { scroll: false });
  };

  const toggleSection = (section: "categories" | "price") => {
    setOpenSections((s) => ({ ...s, [section]: !s[section] }));
  };

  // Get current category name for title
  const currentCategory = categories.find((c) => c.slug === filter.category);
  const title = currentCategory?.name || "All Products";

  // Check active price range
  const isPriceActive = (min?: number, max?: number) => {
    return (
      filter.minPrice === String(min ?? "") &&
      filter.maxPrice === String(max ?? "")
    );
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight size={13} />
        <span className="text-foreground font-medium">Products</span>
      </nav>

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1
            className="text-2xl font-black"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} products found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              clearProductCache();
              setLoading(true);
              await fetchProducts(); // Trigger refetch
            }}
            className="rounded-xl h-9 gap-1.5 flex-shrink-0"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Stock'}
          </Button>
          <Select value={filter.sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Layout */}
      <div className="hidden md:grid md:grid-cols-[220px_1fr] gap-6">
        {/* Filter Sidebar */}
        <aside className="sticky top-24 h-fit">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Categories */}
            <div className="border-b border-border">
              <button
                onClick={() => toggleSection("categories")}
                className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold"
              >
                Categories
                <ChevronDown
                  size={16}
                  className={`transition-transform ${openSections.categories ? "rotate-180" : ""}`}
                />
              </button>
              {openSections.categories && (
                <div className="px-4 pb-4 space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => setFilterCategory(cat.slug)}
                      className={`flex items-center gap-2.5 w-full py-2 px-3 rounded-xl text-sm transition-all ${
                        filter.category === cat.slug
                          ? "bg-primary/12 text-primary font-semibold border border-primary/25"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        {cat.image && (
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            width={20}
                            height={20}
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range */}
            <div className="border-b border-border">
              <button
                onClick={() => toggleSection("price")}
                className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold"
              >
                Price Range
                <ChevronDown
                  size={16}
                  className={`transition-transform ${openSections.price ? "rotate-180" : ""}`}
                />
              </button>
              {openSections.price && (
                <div className="px-4 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {PRICE_RANGES.map((range, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPriceRange(range.min, range.max)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          isPriceActive(range.min, range.max)
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Min ₹"
                      type="number"
                      value={filter.minPrice}
                      onChange={(e) =>
                        setFilter((f) => ({ ...f, minPrice: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && setCustomPrice()}
                      className="h-9 rounded-xl"
                    />
                    <Input
                      placeholder="Max ₹"
                      type="number"
                      value={filter.maxPrice}
                      onChange={(e) =>
                        setFilter((f) => ({ ...f, maxPrice: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && setCustomPrice()}
                      className="h-9 rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Reset */}
            <div className="p-4">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full rounded-xl"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div>
          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && products.length === 0 && (
            <div className="text-center py-16">
              <Package
                size={48}
                className="text-muted-foreground mx-auto mb-4"
              />
              <h3 className="text-lg font-semibold">No products found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Try adjusting your filters
              </p>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="mt-4 rounded-xl"
              >
                Reset Filters
              </Button>
            </div>
          )}

          {/* Products */}
          {!loading && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center gap-1.5 mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  setPage((p) => p - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={page === 1}
                className="rounded-xl text-sm font-semibold h-9"
              >
                ← Prev
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={page === p ? "default" : "outline"}
                  onClick={() => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`w-9 h-9 rounded-xl text-sm font-medium ${page === p ? "" : "border-0"}`}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setPage((p) => p + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={page === totalPages}
                className="rounded-xl text-sm font-semibold h-9"
              >
                Next →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No products found</h3>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="mt-4 rounded-xl"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
