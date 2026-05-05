"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FilterSidebarProps {
  categories: { id: string; name: string; slug: string }[];
  brands: string[];
  selectedCategory?: string;
  selectedBrand?: string;
  priceRange: [number, number];
  maxPrice?: number;
  onCategoryChange: (slug: string) => void;
  onBrandChange: (brand: string) => void;
  onPriceChange: (range: [number, number]) => void;
  onReset: () => void;
  isMobile?: boolean;
  compatibleWith?: string[];
  onCompatibleChange?: (val: string) => void;
}

// Compatible phone options for accessories
const compatibleOptions = [
  { value: "iphone-15", label: "iPhone 15 Series" },
  { value: "iphone-14", label: "iPhone 14 Series" },
  { value: "samsung-s24", label: "Samsung Galaxy S24" },
  { value: "samsung-s23", label: "Samsung Galaxy S23" },
  { value: "redmi-poco", label: "Redmi / POCO" },
  { value: "realme", label: "Realme" },
  { value: "oneplus", label: "OnePlus" },
  { value: "universal", label: "All Phones (Universal)" },
];

// Quick price presets
const pricePresets = [
  { label: "Under ₹299", min: 0, max: 299 },
  { label: "₹300-₹999", min: 300, max: 999 },
  { label: "₹1000-₹2000", min: 1000, max: 2000 },
  { label: "Above ₹2000", min: 2000, max: 10000 },
];

/**
 * FilterSidebar component for product filtering
 * Optimized for accessories e-commerce website
 */
export function FilterSidebar({
  categories,
  brands,
  selectedCategory,
  selectedBrand,
  priceRange,
  maxPrice = 3000,
  onCategoryChange,
  onBrandChange,
  onPriceChange,
  onReset,
  isMobile = false,
  compatibleWith = [],
  onCompatibleChange,
}: FilterSidebarProps) {
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [localPriceRange, setLocalPriceRange] =
    useState<[number, number]>(priceRange);
  const [localSelectedBrand, setLocalSelectedBrand] = useState<
    string | undefined
  >(selectedBrand);
  const [localCompatibleWith, setLocalCompatibleWith] =
    useState<string[]>(compatibleWith);

  const displayedBrands = showAllBrands ? brands : brands.slice(0, 6);

  const handlePriceApply = () => {
    onPriceChange(localPriceRange);
  };

  const handleCategoryClick = (slug: string) => {
    onCategoryChange(slug === selectedCategory ? "" : slug);
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newBrand = checked ? brand : "";
    setLocalSelectedBrand(newBrand);
    onBrandChange(newBrand);
  };

  const handleCompatibleChange = (value: string, checked: boolean) => {
    if (checked) {
      const newCompatible = [...localCompatibleWith, value];
      setLocalCompatibleWith(newCompatible);
      onCompatibleChange?.(value);
    } else {
      const newCompatible = localCompatibleWith.filter(
        (item: string) => item !== value,
      );
      setLocalCompatibleWith(newCompatible);
    }
  };

  const handlePricePreset = (min: number, max: number) => {
    const presetRange: [number, number] = [min, max];
    setLocalPriceRange(presetRange);
    onPriceChange(presetRange);
  };

  return (
    <div
      className={`bg-card border border-border rounded-xl p-4 ${
        isMobile ? "" : "sticky top-4"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Filters</h3>
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Reset
        </button>
      </div>

      {/* Categories Section - First */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Categories</h4>
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className={`flex items-center justify-between w-full px-2 py-1.5 rounded text-sm transition-colors ${
                selectedCategory === category.slug
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Compatible With Section - Second (NEW) */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Compatible With</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {compatibleOptions.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={`compatible-${option.value}`}
                checked={localCompatibleWith.includes(option.value)}
                onCheckedChange={(checked: boolean) =>
                  handleCompatibleChange(option.value, checked)
                }
              />
              <label
                htmlFor={`compatible-${option.value}`}
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Brand Section - Third */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Brand</h4>
        <div className="space-y-2">
          {displayedBrands.map((brand) => (
            <div key={brand} className="flex items-center gap-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={localSelectedBrand === brand}
                onCheckedChange={(checked: boolean) =>
                  handleBrandChange(brand, checked)
                }
              />
              <label
                htmlFor={`brand-${brand}`}
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {brand}
              </label>
            </div>
          ))}
          {brands.length > 6 && (
            <button
              onClick={() => setShowAllBrands(!showAllBrands)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {showAllBrands ? (
                <>
                  <ChevronUp className="h-3 w-3" /> Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" /> Show more (
                  {brands.length - 6})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Price Range Section - Last */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Price Range</h4>

        {/* Quick Price Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {pricePresets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => handlePricePreset(preset.min, preset.max)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Manual Price Inputs */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              ₹
            </span>
            <Input
              type="number"
              value={localPriceRange[0]}
              onChange={(e) =>
                setLocalPriceRange([Number(e.target.value), localPriceRange[1]])
              }
              placeholder="Min"
              className="pl-7"
              min={0}
              max={maxPrice}
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              ₹
            </span>
            <Input
              type="number"
              value={localPriceRange[1]}
              onChange={(e) =>
                setLocalPriceRange([localPriceRange[0], Number(e.target.value)])
              }
              placeholder="Max"
              className="pl-7"
              min={0}
              max={maxPrice}
            />
          </div>
        </div>
        <Button size="sm" className="w-full mt-2" onClick={handlePriceApply}>
          Apply
        </Button>
      </div>
    </div>
  );
}

export default FilterSidebar;
