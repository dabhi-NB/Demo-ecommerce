import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import {
  getUsers,
  deleteUser,
  USERS_QUERY_KEY,
  type User,
} from "@/services/user.service";
import { ConfirmationDialog } from "../layouts/component/ConfirmationDialog";
import { formatDateTime } from "@/lib/utils";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { useAuth } from "@/context/AuthContext";

function UserStatusBadge({ status }: { status: number }) {
  const isActive = status === 1;
  return (
    <Badge variant={isActive ? "success" : "destructive"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export default function Users() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const { deleteItem: handleDelete } = useDeleteEntity(
    async (id: string) => {
      try {
        await deleteUser(id);
      } catch (error) {
        console.error("Cascade delete failed:", error);
        throw error;
      }
    },
    USERS_QUERY_KEY,
    "User",
  );

  const {
    data: users = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => getUsers(),
  });

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/admin/user/update/${id}`);
    },
    [navigate],
  );

  const handleView = useCallback(
    (id: string) => {
      navigate(`/admin/user/view/${id}`);
    },
    [navigate],
  );

  const errorMessage = isError
    ? (error as any)?.message || "Failed to fetch users"
    : null;

  const columnDefs: ColDef<User>[] = useMemo(() => {
    const baseColumns: ColDef<User>[] = [
      {
        headerName: "#",
        width: 70,
        valueGetter: (params: any) => {
          return params.node?.rowIndex != null ? params.node.rowIndex + 1 : "";
        },
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
        headerName: "Country",
        field: "country",
        width: 100,
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        headerName: "Created At",
        field: "created_at",
        width: 150,
        filter: "agDateColumnFilter",
        sortable: true,
        valueFormatter: (params: any) => formatDateTime(params.value),
      },
      {
        headerName: "Status",
        field: "status",
        width: 100,
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => (
          <UserStatusBadge status={params.value} />
        ),
      },
    ];

    // Only add Actions column if user has at least one action permission
    const hasAnyActionPermission =
      hasPermission("admin/user/view") ||
      hasPermission("admin/user/update") ||
      hasPermission("admin/user/delete");

    if (hasAnyActionPermission) {
      baseColumns.push({
        headerName: "Actions",
        width: 150,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2 h-full">
            {hasPermission("admin/user/view") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleView(params.data.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {hasPermission("admin/user/update") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(params.data.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {hasPermission("admin/user/delete") && (
              <ConfirmationDialog
                title="Delete User"
                description="Are you sure you want to delete this user?"
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
  }, [handleDelete, handleEdit, handleView, hasPermission]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        {hasPermission("admin/user/create") && (
          <Button asChild>
            <Link to="/admin/user/create">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-10 text-[var(--color-muted-foreground)]">
              Loading...
            </div>
          )}
          {errorMessage && (
            <div className="text-center py-10 text-[var(--color-destructive)]">
              {errorMessage}
            </div>
          )}
          {!isLoading && !errorMessage && (
            <DataTable
              rowData={users}
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
