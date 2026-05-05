
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getCategoryById, deleteCategory } from "@/services/category.service";
import { formatDateTime } from "@/lib/utils";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationDialog } from "../layouts/component/ConfirmationDialog";
import { ArrowLeft, Edit, Trash2, ImageIcon } from "lucide-react";
import General from "@/helper/general";

export default function CategoryView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();

  const { deleteItem: handleDelete } = useDeleteEntity(
    deleteCategory,
    ["categories"],
    "Category",
  );

  const { data: category, isLoading, isError, error } = useQuery({
    queryKey: ["category", id],
    queryFn: () => getCategoryById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-destructive">
          {(error as Error)?.message || "Failed to load category"}
        </div>
        <Button variant="secondary" onClick={() => navigate("/admin/categories")}>
          Back to Categories
        </Button>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-muted-foreground">Category not found</div>
        <Button variant="secondary" onClick={() => navigate("/admin/categories")}>
          Back to Categories
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/categories")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">View Category</h1>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission("admin/categories/update") && (
            <Button variant="secondary" onClick={() => navigate(`/admin/categories/update/${id}`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
          {hasPermission("admin/categories/delete") && (
            <ConfirmationDialog
              title="Delete Category"
              description="Are you sure you want to delete this category? This action cannot be undone."
              confirmText="Delete"
              cancelText="Cancel"
              onConfirm={() => handleDelete(id!)}
            >
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </ConfirmationDialog>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
                <div className="text-lg">{category.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Slug</div>
                <div className="text-lg">{category.slug}</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
              <div className="text-base">{category.description || "No description"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Image</CardTitle>
          </CardHeader>
          <CardContent>
            {category.image ? (
              <img src={General.getCategoryImageUrl(category.image)} alt={category.name} className="w-40 h-40 object-cover rounded-lg border" />
            ) : (
              <div className="w-40 h-40 bg-muted rounded-lg border flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Order</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                <Badge variant={category.isActive ? "success" : "destructive"}>
                  {category.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Sort Order</div>
                <div className="text-lg">{category.sortOrder ?? 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Created At</div>
                <div className="text-base">{category.createdAt ? formatDateTime(category.createdAt) : "N/A"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Updated At</div>
                <div className="text-base">{category.updatedAt ? formatDateTime(category.updatedAt) : "N/A"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
