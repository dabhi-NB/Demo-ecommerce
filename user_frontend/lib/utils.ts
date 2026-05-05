import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import AppConfig from "@/appConfig"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to resolve image URLs
// Images come from Admin API (5001), not Main API (5000)
import General from './general';

export function resolveImageUrl(url: string | undefined | null, type: 'product' | 'category' = 'product'): string {
  if (!url) return AppConfig.DEFULT_IMAGE;
  if (type === 'category') return General.getCategoryImageUrl(url);
  return General.getProductImageUrl(url);
}

