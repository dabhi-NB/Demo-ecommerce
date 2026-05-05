"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CategoryCard } from "@/components/layout/shop-layout/CategoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories, type Category } from "@/services/product.service";

export default function CategoryPage() {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const data = await getCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Breadcrumb */}
        <div className="text-xs text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span>Categories</span>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold mb-2">All Categories</h1>
        <p className="text-muted-foreground mb-8">
          Find accessories by category
        </p>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        )}

        {/* Categories Grid */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat._id} category={cat} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No categories found</p>
          </div>
        )}
      </div>
    </div>
  );
}
