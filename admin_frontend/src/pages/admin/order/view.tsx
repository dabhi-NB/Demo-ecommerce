import { useParams, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  Truck,
  CreditCard,
  Clock,
} from "lucide-react";
import {
  getOrderById,
  updateOrderStatus,
  type OrderUser,
} from "@/services/order.service";
import { useAuth } from "@/context/AuthContext";

// Helper function to extract user ID from OrderUser type
const getUserId = (user: OrderUser): string => {
  if (typeof user === "string") {
    return user;
  }
  return user?._id || user?.id || "";
};
import { formatDateTime } from "@/lib/utils";
import AppConfig from "@/appConfig";
import { toast } from "sonner";

// Status badge colors
const statusColors: Record<
  string,
  "default" | "success" | "destructive" | "secondary" | "outline"
> = {
  placed: "default",
  confirmed: "outline",
  processing: "default",
  shipped: "secondary",
  delivered: "success",
  cancelled: "destructive",
  returned: "secondary",
};

// Status labels
const statusLabels: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled", "returned"],
  delivered: ["returned", "cancelled"],
  cancelled: [],
  returned: [],
};

export default function OrderView() {
  const { id } = useParams<{ id: string }>();

  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");

  // Check if user has permission to view orders
  if (!hasPermission("admin/orders") && !hasPermission("admin/orders/view")) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        You don't have permission to access this page.
      </div>
    );
  }

  // Fetch order
  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
  });

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: string; note?: string }) =>
      updateOrderStatus(id!, status, note),
    onSuccess: (response) => {
      if (response.status === 1) {
        toast.success("Order status updated successfully");
        queryClient.invalidateQueries({ queryKey: ["order", id] });
        setStatusNote("");
        setNewStatus("");
      } else {
        toast.error(response.message || "Failed to update status");
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update status");
    },
  });

  const handleUpdateStatus = () => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }
    statusMutation.mutate({ status: newStatus, note: statusNote });
  };

  const currentTransitions = order ? validTransitions[order.status] || [] : [];

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
            {error instanceof Error ? error.message : "Failed to load order"}
          </p>
          <Link to="/admin/orders">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <p className="text-yellow-600">Order not found</p>
          <Link to="/admin/orders">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="success">Paid</Badge>;
      case "pending":
        return <Badge variant="default">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const couponDiscount = order.couponDiscount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
        <Link to="/admin/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Order Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Order Number
                  </label>
                  <p className="text-lg font-mono font-semibold">
                    {order.orderNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Order Date
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Payment Method
                  </label>
                  <p className="mt-1">
                    <Badge
                      variant={
                        order.paymentMethod === "cod" ? "outline" : "default"
                      }
                    >
                      {order.paymentMethod === "cod" ? "COD" : "Online"}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Payment Status
                  </label>
                  <div className="mt-1">
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>
                {order.estimatedDelivery && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Estimated Delivery
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <p>{formatDateTime(order.estimatedDelivery)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 border rounded-lg"
                  >
                    <img
                      src={
                        item.image
                          ? `${AppConfig.API_URL}upload/setting/${item.image}`
                          : `${AppConfig.API_URL}upload/setting/no-image.jpg`
                      }
                      alt={item.name}
                      className="h-12 w-12 object-cover rounded border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">
                          {item.variant.color && `${item.variant.color}`}
                          {item.variant.color && item.variant.storage && " / "}
                          {item.variant.storage}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ₹{item.price}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ₹{(item.quantity * item.price).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {order.deliveryCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Delivery Charge
                      </span>
                      <span>
                        ₹{order.deliveryCharge.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount ({order.couponCode})</span>
                      <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="font-semibold">
                    {order.shippingAddress.fullName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Link
                      to={`/admin/user/view/${getUserId(order.user)}`}
                      className="text-blue-600 hover:underline"
                    >
                      View Customer
                    </Link>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p>{order.shippingAddress.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Status Update Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Status */}
              <div className="text-center p-4 border rounded-lg">
                <label className="text-sm font-medium text-muted-foreground">
                  Current Status
                </label>
                <div className="mt-2">
                  <Badge
                    variant={statusColors[order.status] || "secondary"}
                    className="text-lg px-4 py-1"
                  >
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </div>
              </div>

              {/* Update Status Section */}
              {currentTransitions.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground">
                    Update Status
                  </label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentTransitions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabels[status] || status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Add a note (optional)"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={!newStatus || statusMutation.isPending}
                    className="w-full"
                  >
                    {statusMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Status
                  </Button>
                </div>
              )}

              {currentTransitions.length === 0 && (
                <p className="text-center text-muted-foreground text-sm">
                  No more status transitions available for this order.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.timeline && order.timeline.length > 0 ? (
                <div className="space-y-4">
                  {order.timeline
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <Badge
                            variant={statusColors[entry.status] || "secondary"}
                            className="whitespace-nowrap"
                          >
                            {statusLabels[entry.status] || entry.status}
                          </Badge>
                          {index < order.timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          {entry.note && (
                            <p className="text-sm">{entry.note}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(entry.time)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No timeline available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-semibold">
                  {order.shippingAddress.fullName}
                </p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.pincode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </CardContent>
          </Card>

          {/* Coupon Card */}
          {order.couponCode && couponDiscount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Coupon Applied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-mono font-semibold">
                      {order.couponCode}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Discount Amount
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    -₹{couponDiscount.toLocaleString("en-IN")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Notes Card */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
