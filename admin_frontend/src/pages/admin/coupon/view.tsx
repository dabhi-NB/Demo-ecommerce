import { useParams, Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Edit, Trash2 } from "lucide-react";
import {
  getCouponById,
  deleteCoupon,
  COUPONS_QUERY_KEY,
} from "@/services/coupon.service";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationDialog } from "../layouts/component/ConfirmationDialog";

export default function CouponView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const { deleteMutation } = useDeleteEntity(
    deleteCoupon,
    COUPONS_QUERY_KEY,
    "Coupon",
  );

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      navigate("/admin/coupons", { replace: true });
    } catch (error) {
      // Error already handled by the hook
    }
  };

  const {
    data: coupon,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [COUPONS_QUERY_KEY, id],
    queryFn: () => getCouponById(id!),
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
            {error instanceof Error ? error.message : "Failed to load coupon"}
          </p>
          <Link to="/admin/coupons">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Coupons
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!coupon) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <p className="text-yellow-600">Coupon not found</p>
          <Link to="/admin/coupons">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Coupons
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isExpired = new Date(coupon.validUntil) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Coupon Details</h1>

        <div className="flex gap-2">
          {hasPermission("admin/coupons/update") && (
            <Link to={`/admin/coupons/update/${coupon.id}`}>
              <Button size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          {hasPermission("admin/coupons/delete") && (
            <ConfirmationDialog
              title="Delete Coupon"
              description="Are you sure you want to delete this coupon?"
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
          <Link to="/admin/coupons">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Coupon Code
              </label>
              <p className="text-lg font-semibold font-mono mt-1">
                {coupon.code}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <p className="mt-1">{coupon.description || "N/A"}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="mt-1">
                {coupon.isActive ? (
                  isExpired ? (
                    <Badge variant="destructive">Expired</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discount Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Discount Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Discount Type
              </label>
              <p className="text-lg font-semibold mt-1">
                {coupon.discountType === "percentage"
                  ? "Percentage"
                  : "Fixed Amount"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Discount Value
              </label>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {coupon.discountType === "percentage"
                  ? `${coupon.discountValue}%`
                  : `₹${coupon.discountValue}`}
              </p>
            </div>

            {coupon.discountType === "percentage" && coupon.maxDiscount && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Maximum Discount
                </label>
                <p className="text-lg font-semibold mt-1">
                  ₹{coupon.maxDiscount}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Minimum Order Amount
              </label>
              <p className="text-lg font-semibold mt-1">
                ₹{coupon.minOrderAmount || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Usage & Validity Card */}
        <Card>
          <CardHeader>
            <CardTitle>Usage & Validity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Usage Limit
              </label>
              <p className="text-lg font-semibold mt-1">
                {coupon.usageLimit
                  ? `${coupon.usedCount} / ${coupon.usageLimit}`
                  : `${coupon.usedCount} / ∞`}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Valid From
              </label>
              <p className="text-lg font-semibold mt-1">
                {coupon.validFrom
                  ? new Date(coupon.validFrom).toLocaleDateString("en-IN")
                  : "N/A"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Valid Until
              </label>
              <p
                className={`text-lg font-semibold mt-1 ${isExpired ? "text-red-600" : ""}`}
              >
                {coupon.validUntil
                  ? new Date(coupon.validUntil).toLocaleDateString("en-IN")
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Timestamps Card */}
        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created At
              </label>
              <p className="mt-1">
                {coupon.createdAt ? formatDateTime(coupon.createdAt) : "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Updated At
              </label>
              <p className="mt-1">
                {coupon.updatedAt ? formatDateTime(coupon.updatedAt) : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
