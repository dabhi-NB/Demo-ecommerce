import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, X, Upload } from "lucide-react";
import General from "@/helper/general";
import {
  getProductById,
  updateProductImages,
  PRODUCTS_QUERY_KEY,
} from "@/services/product.service";
import { toast } from "sonner";
import AppConfig from "@/appConfig";

export default function ProductImageUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [displayImages, setDisplayImages] = useState<string[]>([]);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id! as string),
    enabled: !!id,
  });

  // Initialize displayImages with product images
  useEffect(() => {
    if (product?.images) {
      setDisplayImages(product.images);
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => updateProductImages(id!, formData),
    onSuccess: (response) => {
      if (response.status === 1) {
        toast.success("Images updated successfully");

        queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY, id] });
        queryClient.invalidateQueries({ queryKey: ["product", id] }); // Keep both for safety
        setNewImages([]);
        setImagePreviews([]);
        setRemovedImages([]);
        setDisplayImages([]);
        navigate(`/admin/products/view/${id}`);
      } else {
        toast.error(response.message || "Update failed");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Update failed");
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentTotal = displayImages.length + newImages.length;
    if (currentTotal + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const newPreviews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newPreviews.push(event.target?.result as string);
        if (newPreviews.length === files.length) {
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setNewImages([...newImages, ...files]);
  };

  const removeExistingImage = (imagePath: string) => {
    setRemovedImages((prev) => [...prev, imagePath]);
    setDisplayImages((prev) => prev.filter((img) => img !== imagePath));
  };

  const removeNewImage = (index: number) => {
    const newIndex = index - displayImages.length;
    setNewImages(newImages.filter((_, i) => i !== newIndex));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();

    // Send category ID and product slug for proper folder structure
    formData.append("category", product!.category?.id || "");
    formData.append("slug", product!.slug || "unknown-product");

    if (removedImages.length > 0) {
      formData.append("removeImages", JSON.stringify(removedImages));
    }

    newImages.forEach((file) => {
      formData.append("images", file);
    });

    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-10">Product not found</div>;
  }

  const allImages = [...displayImages, ...imagePreviews];

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Update Product Images</h1>
          <p className="text-muted-foreground">Product: {product.name}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Images ({allImages.length}/5)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Current Images */}
            <div>
              <h3 className="font-semibold mb-4">Current Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {displayImages.map((imgPath: string, index: number) => (
                  <div key={imgPath} className="relative group">
                    <img
                      src={General.getProductImageUrl(imgPath)}
                      alt={`Current ${index + 1}`}
                      className="w-full h-32 object-cover rounded border"
                      onError={(e) => {
                        console.error("Image load failed:", imgPath);
                        (e.target as HTMLImageElement).src =
                          AppConfig.DEFAULT_IMAGE;
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => removeExistingImage(imgPath)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* New Images Preview */}
            <div>
              <h3 className="font-semibold mb-4">New Images Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => {
                  const globalIndex = (product.images?.length || 0) + index;
                  return (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`New ${index + 1}`}
                        className="w-full h-32 object-cover rounded border"
                        onError={(e) => {
                          console.error("New image preview failed:", preview);
                          (e.target as HTMLImageElement).src =
                            AppConfig.DEFAULT_IMAGE;
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => removeNewImage(globalIndex)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upload Input */}
            {displayImages.length + newImages.length < 5 && (
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary transition-colors">
                <Input
                  id="product-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="product-images"
                  className="cursor-pointer block"
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Add Images</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 5MB (Max 5 total images)
                  </p>
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Images"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
