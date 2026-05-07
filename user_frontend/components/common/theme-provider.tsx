"use client";

import { useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAppSettings } from "@/hooks/useAppSettings";

// Convert hex color to HSL CSS string that shadcn/ui expects
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "262 83% 58%"; // fallback indigo

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Load Google Font dynamically
function loadGoogleFont(font: string) {
  if (typeof document === "undefined") return;
  if (font === "Inter") return; // Already loaded via Next.js font
  const existing = document.getElementById("admin-font-link");
  if (existing) existing.remove();

  const link = document.createElement("link");
  link.id = "admin-font-link";
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme(); // keeps dark/light mode working
  const { theme, isLoading } = useAppSettings();

  useEffect(() => {
    if (isLoading) return;

    const root = document.documentElement;

    // Apply primary color as CSS variable (HSL format for shadcn)
    if (theme.primaryColor) {
      const hsl = hexToHsl(theme.primaryColor);
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
    }

    // Apply secondary/accent color
    if (theme.secondaryColor) {
      const hsl = hexToHsl(theme.secondaryColor);
      root.style.setProperty("--accent", hsl);
    }

    // Apply font family
    if (theme.font) {
      loadGoogleFont(theme.font);
      root.style.setProperty("--font-sans", `"${theme.font}", sans-serif`);
    }

    // Apply admin-controlled dark mode default (user override still works)
    const userThemePref = localStorage.getItem("theme");
    if (!userThemePref && theme.darkMode) {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [theme, isLoading]);

  return <>{children}</>;
}
