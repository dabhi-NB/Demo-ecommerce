"use client";

import Image from "next/image";
import { resolveImageUrl } from "@/lib/utils";
import Link from "next/link";
import type { Category } from "@/services/product.service";

interface CategoryCardProps {
  category: Category;
}

/**
 * CategoryCard component for displaying category in grid
 * Clean pill/card style with hover effects
 */
export function CategoryCard({ category }: CategoryCardProps) {
  const { name, slug, image } = category;

  return (
    <Link
      href={`/shop/category/${slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary hover:shadow-md"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={resolveImageUrl(image ?? '', 'category')}
          alt={name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 500ms'
          }}
          className="group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Category Name at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-sm font-semibold text-white">{name}</h3>
      </div>
    </Link>
  );
}

export default CategoryCard;
