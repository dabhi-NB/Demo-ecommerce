import { useParams, Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Edit,
  Package,
  DollarSign,
  Box,
  Tag,
  FileText,
  Image as ImageIcon,
  Calendar,
  Layers,
} from "lucide-react";
import {
  getProductById,
  deleteProduct,
  PRODUCTS_QUERY_KEY,
} from "@/services/product.service";
import { getOrdersByProduct } from "@/services/order.service";
import { formatDateTime } from "@/lib/utils";
import AppConfig from "@/appConfig";
import { ConfirmationDialog } from "../layouts/component/ConfirmationDialog";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { useAuth } from "@/context/AuthContext";
import type { ColDef } from "ag-grid-community";

export default function ProductView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // Check if user has permission to view products
  if (
    !hasPermission("admin/products") &&
    !hasPermission("admin/products/view")
  ) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        You don't have permission to access this page.
      </div>
    );
  }

  const { deleteMutation } = useDeleteEntity(
    deleteProduct,
    PRODUCTS_QUERY_KEY,
    "Product",
  );

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      navigate("/admin/products", { replace: true });
    } catch (error) {
      // Error already handled by the hook
    }
  };

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, id],
    queryFn: () => getProductById(id!),
    enabled: !!id,
  });

  // Fetch orders containing this product
  const { data: productOrders = [] } = useQuery({
    queryKey: ["product-orders", id],
    queryFn: () => getOrdersByProduct(id!, 5),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Failed to load product"}
          </p>
          <Link to="/admin/products">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!product) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <p className="text-yellow-600">Product not found</p>
          <Link to="/admin/products">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Column definitions for orders table
  const orderColumns: ColDef[] = [
    {
      headerName: "Order #",
      field: "orderNumber",
      flex: 1,
      cellRenderer: (params: any) => (
        <Link
          to={`/admin/order/view/${params.data.id}`}
          className="text-blue-600 hover:underline"
        >
          {params.value}
        </Link>
      ),
    },
    {
      headerName: "Customer",
      field: "user",
      flex: 1,
      cellRenderer: (params: any) => params.data.user?.name || "N/A",
    },
    {
      headerName: "Qty",
      field: "items",
      flex: 0.5,
      cellRenderer: (params: any) => {
        const productItem = params.data.items?.find(
          (item: any) => item.product === id || item.product?._id === id,
        );
        return productItem?.quantity || 0;
      },
    },
    {
      headerName: "Total",
      field: "totalAmount",
      flex: 0.8,
      cellRenderer: (params: any) => `₹${params.value?.toFixed(2) || 0}`,
    },
    {
      headerName: "Status",
      field: "status",
      flex: 0.8,
      cellRenderer: (params: any) => (
        <Badge
          variant={
            params.value === "delivered"
              ? "success"
              : params.value === "cancelled" || params.value === "returned"
                ? "destructive"
                : "secondary"
          }
        >
          {params.value}
        </Badge>
      ),
    },
    {
      headerName: "Date",
      field: "createdAt",
      flex: 1,
      cellRenderer: (params: any) => formatDateTime(params.value),
    },
  ];

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Product Details</h1>

        <div className="flex gap-2">
          {hasPermission("admin/products/update") && (
            <Link to={`/admin/products/update/${product.id}`}>
              <Button size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          {hasPermission("admin/products/delete") && (
            <ConfirmationDialog
              title="Delete Product"
              description="Are you sure you want to delete this product?"
              confirmText="Delete"
              cancelText="Cancel"
              onConfirm={handleDelete}
            >
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </ConfirmationDialog>
          )}
          <Link to="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Product Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square rounded-lg border overflow-hidden bg-gray-50">
                {product.images && product.images.length > 0 ? (
                  !imageErrors[selectedImage] ? (
                    <img
                      src={`${AppConfig.API_URL}upload/products/${product.images[selectedImage]}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(selectedImage)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-16 w-16" />
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-16 w-16" />
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {(product.images ?? []).length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {(product.images ?? []).map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 rounded border overflow-hidden ${
                        selectedImage === index
                          ? "ring-2 ring-primary"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {!imageErrors[index] ? (
                        <img
                          src={`${AppConfig.API_URL}upload/products/${img}`}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(index)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Image Count */}
              <p className="text-sm text-muted-foreground text-center">
                {(product.images ?? []).length} image(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Product Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Product Name
                  </label>
                  <p className="text-lg font-semibold mt-1">{product.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    SKU
                  </label>
                  <p className="text-lg font-semibold mt-1">
                    {product.sku || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Slug
                  </label>
                  <p className="text-lg font-semibold mt-1">{product.slug}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Category
                  </label>
                  <p className="text-lg font-semibold mt-1">
                    {product.category?.name || "Uncategorized"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Brand
                  </label>
                  <p className="text-lg font-semibold mt-1">
                    {product.brand || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge variant={product.isActive ? "success" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {product.isFeatured && (
                      <Badge variant="default" className="ml-2">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Stock Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Regular Price
                  </label>
                  <p className="text-2xl font-bold mt-1">
                    ₹{product.price?.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Sale Price
                  </label>
                  <p className="text-2xl font-bold mt-1 text-green-600">
                    ₹{product.salePrice?.toFixed(2) || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Stock
                  </label>
                  <p className="text-2xl font-bold mt-1">
                    {product.stock || 0}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Weight
                  </label>
                  <p className="text-2xl font-bold mt-1">
                    {product.weight ? `${product.weight}g` : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Short Description
                </label>
                <p className="mt-1">{product.shortDescription || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Full Description
                </label>
                <p className="mt-1 whitespace-pre-wrap">
                  {product.description || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(product.tags ?? []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(product.tags ?? []).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No tags</p>
              )}
            </CardContent>
          </Card>

          {/* Specifications Card */}
          {(product.specifications ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(product.specifications ?? []).map(
                    (spec: { key: string; value: string }, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between border-b pb-2"
                      >
                        <span className="font-medium">{spec.key}</span>
                        <span className="text-muted-foreground">
                          {spec.value}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compatible With Card */}
          {(product.compatibleWith ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Compatible With</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(product.compatibleWith ?? []).map(
                    (item: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {item}
                      </Badge>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variants Card */}
          {(product.variants ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Product Variants ({(product.variants ?? []).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Variant Options */}
                {(product.variantOptions ?? []).length > 0 && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-muted-foreground">
                      Variant Options:
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(product.variantOptions ?? []).map(
                        (opt: any, index: number) => (
                          <Badge key={index} variant="outline">
                            {opt.name}: {opt.values.join(", ")}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Variants Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border rounded-lg">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          Variant
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          SKU
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          Price
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          Sale Price
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          Stock
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(product.variants ?? []).map(
                        (variant: any, index: number) => (
                          <tr
                            key={index}
                            className={!variant.isActive ? "opacity-50" : ""}
                          >
                            <td className="px-4 py-2">
                              <div className="flex gap-1 flex-wrap">
                                {(variant.combination ?? []).map(
                                  (c: any, ci: number) => (
                                    <Badge
                                      key={ci}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {c.name}: {c.value}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2">{variant.sku || "—"}</td>
                            <td className="px-4 py-2">
                              ₹
                              {variant.price?.toFixed(2) ||
                                product.price?.toFixed(2)}
                            </td>
                            <td className="px-4 py-2">
                              {variant.salePrice
                                ? `₹${variant.salePrice.toFixed(2)}`
                                : "—"}
                            </td>
                            <td className="px-4 py-2">{variant.stock || 0}</td>
                            <td className="px-4 py-2">
                              <Badge
                                variant={
                                  variant.isActive ? "success" : "secondary"
                                }
                              >
                                {variant.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamps Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created At
                  </label>
                  <p className="mt-1">
                    {product.createdAt
                      ? formatDateTime(product.createdAt)
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Updated At
                  </label>
                  <p className="mt-1">
                    {product.updatedAt
                      ? formatDateTime(product.updatedAt)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            Recent Orders (Last 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productOrders && productOrders.length > 0 ? (
            <DataTable
              rowData={productOrders}
              columnDefs={orderColumns}
              perPage={5}
            />
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No orders found for this product
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
