"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/layout/shop-layout/ProductCard";
import ProductCardSkeleton from "@/components/layout/shop-layout/ProductCardSkeleton";
import {
  getCategoryBySlug,
  getProducts,
  getCategories,
  type IProduct,
  type ICategory,
  type ProductFilters,
} from "@/services/product.service";

// Sort options
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
  { value: "top_rated", label: "Top Rated" },
];

// Quick price range buttons
const PRICE_RANGES = [
  { label: "Under ₹299", minPrice: 0, maxPrice: 299 },
  { label: "₹300–₹999", minPrice: 300, maxPrice: 999 },
  { label: "₹1,000–₹2,000", minPrice: 1000, maxPrice: 2000 },
  { label: "₹2,000+", minPrice: 2000, maxPrice: undefined },
];

const PRODUCTS_PER_PAGE = 12;

export default function CategoryProductsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [category, setCategory] = useState<ICategory | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Filters from URL
  const [filters, setFilters] = useState<ProductFilters>({
    category: slug,
    brand: "",
    minPrice: undefined,
    maxPrice: undefined,
    sort: "newest",
    search: "",
  });

  // Custom price inputs
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  // Initialize from URL params
  useEffect(() => {
    const brand = searchParams.get("brand") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "newest";
    const search = searchParams.get("search") || "";
    const pageParam = searchParams.get("page");

    setFilters((prev) => ({
      ...prev,
      category: slug,
      brand,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      search,
    }));

    setMinPriceInput(minPrice || "");
    setMaxPriceInput(maxPrice || "");
    setPage(pageParam ? Number(pageParam) : 1);
  }, [searchParams, slug]);

  // Fetch category and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryData, categoriesData] = await Promise.all([
          getCategoryBySlug(slug),
          getCategories(),
        ]);
        setCategory(categoryData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [slug]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await getProducts({
          ...filters,
          page,
          limit: PRODUCTS_PER_PAGE,
        });
        setProducts(response.products);
        setTotal(response.total);
        setTotalPages(response.totalPages);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters, page]);

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: Partial<ProductFilters>, newPage?: number) => {
      const params = new URLSearchParams();

      if (newFilters.brand) params.set("brand", newFilters.brand);
      if (newFilters.minPrice)
        params.set("minPrice", String(newFilters.minPrice));
      if (newFilters.maxPrice)
        params.set("maxPrice", String(newFilters.maxPrice));
      if (newFilters.sort) params.set("sort", newFilters.sort);
      if (newFilters.search) params.set("search", newFilters.search);
      if (newPage && newPage > 1) params.set("page", String(newPage));

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  // Filter handlers
  const handlePriceRange = (min?: number, max?: number) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: min,
      maxPrice: max,
    }));
    setMinPriceInput(min ? String(min) : "");
    setMaxPriceInput(max ? String(max) : "");
    updateURL({ minPrice: min, maxPrice: max }, 1);
  };

  const handleCustomPrice = () => {
    const min = minPriceInput ? Number(minPriceInput) : undefined;
    const max = maxPriceInput ? Number(maxPriceInput) : undefined;
    setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
    updateURL({ minPrice: min, maxPrice: max }, 1);
  };

  const handleSortChange = (value: string) => {
    setFilters((prev) => ({ ...prev, sort: value }));
    updateURL({ sort: value }, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({}, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setFilters({
      category: slug,
      brand: "",
      minPrice: undefined,
      maxPrice: undefined,
      sort: "newest",
      search: "",
    });
    setMinPriceInput("");
    setMaxPriceInput("");
    setPage(1);
    router.push(`/shop/category/${slug}`, { scroll: false });
  };

  // Check if price range is selected
  const isPriceSelected = (min?: number, max?: number) => {
    return filters.minPrice === min && filters.maxPrice === max;
  };

  // Filter Sidebar Component (without category selector since we're in category page)
  const FilterSidebarContent = ({
    isMobile = false,
  }: {
    isMobile?: boolean;
  }) => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Price Range</h3>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((range, idx) => (
            <button
              key={idx}
              onClick={() => handlePriceRange(range.minPrice, range.maxPrice)}
              className={`rounded-full border text-xs px-3 py-1 transition ${
                isPriceSelected(range.minPrice, range.maxPrice)
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <Input
            placeholder="Min"
            type="number"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomPrice()}
            className="h-9 text-sm"
          />
          <Input
            placeholder="Max"
            type="number"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomPrice()}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Reset Button */}
      <Button variant="outline" onClick={handleReset} className="w-full">
        Reset Filters
      </Button>
    </div>
  );

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const delta = 2;
      const range: number[] = [];
      for (
        let i = Math.max(2, page - delta);
        i <= Math.min(totalPages - 1, page + delta);
        i++
      ) {
        range.push(i);
      }

      if (page - delta > 2) {
        pages.push(1, "...");
      } else {
        pages.push(1);
      }

      pages.push(...range);

      if (page + delta < totalPages - 1) {
        pages.push("...", totalPages);
      } else if (totalPages > 1) {
        pages.push(totalPages);
      }

      return pages;
    };

    return (
      <div className="flex justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="rounded-xl"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            typeof p === "number" ? (
              <Button
                key={idx}
                variant={page === p ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(p)}
                className="w-9 rounded-xl"
              >
                {p}
              </Button>
            ) : (
              <span key={idx} className="px-2 text-muted-foreground">
                {p}
              </span>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="rounded-xl"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  };

  // Loading state
  if (!category && loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="h-4 w-32 bg-muted/30 rounded animate-pulse mb-2" />
          <div className="h-10 w-64 bg-muted/30 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Category Not Found</h2>
          <p className="text-muted-foreground">
            The category you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/shop/category")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Go Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Breadcrumb */}
        <div className="text-xs text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/shop/category" className="hover:text-foreground">
            Categories
          </Link>
          <span className="mx-2">/</span>
          <span>{category.name}</span>
        </div>

        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-2">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {total} products found
        </p>

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6 mt-4 flex-wrap gap-3">
          <span className="text-sm text-muted-foreground">
            {total} products
          </span>
          <Select value={filters.sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <aside className="col-span-1">
            <div className="sticky top-20 h-fit">
              <FilterSidebarContent />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="col-span-3">
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Package className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-semibold">No products found</p>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your filters
                </p>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {!loading && products.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {!loading && <Pagination />}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Mobile Filter & Sort */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] overflow-y-auto">
                <FilterSidebarContent isMobile />
              </SheetContent>
            </Sheet>

            <span className="text-sm text-muted-foreground">
              {total} products
            </span>
          </div>

          {loading && (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-16">
              <Package className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-semibold">No products found</p>
              <p className="text-muted-foreground text-sm">
                Try adjusting your filters
              </p>
              <Button variant="outline" onClick={handleReset} className="mt-4">
                Clear Filters
              </Button>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {!loading && <Pagination />}
        </div>
      </div>
    </div>
  );
}
