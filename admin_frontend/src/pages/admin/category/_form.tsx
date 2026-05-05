import { useState, useEffect, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createCategory, updateCategory, getCategoryById } from "@/services/category.service";
import { toast } from "sonner";
import { Loader2, ImageIcon } from "lucide-react";
import General from "@/helper/general";

interface CategoryFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: (data?: any) => void;
  onError?: () => void;
}

const CategoryForm = forwardRef<any, CategoryFormProps>(
  ({ isEdit, id, onSuccess }, _ref) => {
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    const form = useForm({
      defaultValues: {
        name: "",
        slug: "",
        description: "",
        image: null as File | null,
        sortOrder: 0,
        isActive: true,
      },
      mode: "onSubmit",
    });

    const { watch, setValue } = form;
    const nameValue = watch("name");

    // Auto-generate slug from name
    useEffect(() => {
      if (!isEdit && nameValue) {
        const currentSlug = watch("slug");
        const generatedSlug = nameValue
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        
        if (!currentSlug || currentSlug === "") {
          setValue("slug", generatedSlug);
        }
      }
    }, [nameValue, isEdit, setValue, watch]);

    useEffect(() => {
      if (isEdit && id) {
        fetchCategory(id);
      }
    }, [id, isEdit]);

    const fetchCategory = async (categoryId: string) => {
      try {
        setLoading(true);
        const category = await getCategoryById(categoryId);

        form.reset({
          name: category.name ?? "",
          slug: category.slug ?? "",
          description: category.description ?? "",
          image: null,
          sortOrder: category.sortOrder ?? 0,
          isActive: category.isActive ?? true,
        });

        if (category.image) {
          // Use the helper function to get the full image URL
          setExistingImage(General.getCategoryImageUrl(category.image));
        }
      } catch (error: any) {
        console.error("Error fetching category:", error.message);
        toast.error(error.message || "Failed to load category data");
      } finally {
        setLoading(false);
      }
    };

    const onSubmit = async (values: any) => {
      try {
        setSubmitting(true);

        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("slug", values.slug);
        formData.append("description", values.description || "");
        
        // Use both field name formats to be compatible
        const sortOrderValue = values.sortOrder || 0;
        formData.append("sortOrder", String(sortOrderValue));
        formData.append("order", String(sortOrderValue));
        
        const isActiveValue = values.isActive === true;
        formData.append("isActive", isActiveValue ? "true" : "false");
        formData.append("status", isActiveValue ? "1" : "0");

        if (values.image) {
          formData.append("image", values.image);
        }

        let response;
        if (isEdit && id) {
          response = await updateCategory(id, formData);
        } else {
          response = await createCategory(formData);
        }

        if (response?.status === 1) {
          toast.success(
            response.message ||
              `Category ${isEdit ? "updated" : "created"} successfully`,
          );
          onSuccess(isEdit ? id : response.data);
        } else {
          toast.error(
            response.message ||
              `Failed to ${isEdit ? "update" : "create"} category`,
          );
        }
      } catch (error: any) {
        console.error(`Error ${isEdit ? "updating" : "creating"} category:`, error);
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isEdit ? "update" : "create"} category`;
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input
                      placeholder="Category name"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                      }}
                    />
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
                    <Input
                      placeholder="category-slug"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Category description"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>

                {/* Image Preview */}
                <div className="mb-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded border"
                    />
                  ) : existingImage ? (
                    <img
                      src={existingImage}
                      alt="Current Image"
                      className="w-24 h-24 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-muted rounded border flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange(file);
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setImagePreview(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable this category
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === true}
                      onCheckedChange={(checked) => field.onChange(checked)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update Category"
              ) : (
                "Create Category"
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  },
);

CategoryForm.displayName = "CategoryForm";

export default CategoryForm;
