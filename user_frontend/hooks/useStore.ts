"use client";
import { useAppSettings } from "@/hooks/useAppSettings";

/**
 * Hook to get store config (currency, type) set by admin.
 * Usage:
 *   const { formatPrice, currencySymbol, storeType } = useStore();
 *   formatPrice(999) => "₹999" or "$999" based on admin setting
 */
export function useStore() {
  const { store } = useAppSettings();

  const formatPrice = (amount: number): string => {
    const symbol = store.currencySymbol || "₹";
    return `${symbol}${amount.toLocaleString("en-IN")}`;
  };

  return {
    storeType: store.type,
    currency: store.currency,
    currencySymbol: store.currencySymbol || "₹",
    formatPrice,
  };
}
