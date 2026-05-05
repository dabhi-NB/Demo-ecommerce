import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/DataTable";
import { Plus, Edit, Trash2, Eye, Star } from "lucide-react";
import { useMemo, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import {
  getProducts,
  deleteProduct,
  PRODUCTS_QUERY_KEY,
  type Product,
  updateProductStock,
} from "@/services/product.service";
import { getCategoriesForSelect } from "@/services/category.service";
import { ConfirmationDialog } from "../layouts/component/ConfirmationDialog";
import { formatDateTime } from "@/lib/utils";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { BulkStockDialog } from "./components/BulkStockDialog";
import General from "@/helper/general";

// Product Image Component
function ProductImage({ images }: { images: string[] }) {
  const firstImage = images && images.length > 0 ? images[0] : null;

  if (firstImage) {
    return (
      <img
        src={General.getProductImageUrl(firstImage)}
        alt="Product"
        className="w-12 h-12 object-contain rounded border"
      />
    );
  }

  return (
    <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
      <span className="text-xs text-muted-foreground">No img</span>
    </div>
  );
}

// Product Name + SKU Component
function ProductNameCell({ name, sku }: { name: string; sku?: string }) {
  return (
    <div>
      <div className="font-medium">{name}</div>
      {sku && <div className="text-xs text-muted-foreground">{sku}</div>}
    </div>
  );
}

// Price Component
function PriceCell({
  price,
  originalPrice,
}: {
  price: number;
  originalPrice?: number;
}) {
  if (originalPrice && originalPrice > price) {
    return (
      <div>
        <span className="font-bold">₹{price}</span>
        <span className="text-xs text-muted-foreground line-through ml-2">
          ₹{originalPrice}
        </span>
      </div>
    );
  }
  return <span className="font-bold">₹{price}</span>;
}

// Stock Badge Component
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge variant="destructive">Out of Stock</Badge>;
  }
  if (stock <= 5) {
    return (
      <Badge
        variant="secondary"
        className="bg-orange-100 text-orange-700 hover:bg-orange-100"
      >
        Low: {stock}
      </Badge>
    );
  }
  return <span className="text-green-600 font-medium">{stock}</span>;
}

// Inline Stock Edit Component
function InlineStockEdit({
  stock,
  onSave,
  canEdit,
}: {
  stock: number;
  onSave: (newStock: number) => void;
  canEdit: boolean;
}) {
  const [value, setValue] = useState(stock);
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== stock) {
      onSave(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
    if (e.key === "Escape") {
      setValue(stock);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value) || 0)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-20 h-8"
        autoFocus
      />
    );
  }

  return (
    <span
      className={canEdit ? "cursor-pointer hover:text-blue-600" : ""}
      onClick={canEdit ? () => setIsEditing(true) : undefined}
    >
      <StockBadge stock={stock} />
    </span>
  );
}

// Status Badge Component
function ProductStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "destructive"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

// Featured Toggle Component
function FeaturedToggle({
  isFeatured,
  productId,
}: {
  isFeatured?: boolean;
  productId: string;
}) {
  const queryClient = useQueryClient();
  const [loading] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/admin/products/view/${productId}/featured`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        },
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      toast.success("Featured status updated");
    },
    onError: () => {
      toast.error("Failed to update featured status");
    },
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => toggleMutation.mutate()}
      disabled={loading}
    >
      <Star
        className={`h-4 w-4 ${isFeatured ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
      />
    </Button>
  );
}

// Category Badge Component
function CategoryBadge({ category }: { category?: { name: string } }) {
  if (category?.name) {
    return <Badge>{category.name}</Badge>;
  }
  return <span className="text-muted-foreground">-</span>;
}

