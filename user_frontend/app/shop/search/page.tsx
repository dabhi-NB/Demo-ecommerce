"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Package, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/layout/shop-layout/ProductCard";
import ProductCardSkeleton from "@/components/layout/shop-layout/ProductCardSkeleton";
import {
  getProducts,
  type Product,
  type ProductFilters,
} from "@/services/product.service";

const SUGGESTED_TERMS = [
  "Phone Cases",
  "Chargers",
  "Earphones",
  "Power Banks",
  "Tempered Glass",
  "USB Cables",
];

const PRODUCTS_PER_PAGE = 12;

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  const [query, setQuery] = useState(q);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Fetch products when query changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (!q) {
        setProducts([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      try {
        const filters: ProductFilters = { search: q, limit: PRODUCTS_PER_PAGE };
        const res = await getProducts(filters);
        setProducts(res.products || []);
        setTotal(res.total || 0);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    router.push("/shop/search");
  };

  // Empty state - no search query
  if (!q) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
        {/* Big Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="flex h-12 bg-muted border border-border rounded-2xl overflow-hidden focus-within:border-primary transition-all">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search accessories..."
                className="h-full pl-12 pr-4 bg-transparent border-0 focus-visible:ring-0"
              />
            </div>
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 hover:bg-muted-foreground/10"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </form>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-20">
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">
            Search for accessories
          </p>

          {/* Suggestion Tags */}
          <div className="flex gap-2 flex-wrap justify-center mt-4">
            {SUGGESTED_TERMS.map((term) => (
              <Link
                key={term}
                href={`/shop/search?q=${encodeURIComponent(term)}`}
                className="text-sm px-4 py-1.5 rounded-full border border-border hover:bg-muted hover:border-primary/50 transition-all"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="flex h-12 bg-muted border border-border rounded-2xl overflow-hidden focus-within:border-primary transition-all">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search accessories..."
              className="h-full pl-12 pr-4 bg-transparent border-0 focus-visible:ring-0"
            />
          </div>
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 hover:bg-muted-foreground/10"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && products.length === 0 && q && (
        <div className="text-center py-16">
          <Package className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No results for "{q}"</h3>
          <p className="text-muted-foreground text-sm mt-2 mb-4">
            Try searching for something else
          </p>
          {/* Suggestion Tags */}
          <div className="flex gap-2 flex-wrap justify-center">
            {SUGGESTED_TERMS.map((term) => (
              <Link
                key={term}
                href={`/shop/search?q=${encodeURIComponent(term)}`}
                className="text-sm px-4 py-1.5 rounded-full border border-border hover:bg-muted hover:border-primary/50 transition-all"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && products.length > 0 && (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {total} results for "{q}"
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
