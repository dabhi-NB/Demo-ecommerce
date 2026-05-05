import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Plus, Edit, Trash2, ImageIcon, Eye } from "lucide-react";
import { useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import type { ColDef } from "ag-grid-community";
import {
  getCategoriesPaginated,
  deleteCategory,
  type Category,
} from "@/services/category.service";
import { ConfirmationDialog } from "../layouts/component/ConfirmationDialog";
import { formatDateTime } from "@/lib/utils";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { useAuth } from "@/context/AuthContext";
import General from "@/helper/general";

export const CATEGORIES_QUERY_KEY = ["categories"];

function CategoryStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "destructive"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

function CategoryImage({ image, name }: { image?: string; name: string }) {
  if (image) {
    return (
      <img src={General.getCategoryImageUrl(image)} alt={name} className="w-10 h-10 object-cover rounded" />
    );
  }
  return (
    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
      <ImageIcon className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

export default function Categories() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { deleteItem: handleDelete } = useDeleteEntity(
    deleteCategory,
    ['categories'],
    "Category",
  );

const {
    data: categories,
    isLoading,
    isError,
    error,
  } = usePaginatedData(getCategoriesPaginated, ['categories'], 10);

  const handleEdit = useCallback(
    (id: string) => navigate(`/admin/categories/update/${id}`),
    [navigate],
  );

  const handleView = useCallback(
    (id: string) => navigate(`/admin/categories/view/${id}`),
    [navigate],
  );

  const errorMessage = isError
    ? (error as any)?.message || "Failed to fetch categories"
    : null;

  const columnDefs: ColDef<Category>[] = useMemo(() => {
    const baseColumns: ColDef<Category>[] = [
      {
        headerName: "#",
        width: 70,
        valueGetter: (params: any) =>
          params.node?.rowIndex != null ? params.node.rowIndex + 1 : "",
        sortable: false,
        filter: false,
      },
      {
        headerName: "Image",
        width: 80,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => (
          <CategoryImage image={params.data.image} name={params.data.name} />
        ),
      },
      {
        headerName: "Name",
        field: "name",
      },
      {
        headerName: "Slug",
        field: "slug",
      },
      {
        headerName: "Sort Order",
        field: "sortOrder",
        width: 100,
        filter: "agNumberColumnFilter",
        sortable: true,
      },
      {
        headerName: "Created At",
        field: "createdAt",
        width: 150,
        filter: "agDateColumnFilter",
        sortable: true,
        valueFormatter: (params: any) => formatDateTime(params.value),
      },
      {
        headerName: "Status",
              field: "isActive",
              width: 100,
              filter: "agTextColumnFilter",
              sortable: true,
              cellRenderer: (params: any) => (
                <CategoryStatusBadge isActive={Boolean(params.value)} />
              ),
      },
    ];

    const hasAnyActionPermission =
      hasPermission("admin/categories") ||
      hasPermission("admin/categories/create") ||
      hasPermission("admin/categories/update") ||
      hasPermission("admin/categories/delete");

    if (hasAnyActionPermission) {
      baseColumns.push({
        headerName: "Actions",
        width: 180,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2 h-full">
            {hasPermission("admin/categories") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleView(params.data._id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {hasPermission("admin/categories/update") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(params.data._id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {hasPermission("admin/categories/delete") && (
              <ConfirmationDialog
                title="Delete Category"
                description="Are you sure you want to delete this category?"
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={() => handleDelete(params.data._id)}
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
  }, [handleDelete, handleEdit, handleView, hasPermission]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        {hasPermission("admin/categories/create") && (
          <Button asChild>
            <Link to="/admin/categories/create">
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
        </CardHeader>
        <CardContent>
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
              rowData={categories}
              columnDefs={columnDefs}
              perPage={10}
              paginationPageSizeSelector={[10, 20, 50, 100]}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