export default function Products() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { deleteItem: handleDelete } = useDeleteEntity(
    deleteProduct,
    PRODUCTS_QUERY_KEY,
    "Product",
  );

  // Filter states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkStock, setShowBulkStock] = useState(false);

  // Fetch categories for filter dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "select"],
    queryFn: getCategoriesForSelect,
  });

  // Build query params - fetch ALL records from DB (no limit)
  const queryParams: any = {};

  if (search) queryParams.search = search;
  if (categoryFilter !== "all") queryParams.categoryId = categoryFilter;
  if (statusFilter !== "all") queryParams.isActive = statusFilter === "active";
  if (featuredFilter !== "all")
    queryParams.isFeatured = featuredFilter === "featured";

  const {
    data: productsData = { products: [], total: 0 },
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, queryParams],
    queryFn: () => getProducts(queryParams),
  });

  const products = productsData.products || [];

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/admin/products/update/${id}`);
    },
    [navigate],
  );

  const handleView = useCallback(
    (id: string) => {
      navigate(`/admin/products/view/${id}`);
    },
    [navigate],
  );

  const handleStockSave = useCallback(
    async (id: string, newStock: number) => {
      try {
        await updateProductStock(id, newStock);
        queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
        toast.success("Stock updated successfully");
      } catch (error) {
        toast.error("Failed to update stock");
      }
    },
    [queryClient],
  );

  const errorMessage = isError
    ? (error as any)?.message || "Failed to fetch products"
    : null;

  const columnDefs: ColDef<Product>[] = useMemo(() => {
    const baseColumns: ColDef<Product>[] = [
      // Checkbox column for bulk selection
      {
        headerName: "",
        width: 50,
        filter: false,
        sortable: false,
        headerCheckboxSelection: false,
        checkboxSelection: true,
        cellRenderer: (params: any) => (
          <Checkbox
            checked={selectedIds.has(params.data.id)}
            onCheckedChange={(checked) => {
              const s = new Set(selectedIds);
              if (checked) s.add(params.data.id);
              else s.delete(params.data.id);
              setSelectedIds(s);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },
      {
        headerName: "#",
        width: 60,
        valueGetter: (params: any) => {
          return params.node?.rowIndex != null ? params.node.rowIndex + 1 : "";
        },
        sortable: false,
        filter: false,
      },
      {
        headerName: "Image",
        width: 80,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => (
          <ProductImage images={params.data.images || []} />
        ),
      },
      {
        headerName: "Name / SKU",
        field: "name",

        sortable: true,
        cellRenderer: (params: any) => (
          <ProductNameCell name={params.data.name} sku={params.data.sku} />
        ),
      },
      {
        headerName: "Category",
        field: "category",
        width: 120,
        filter: false,
        sortable: true,
        cellRenderer: (params: any) => (
          <CategoryBadge category={params.data.category} />
        ),
      },
      {
        headerName: "Price",
        field: "price",
        width: 100,
        filter: "agNumberColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => (
          <PriceCell
            price={params.data.price}
            originalPrice={params.data.originalPrice}
          />
        ),
      },
      {
        headerName: "Stock",
        width: 100,
        filter: "agNumberColumnFilter",
        sortable: true,
        valueGetter: (params: any) => {
          return params.data.hasVariants
            ? params.data.totalStock || 0
            : params.data.stock || 0;
        },
        cellRenderer: (params: any) => (
          <InlineStockEdit
            stock={
              params.data.hasVariants
                ? params.data.totalStock || 0
                : params.data.stock || 0
            }
            onSave={(newStock) => handleStockSave(params.data.id, newStock)}
            canEdit={hasPermission("admin/products/update")}
          />
        ),
      },
      {
        headerName: "Status",
        field: "isActive",
        width: 100,
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => (
          <ProductStatusBadge isActive={params.data.isActive} />
        ),
      },
      {
        headerName: "Featured",
        field: "isFeatured",
        width: 80,
        filter: false,
        sortable: true,
        cellRenderer: (params: any) =>
          hasPermission("admin/products/update") ? (
            <FeaturedToggle
              isFeatured={params.data.isFeatured}
              productId={params.data.id}
            />
          ) : params.data.isFeatured ? (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ) : (
            <Star className="h-4 w-4 text-muted-foreground" />
          ),
      },
      {
        headerName: "Created",
        field: "createdAt",
        width: 120,
        filter: "agDateColumnFilter",
        sortable: true,
        valueFormatter: (params: any) => formatDateTime(params.value),
      },
    ];

    // Only add Actions column if user has at least one action permission
    const hasAnyActionPermission =
      hasPermission("admin/products") ||
      hasPermission("admin/products/update") ||
      hasPermission("admin/products/delete");

    if (hasAnyActionPermission) {
      baseColumns.push({
        headerName: "Actions",
        width: 150,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2 h-full">
            {hasPermission("admin/products") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleView(params.data.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {hasPermission("admin/products/update") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(params.data.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {hasPermission("admin/products/delete") && (
              <ConfirmationDialog
                title="Delete Product"
                description="Are you sure you want to delete this product?"
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={() => handleDelete(params.data.id)}
              >
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </ConfirmationDialog>
            )}
          </div>
        ),
      });
    }

    return baseColumns;
  }, [handleDelete, handleEdit, handleView, hasPermission, handleStockSave]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        {hasPermission("admin/products/create") && (
          <Button asChild>
            <Link to="/admin/products/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="not-featured">Not Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl mb-3">
              <span className="text-sm font-semibold">
                {selectedIds.size} selected
              </span>
              <div className="flex gap-2 ml-auto">
                {hasPermission("admin/products/update") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkStock(true)}
                  >
                    Update Stock
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-10 text-muted-foreground">
              Loading...
            </div>
          )}
          {errorMessage && (
            <div className="text-center py-10 text-destructive">
              {errorMessage}
            </div>
          )}
          {!isLoading && !errorMessage && (
            <DataTable
              rowData={products}
              columnDefs={columnDefs}
              paginationPageSizeSelector={[10, 20, 50, 100, 500]}
            />
          )}
        </CardContent>
      </Card>

      {/* Bulk Stock Dialog */}
      {showBulkStock && (
        <BulkStockDialog
          selectedProducts={products.filter((p: any) => selectedIds.has(p.id))}
          onClose={() => setShowBulkStock(false)}
          onSuccess={() => {
            setShowBulkStock(false);
            setSelectedIds(new Set());
          }}
        />
      )}
    </>
  );
}
