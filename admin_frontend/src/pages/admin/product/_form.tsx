import { useState, useEffect, forwardRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProduct,
  updateProduct,
  getProductById,
  PRODUCTS_QUERY_KEY,
} from "@/services/product.service";
import { useQueryClient } from "@tanstack/react-query";
import { getCategoriesForSelect } from "@/services/category.service";
import { toast } from "sonner";
import { Loader2, X, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import General from "@/helper/general";
import AppConfig from "@/appConfig";

interface ProductFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: (data?: any) => void;
  onError?: () => void;
  isReadOnly?: boolean;
}

// Specification row type
interface SpecRow {
  key: string;
  value: string;
}

// Variant types
interface VariantOption {
  name: string;
  values: string[];
}

interface VariantCombination {
  _id?: string;
  combination: Array<{ name: string; value: string }>;
  sku: string;
  price: string;
  salePrice: string;
  stock: string;
  isActive: boolean;
}

const ProductForm = forwardRef<any, ProductFormProps>(
  ({ isEdit, id, onSuccess, isReadOnly = false }, _ref) => {
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [existingImages, setExistingImages] = useState<string[]>([]); // Only existing images used for preview

    // Variant state
    const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
    const [variants, setVariants] = useState<VariantCombination[]>([]);
    const [hasVariants, setHasVariants] = useState(false);

    // Fetch categories for select
    const { data: categories = [] } = useQuery({
      queryKey: ["categories", "select"],
      queryFn: getCategoriesForSelect,
    });

    const form = useForm({
      defaultValues: {
        name: "",
        slug: "",
        categoryId: "",
        brand: "",
        sku: "",
        shortDescription: "",
        description: "",
        price: 0,
        salePrice: undefined as number | undefined,
        stock: 0,
        weight: undefined as number | undefined,
        isActive: true,
        isFeatured: false,
        tags: "",
        specifications: [] as SpecRow[],
        compatibleWith: [] as string[],
      },
      mode: "onSubmit",
    });

    const { watch, setValue, control } = form;
    const nameValue = watch("name");

    // Field arrays for dynamic fields
    const {
      fields: specFields,
      append: appendSpec,
      remove: removeSpec,
    } = useFieldArray({
      control,
      name: "specifications",
    });

    const {
      fields: compatibleFields,
      append: appendCompatible,
      remove: removeCompatible,
    } = useFieldArray({
      control,
      name: "compatibleWith",
    } as any);

    // Auto-generate variant combinations
    const generateCombinations = () => {
      if (variantOptions.length === 0) {
        setVariants([]);
        return;
      }

      // Get all combinations using cartesian product
      const cartesian = (...arrays: string[][]): string[][] =>
        arrays.reduce(
          (acc, arr) =>
            acc.flatMap((combo) => arr.map((val) => [...combo, val])),
          [[]] as string[][],
        );

      const optionValues = variantOptions.map((opt) => opt.values);
      if (optionValues.some((v) => v.length === 0)) return;

      const combinations = cartesian(...optionValues);

      setVariants(
        combinations.map((combo) => {
          // Check if this combo already exists (preserve existing data)
          const existing = variants.find((v) =>
            v.combination.every((c, i) => c.value === combo[i]),
          );
          if (existing) return existing;

          return {
            combination: combo.map((val, i) => ({
              name: variantOptions[i].name,
              value: val,
            })),
            sku: "",
            price: "",
            salePrice: "",
            stock: "0",
            isActive: true,
          };
        }),
      );
    };

    // Trigger on variant options change
    useEffect(() => {
      if (hasVariants) {
        generateCombinations();
      }
    }, [variantOptions, hasVariants]);

    // Auto-generate slug from name
    useEffect(() => {
      if (!isEdit && nameValue) {
        const currentSlug = watch("slug");
        if (!currentSlug) {
          const generatedSlug = nameValue
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          setValue("slug", generatedSlug);
        }
      }
    }, [nameValue, isEdit, setValue, watch]);

    useEffect(() => {
      if (isEdit && id) {
        fetchProduct(id);
      }
    }, [id, isEdit]);

    const fetchProduct = async (productId: string) => {
      try {
        setLoading(true);
        const product = await getProductById(productId);

        form.reset({
          name: product.name ?? "",
          slug: product.slug ?? "",
          categoryId: product.category?.id ?? "",
          brand: product.brand ?? "",
          sku: product.sku ?? "",
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          price: product.price ?? 0,
          salePrice: product.salePrice ?? undefined,
          stock: product.stock ?? 0,
          weight: product.weight ?? undefined,
          isActive: product.isActive ?? true,
          isFeatured: product.isFeatured ?? false,
          tags: product.tags?.join(", ") ?? "",
          specifications: product.specifications ?? [],
          compatibleWith: (product.compatibleWith ?? []) as any,
        });

        if (product.images && product.images.length > 0) {
          setExistingImages(product.images);
        }

        // Load variant data if exists
        if (product.variantOptions && product.variantOptions.length > 0) {
          setVariantOptions(product.variantOptions);
          setHasVariants(true);
        }
        if (product.variants && product.variants.length > 0) {
          setVariants(
            product.variants.map((v: any) => ({
              _id: v._id,
              combination: v.combination,
              sku: v.sku || "",
              price: v.price?.toString() || "",
              salePrice: v.salePrice?.toString() || "",
              stock: v.stock?.toString() || "0",
              isActive: v.isActive ?? true,
            })),
          );
        }
      } catch (error: any) {
        console.error("Error fetching product:", error.message);
        toast.error(error.message || "Failed to load product data");
      } finally {
        setLoading(false);
      }
    };







    const onSubmit = async (values: any) => {
      try {
        setSubmitting(true);
        console.log("Category ID:", values.categoryId);

        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("slug", values.slug);
        formData.append("category", values.categoryId || "");
        formData.append("brand", values.brand || "");
        formData.append("sku", values.sku || "");
        formData.append("shortDescription", values.shortDescription || "");
        formData.append("description", values.description || "");
        formData.append("price", String(values.price || 0));
        if (values.salePrice) {
          formData.append("salePrice", String(values.salePrice));
        }
        formData.append("stock", String(values.stock || 0));
        if (values.weight) {
          formData.append("weight", String(values.weight));
        }
        formData.append("isActive", values.isActive ? "true" : "false");
        formData.append("isFeatured", values.isFeatured ? "true" : "false");

        // Tags as comma-separated
        if (values.tags) {
          const tagsArray = values.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean);
          formData.append("tags", JSON.stringify(tagsArray));
        }

        // Specifications
        if (values.specifications && values.specifications.length > 0) {
          formData.append(
            "specifications",
            JSON.stringify(values.specifications),
          );
        }

        // Compatible With
        if (values.compatibleWith && values.compatibleWith.length > 0) {
          formData.append(
            "compatibleWith",
            JSON.stringify(values.compatibleWith),
          );
        }

        // Variants
        formData.append("hasVariants", String(hasVariants));
        formData.append(
          "variantOptions",
          JSON.stringify(hasVariants ? variantOptions : []),
        );
        formData.append(
          "variants",
          JSON.stringify(
            hasVariants
              ? variants.map((v) => ({
                  ...v,
                  price: v.price ? parseFloat(v.price) : null,
                  salePrice: v.salePrice ? parseFloat(v.salePrice) : null,
                  stock: parseInt(v.stock) || 0,
                }))
              : [],
          ),
        );

        // Image handling moved to dedicated images page

        let response;
        if (isEdit && id) {
          response = await updateProduct(id, formData);
        } else {
          response = await createProduct(formData);
        }

        const queryClient = useQueryClient();
        queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY, id] });
        if (response?.status === 1) {
          toast.success(
            response.message ||
              `Product ${isEdit ? "updated" : "created"} successfully`,
          );
          onSuccess(isEdit ? id : response.data);
        } else {
          toast.error(
            response.message ||
              `Failed to ${isEdit ? "update" : "create"} product`,
          );
        }
      } catch (error: any) {
        console.error(
          `Error ${isEdit ? "updating" : "creating"} product:`,
          error,
        );
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isEdit ? "update" : "create"} product`;
        toast.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    };

    if (loading) {
      return <div className="text-center py-10">Loading...</div>;
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* SECTION 1: Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Name is required" }}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Product name" {...field} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  rules={{ required: "Slug is required" }}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Slug <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="product-slug" {...field} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat: any) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input placeholder="Brand name" {...field} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU" {...field} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="shortDescription"
                render={({ field }) => {
                  const charCount = (field.value || "").length;
                  return (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief product description (max 200 characters)"
                          {...field}
                          value={field.value || ""}
                          maxLength={200}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground text-right">
                        {charCount}/200
                      </p>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Full Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed product description"
                        {...field}
                        value={field.value || ""}
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* SECTION 3: Pricing & Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  rules={{ required: "Price is required", min: 0 }}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Price <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Sale Price</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </FormControl>
                        {field.value !== undefined && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => field.onChange(undefined)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          min={0}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Weight (g)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Images - Separate Page Link */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>
                Manage images on the{" "}
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/admin/products/images/${id}`}>
                    dedicated Images page
                  </Link>
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {existingImages.slice(0, 5).map((imgUrl: string) => (
                  <div key={imgUrl} className="relative">
                    <img
                      src={General.getProductImageUrl(imgUrl)}
                      alt="Product preview"
                      className="w-full h-24 object-cover rounded border"
                      onError={(e) => {
                        console.error("Image load failed:", imgUrl);
                        (e.target as HTMLImageElement).src =
                          AppConfig.DEFAULT_IMAGE;
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5: Flags */}
          <Card>
            <CardHeader>
              <CardTitle>Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enable or disable this product
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Featured</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Show in featured products
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="tag1, tag2, tag3" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Comma-separated
                      </p>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 6: Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>
                Add product specifications as key-value pairs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {specFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`specifications.${index}.key`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Key (e.g. Material)"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`specifications.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Value (e.g. Plastic)"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSpec(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendSpec({ key: "", value: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Spec
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 7: Compatible With */}
          <Card>
            <CardHeader>
              <CardTitle>Compatible With</CardTitle>
              <CardDescription>Add compatible device models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {compatibleFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`compatibleWith.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="e.g. iPhone 15, Samsung S24"
                              value={field.value as string}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeCompatible(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendCompatible("")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 8: Product Variants */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Product Variants</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={hasVariants}
                    onCheckedChange={(v) => {
                      setHasVariants(v);
                      if (!v) {
                        setVariantOptions([]);
                        setVariants([]);
                      }
                    }}
                  />
                  <label className="text-sm">This product has variants</label>
                </div>
              </div>
            </CardHeader>

            {hasVariants && (
              <CardContent className="space-y-5">
                {/* Step 1: Define option types */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-sm">
                      Step 1: Define Variant Options
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setVariantOptions((p) => [
                          ...p,
                          { name: "", values: [] },
                        ])
                      }
                    >
                      + Add Option
                    </Button>
                  </div>

                  {variantOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      Add options like Color, Size, Storage to create variants
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {variantOptions.map((opt, idx) => (
                        <div
                          key={idx}
                          className="border border-border rounded-xl p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Input
                              value={opt.name}
                              onChange={(e) => {
                                const updated = [...variantOptions];
                                updated[idx].name = e.target.value;
                                setVariantOptions(updated);
                              }}
                              placeholder="Option name (e.g. Color, Size, Storage)"
                              className="max-w-xs"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setVariantOptions((v) =>
                                  v.filter((_, i) => i !== idx),
                                )
                              }
                            >
                              <Trash2 size={15} className="text-destructive" />
                            </Button>
                          </div>

                          {/* Values for this option */}
                          <div className="flex flex-wrap gap-2 items-center">
                            {opt.values.map((val, vi) => (
                              <div
                                key={vi}
                                className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full text-sm"
                              >
                                {val}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...variantOptions];
                                    updated[idx].values = updated[
                                      idx
                                    ].values.filter((_, i) => i !== vi);
                                    setVariantOptions(updated);
                                  }}
                                  className="ml-1 hover:text-destructive"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <Input
                              placeholder="Type value, press Enter"
                              className="w-40 h-8 text-sm"
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  e.currentTarget.value.trim()
                                ) {
                                  e.preventDefault();
                                  const val = e.currentTarget.value.trim();
                                  if (!opt.values.includes(val)) {
                                    const updated = [...variantOptions];
                                    updated[idx].values.push(val);
                                    setVariantOptions(updated);
                                  }
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                          </div>

                          {/* Color preset (only for Color option) */}
                          {opt.name.toLowerCase() === "color" && (
                            <div className="mt-2 flex gap-1.5 flex-wrap">
                              {[
                                "Black",
                                "White",
                                "Red",
                                "Blue",
                                "Green",
                                "Gold",
                                "Silver",
                                "Purple",
                                "Pink",
                                "Orange",
                                "Grey",
                              ].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    if (!opt.values.includes(c)) {
                                      const updated = [...variantOptions];
                                      updated[idx].values.push(c);
                                      setVariantOptions(updated);
                                    }
                                  }}
                                  className="text-[10px] px-2 py-0.5 rounded border border-border hover:border-primary transition-all"
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 2: Variant combinations table */}
                {variants.length > 0 && (
                  <div>
                    <p className="font-semibold text-sm mb-3">
                      Step 2: Set Price & Stock for Each Variant (
                      {variants.length} combinations)
                    </p>
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                                Variant
                              </th>
                              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                                SKU
                              </th>
                              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                                Price (₹)
                                <br />
                                <span className="font-normal text-xs">
                                  blank = base price
                                </span>
                              </th>
                              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                                Sale (₹)
                              </th>
                              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                                Stock
                              </th>
                              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                                Active
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {variants.map((variant, vi) => (
                              <tr
                                key={vi}
                                className={
                                  !variant.isActive ? "opacity-40" : ""
                                }
                              >
                                <td className="px-4 py-3">
                                  <div className="flex gap-1 flex-wrap">
                                    {variant.combination.map((c, ci) => (
                                      <Badge
                                        key={ci}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {c.name}:{" "}
                                        <span className="font-bold ml-1">
                                          {c.value}
                                        </span>
                                      </Badge>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Input
                                    value={variant.sku}
                                    onChange={(e) => {
                                      const u = [...variants];
                                      u[vi].sku = e.target.value;
                                      setVariants(u);
                                    }}
                                    placeholder="Optional"
                                    className="w-28 h-8 text-xs"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <Input
                                    type="number"
                                    value={variant.price}
                                    onChange={(e) => {
                                      const u = [...variants];
                                      u[vi].price = e.target.value;
                                      setVariants(u);
                                    }}
                                    placeholder="Base"
                                    className="w-24 h-8 text-xs"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <Input
                                    type="number"
                                    value={variant.salePrice}
                                    onChange={(e) => {
                                      const u = [...variants];
                                      u[vi].salePrice = e.target.value;
                                      setVariants(u);
                                    }}
                                    placeholder="—"
                                    className="w-24 h-8 text-xs"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <Input
                                    type="number"
                                    value={variant.stock}
                                    onChange={(e) => {
                                      const u = [...variants];
                                      u[vi].stock = e.target.value;
                                      setVariants(u);
                                    }}
                                    className="w-20 h-8 text-xs"
                                    min="0"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <Switch
                                    checked={variant.isActive}
                                    onCheckedChange={(v) => {
                                      const u = [...variants];
                                      u[vi].isActive = v;
                                      setVariants(u);
                                    }}
                                    className="scale-75"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            {!isReadOnly && (
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? "Updating..." : "Creating..."}
                  </>
                ) : isEdit ? (
                  "Update Product"
                ) : (
                  "Create Product"
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    );
  },
);

ProductForm.displayName = "ProductForm";

export default ProductForm;
