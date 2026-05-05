"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

/**
 * SectionHeader component for section titles with optional view all link
 * Matches dark theme styling
 */
export function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View All",
}: SectionHeaderProps) {
  return (
    <div className="border-b border-border pb-3 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm text-primary flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            {viewAllLabel}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default SectionHeader;
