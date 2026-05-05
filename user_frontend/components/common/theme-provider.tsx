"use client";

import { useTheme } from "@/hooks/useTheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return <>{children}</>;
}
