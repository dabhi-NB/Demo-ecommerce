import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import type { ColDef } from "ag-grid-community";
import {
  getAdminsPaginated,
  deleteAdmin,
  type Admin,
} from "@/services/admin.service";
import { ConfirmationDialog } from "../layouts/component/ConfirmationDialog";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { useAuth } from "@/context/AuthContext";

function AdminStatusBadge({ status }: { status: Admin["status"] }) {
  const isActive = status == 1;
  return (
    <Badge variant={isActive ? "success" : "destructive"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export default function Admins() {
  const navigate = useNavigate();
  const { deleteItem: handleDelete } = useDeleteEntity(
    async (id: string) => {
      try {
        await deleteAdmin(id);
      } catch (error) {
        console.error("Cascade delete failed:", error);
        throw error;
      }
    },
    ["admins"],
    "Admin",
  );
  const { hasPermission } = useAuth();

  const {
    data: admins,
    isLoading,
    isError,
    error,
  } = usePaginatedData(getAdminsPaginated, ["admins"], 10);

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/admin/admin/update/${id}`);
    },
    [navigate],
  );

  const handleView = useCallback(
    (id: string) => {
      navigate(`/admin/admin/view/${id}`);
    },
    [navigate],
  );

  const errorMessage = isError
    ? (error as any)?.message || "Failed to fetch admin"
    : null;

  const columnDefs: ColDef<Admin>[] = useMemo(() => {
    const baseColumns: ColDef<Admin>[] = [
      {
        headerName: "#",
        width: 70,
        valueGetter: (params: any) =>
          params.node?.rowIndex != null ? params.node.rowIndex + 1 : "",
        sortable: false,
        filter: false,
      },
      {
        headerName: "Name",
        field: "name",
      },
      {
        headerName: "Email",
        field: "email",
      },
      {
        headerName: "Phone",
        field: "phone",
        width: 120,
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        headerName: "Status",
        field: "status",
        width: 100,
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => (
          <AdminStatusBadge status={params.value} />
        ),
      },
    ];

    // Only add Actions column if user has at least one action permission
    const hasAnyActionPermission =
      hasPermission("admin/admin/view") ||
      hasPermission("admin/admin/update") ||
      hasPermission("admin/admin/delete");

    if (hasAnyActionPermission) {
      baseColumns.push({
        headerName: "Actions",
        width: 150,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2 h-full">
            {hasPermission("admin/admin/view") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleView(params.data._id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {hasPermission("admin/admin/update") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(params.data._id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {hasPermission("admin/admin/delete") && (
              <ConfirmationDialog
                title="Delete Admin"
                description="Are you sure you want to delete this admin?"
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
        <h1 className="text-2xl font-bold tracking-tight">Admins</h1>
        {hasPermission("admin/admin/create") && (
          <Button asChild>
            <Link to="/admin/admin/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Management</CardTitle>
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
              rowData={admins}
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
