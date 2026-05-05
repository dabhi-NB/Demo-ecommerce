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
  getCoupons,
  deleteCoupon,
  COUPONS_QUERY_KEY,
  type Coupon,
} from "@/services/coupon.service";
import { ConfirmationDialog } from "../layouts/component/ConfirmationDialog";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { useAuth } from "@/context/AuthContext";

function CouponTypeBadge({ type, value }: { type: string; value: number }) {
  const displayText = type === "percentage" ? `${value}%` : `₹${value}`;
  return (
    <span className="font-medium">
      {type === "percentage" ? "Percentage" : "Fixed"} ({displayText})
    </span>
  );
}

function CouponValue({ type, value }: { type: string; value: number }) {
  return (
    <span className="font-semibold">
      {type === "percentage" ? `${value}%` : `₹${value}`}
    </span>
  );
}

function CouponUsage({
  usedCount,
  usageLimit,
}: {
  usedCount: number;
  usageLimit?: number;
}) {
  const displayText = usageLimit
    ? `${usedCount}/${usageLimit}`
    : `${usedCount}/∞`;
  return <span className="font-medium">{displayText}</span>;
}

function CouponValidUntil({ validUntil }: { validUntil: string }) {
  const isExpired = new Date(validUntil) < new Date();
  return (
    <span className={isExpired ? "text-red-600 font-medium" : ""}>
      {new Date(validUntil).toLocaleDateString("en-IN")}
    </span>
  );
}

function CouponStatusBadge({
  isActive,
  validUntil,
}: {
  isActive: boolean;
  validUntil: string;
}) {
  const isExpired = new Date(validUntil) < new Date();

  if (!isActive) {
    return <Badge variant="secondary">Inactive</Badge>;
  }
  if (isExpired) {
    return <Badge variant="destructive">Expired</Badge>;
  }
  return <Badge variant="success">Active</Badge>;
}

function ActionCell({
  data,
  onView,
  onEdit,
  onDelete,
  canView,
  canEdit,
  canDelete,
}: {
  data: Coupon;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="flex items-center gap-2 h-full">
      {canView && (
        <Button variant="ghost" size="icon" onClick={() => onView(data.id)}>
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {canEdit && (
        <Button variant="ghost" size="icon" onClick={() => onEdit(data.id)}>
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {canDelete && (
        <ConfirmationDialog
          title="Delete Coupon"
          description="Are you sure you want to delete this coupon?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => onDelete(data.id)}
        >
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </ConfirmationDialog>
      )}
    </div>
  );
}

export default function Coupons() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { deleteItem: handleDelete } = useDeleteEntity(
    deleteCoupon,
    COUPONS_QUERY_KEY,
    "Coupon",
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: COUPONS_QUERY_KEY,
    queryFn: () => getCoupons(),
  });

  const coupons = data?.coupons ?? [];

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/admin/coupons/update/${id}`);
    },
    [navigate],
  );

  const handleView = useCallback(
    (id: string) => {
      navigate(`/admin/coupons/view/${id}`);
    },
    [navigate],
  );

  const errorMessage = isError
    ? (error as any)?.message || "Failed to fetch coupons"
    : null;

  const columnDefs: ColDef<Coupon>[] = useMemo(() => {
    const baseColumns: ColDef<Coupon>[] = [
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
        headerName: "Code",
        field: "code",
        cellStyle: { fontFamily: "monospace", fontWeight: "bold" },
      },
      {
        headerName: "Type",
        field: "discountType",
        width: 150,
        cellRenderer: (params: any) => (
          <CouponTypeBadge
            type={params.value}
            value={params.data.discountValue}
          />
        ),
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        headerName: "Value",
        field: "discountValue",
        width: 100,
        cellRenderer: (params: any) => (
          <CouponValue type={params.data.discountType} value={params.value} />
        ),
        filter: "agNumberColumnFilter",
        sortable: true,
      },
      {
        headerName: "Min Order",
        field: "minOrderAmount",
        width: 120,
        valueFormatter: (params: any) => `₹${params.value || 0}`,
        filter: "agNumberColumnFilter",
        sortable: true,
      },
      {
        headerName: "Usage",
        width: 120,
        cellRenderer: (params: any) => (
          <CouponUsage
            usedCount={params.data.usedCount}
            usageLimit={params.data.usageLimit}
          />
        ),
        sortable: false,
        filter: false,
      },
      {
        headerName: "Valid Until",
        field: "validUntil",
        width: 130,
        cellRenderer: (params: any) => (
          <CouponValidUntil validUntil={params.value} />
        ),
        filter: "agDateColumnFilter",
        sortable: true,
      },
      {
        headerName: "Status",
        field: "isActive",
        width: 110,
        cellRenderer: (params: any) => (
          <CouponStatusBadge
            isActive={params.value}
            validUntil={params.data.validUntil}
          />
        ),
        filter: "agTextColumnFilter",
        sortable: true,
      },
    ];

    // Only add Actions column if user has at least one action permission
    const hasAnyActionPermission =
      hasPermission("admin/coupons") ||
      hasPermission("admin/coupons/view") ||
      hasPermission("admin/coupons/update") ||
      hasPermission("admin/coupons/delete");

    if (hasAnyActionPermission) {
      baseColumns.push({
        headerName: "Actions",
        width: 150,
        cellRenderer: (params: any) => (
          <ActionCell
            data={params.data}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canView={hasPermission("admin/coupons")}
            canEdit={hasPermission("admin/coupons/update")}
            canDelete={
              hasPermission("admin/coupons/delete") &&
              params.data.usedCount === 0
            }
          />
        ),
        sortable: false,
        filter: false,
      });
    }

    return baseColumns;
  }, [handleDelete, handleEdit, handleView, hasPermission]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
        {hasPermission("admin/coupons/create") && (
          <Button asChild>
            <Link to="/admin/coupons/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupon Management</CardTitle>
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
              rowData={coupons}
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
