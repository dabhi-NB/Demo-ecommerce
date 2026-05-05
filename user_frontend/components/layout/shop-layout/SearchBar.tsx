"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { searchProducts, type Product } from "@/services/product.service";

interface SearchBarProps {
  className?: string;
}

/**
 * SearchBar component — global search with live suggestions
 * Appears in header — expandable search
 */
export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchProducts(query);
        setSuggestions(results.slice(0, 8)); // Limit to 8 suggestions
      } catch (error) {
        console.error("Search error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/shop/search?q=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
      }
    },
    [query, router]
  );

  const handleSuggestionClick = useCallback(
    (slug: string) => {
      router.push(`/shop/products/${slug}`);
      setIsOpen(false);
      setQuery("");
    },
    [router]
  );

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Input
            type="search"
            placeholder="Search accessories, brands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
            className="w-full pr-10"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <button
              type="submit"
              className="p-1 hover:bg-muted rounded-full"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl p-2 max-h-80 overflow-y-auto z-50">
          {isLoading ? (
            // Loading skeletons
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            // Suggestions list
            suggestions.map((product) => (
              <div
                key={product._id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                onClick={() => handleSuggestionClick(product.slug)}
              >
                <div className="h-10 w-10 rounded-lg bg-muted/50 flex-shrink-0 overflow-hidden">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))
          ) : query.length >= 2 ? (
            // No results
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results for &apos;{query}&apos;
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
