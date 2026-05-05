"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";

/**
 * Recently Viewed Context Type
 */
interface RecentlyViewedContextType {
  recentlyViewed: string[]; // stores slugs
  addToRecentlyViewed: (productSlug: string) => void;
  clearRecentlyViewed: () => void;
}

const RecentlyViewedContext = createContext<
  RecentlyViewedContextType | undefined
>(undefined);

const RECENTLY_VIEWED_STORAGE_KEY = "rv_recently_viewed";
const MAX_RECENT_ITEMS = 10;

/**
 * Recently Viewed Provider Component
 */
export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  // Load recently viewed from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (stored) {
      try {
        const parsedList = JSON.parse(stored);
        if (Array.isArray(parsedList)) {
          setRecentlyViewed(parsedList);
        }
      } catch (error) {
        console.error("Error parsing recently viewed:", error);
      }
    }
  }, []);

  // Sync to localStorage on every change
  useEffect(() => {
    localStorage.setItem(
      RECENTLY_VIEWED_STORAGE_KEY,
      JSON.stringify(recentlyViewed),
    );
  }, [recentlyViewed]);

  /**
   * Add product to recently viewed (at the beginning, max 10 items)
   */
  const addToRecentlyViewed = useCallback((productSlug: string) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists (to move to front)
      const filtered = prev.filter((slug) => slug !== productSlug);
      // Add to beginning
      const updated = [productSlug, ...filtered];
      // Limit to max items
      return updated.slice(0, MAX_RECENT_ITEMS);
    });
  }, []);

  /**
   * Clear all recently viewed items
   */
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
  }, []);

  const value: RecentlyViewedContextType = {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
  };

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

/**
 * Hook to use recently viewed context
 */
export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (context === undefined) {
    throw new Error(
      "useRecentlyViewed must be used within a RecentlyViewedProvider",
    );
  }
  return context;
}
