"use client";

import { useEffect } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";

/**
 * Converts hex color (#rrggbb) → "H S% L%" string for CSS HSL
 * shadcn/ui uses bare HSL values (no hsl() wrapper) for CSS vars
 */
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "262 83% 58%";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Dynamically load a Google Font (skips Inter — loaded by Next.js) */
function loadGoogleFont(font: string) {
  if (typeof document === "undefined" || font === "Inter") return;
  const existing = document.getElementById("admin-font-link");
  if (existing) existing.remove();
  const link = document.createElement("link");
  link.id = "admin-font-link";
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

/**
 * ThemeProvider — applies admin-configured theme (colors, font) as CSS variables.
 * Does NOT touch light/dark mode — that is handled exclusively by useTheme().
 * User dark/light preference (stored in localStorage "theme") always takes priority.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, isLoading } = useAppSettings();

  useEffect(() => {
    if (isLoading) return;

    const root = document.documentElement;

    // ── Admin primary color → CSS variable (HSL, both light + dark) ──
    if (theme.primaryColor) {
      const hsl = hexToHsl(theme.primaryColor);
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--sidebar-primary", hsl);
    }

    // ── Admin accent/secondary color ──
    if (theme.secondaryColor) {
      const hsl = hexToHsl(theme.secondaryColor);
      root.style.setProperty("--accent", hsl);
    }

    // ── Admin font ──
    if (theme.font) {
      loadGoogleFont(theme.font);
      root.style.setProperty(
        "--font-sans",
        `"${theme.font}", ui-sans-serif, system-ui, sans-serif`,
      );
    }

    // ── Admin default dark mode — only apply if user has NO stored preference ──
    // useTheme() handles all subsequent toggles and stores to localStorage("theme")
    const userPref = localStorage.getItem("theme");
    if (!userPref) {
      // First visit — apply admin default
      const effectiveClass = theme.darkMode ? "dark" : "light";
      root.classList.remove("light", "dark");
      root.classList.add(effectiveClass);
      // Do NOT store to localStorage here — let useTheme() own that
    }
  }, [theme, isLoading]);

  return <>{children}</>;
}
