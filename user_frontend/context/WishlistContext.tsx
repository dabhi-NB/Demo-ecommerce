"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import {
  getWishlistFromDB,
  toggleWishlistDB,
  clearWishlistDB,
} from "@/services/wishlist.service";
import type { IProduct } from "@/services/product.service";

interface WishlistContextType {
  wishlistProducts: IProduct[]; // full product objects
  wishlist: string[]; // product IDs for quick lookup
  totalWishlist: number;
  isLoading: boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  refetchWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistProducts, setWishlistProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Quick lookup: product IDs only
  const wishlist = wishlistProducts.map((p) => p._id);

  // ── FETCH ON LOGIN ──
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWishlist();
    } else {
      // Logged out — clear wishlist (no guest wishlist — must login)
      setWishlistProducts([]);
    }
  }, [isAuthenticated, user?.user_id]);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const products = await getWishlistFromDB();
      setWishlistProducts(products);
    } catch {
      setWishlistProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── TOGGLE (add/remove) — no duplicates ──
  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) return;

      // Optimistic update
      const currentlyIn = wishlist.includes(productId);
      if (currentlyIn) {
        setWishlistProducts((prev) => prev.filter((p) => p._id !== productId));
      }
      // If not in, we'll add after API responds with updated product

      try {
        const result = await toggleWishlistDB(productId);
        if (result.inWishlist && !currentlyIn) {
          // Added — refetch to get product details
          await fetchWishlist();
        }
      } catch {
        // Revert optimistic update
        await fetchWishlist();
      }
    },
    [isAuthenticated, wishlist],
  );

  // ── IS WISHLISTED ──
  const isWishlisted = useCallback(
    (productId: string) => {
      return wishlist.includes(productId);
    },
    [wishlist],
  );

  // ── CLEAR ──
  const clearWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await clearWishlistDB();
      setWishlistProducts([]);
    } catch {}
  }, [isAuthenticated]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistProducts,
        wishlist,
        totalWishlist: wishlistProducts.length,
        isLoading,
        toggleWishlist,
        isWishlisted,
        clearWishlist,
        refetchWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
};
