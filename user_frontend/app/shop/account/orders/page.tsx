"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";
import { getMyOrders, cancelOrder, IOrder } from "@/services/order.service";
import { OrderStatusBadge } from "@/components/layout/order-layout/OrderStatusBadge";
import AccountLayout from "@/components/layout/account-layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useStore } from "@/hooks/useStore";

const FILTERS = [
  { key: "all", label: "All Orders" },
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const filter = activeFilter === "all" ? undefined : activeFilter;
        const result = await getMyOrders(page, filter);
        setOrders(result.orders);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, activeFilter]);

  // Handle filter change
  const handleFilterChange = (filter: FilterKey) => {
    setActiveFilter(filter);
    setPage(1);
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId: string, reason?: string) => {
    try {
      await cancelOrder(orderId, reason);
      toast.success("Order cancelled");
      // Refetch orders
      const filter = activeFilter === "all" ? undefined : activeFilter;
      const result = await getMyOrders(page, filter);
      setOrders(result.orders);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error("Failed to cancel order");
    }
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get filter label
  const getFilterLabel = (key: FilterKey) => {
    return FILTERS.find((f) => f.key === key)?.label || key;
  };

  return (
    <AccountLayout title="My Orders" subtitle={`${total} orders`}>
      <div className="bg-card border border-border rounded-2xl p-5">
        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap mb-4">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleFilterChange(filter.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeFilter === filter.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="py-16 text-center">
            <Package className="size-16 text-muted-foreground mx-auto" />
            <p className="text-xl font-semibold mt-4">
              No {activeFilter === "all" ? "" : getFilterLabel(activeFilter)}{" "}
              orders found
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Start shopping to see your orders here
            </p>
            <Link href="/shop/products">
              <Button size="lg" className="rounded-xl mt-6">
                Shop Now
              </Button>
            </Link>
          </div>
        )}

        {/* Order Cards */}
        {!loading && orders.length > 0 && (
          <div className="space-y-4 mt-4">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onCancel={handleCancelOrder}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages,
              )
              .map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

// Order Card Component
interface OrderCardProps {
  order: IOrder;
  onCancel: (orderId: string, reason?: string) => void;
  formatDate: (date: string) => string;
}

function OrderCard({ order, onCancel, formatDate }: OrderCardProps) {
  const router = useRouter();
  const { formatPrice } = useStore();
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleCancel = () => {
    onCancel(order._id, cancelReason || undefined);
    setShowCancelDialog(false);
    setCancelReason("");
  };

  const canCancel = order.status === "placed" || order.status === "confirmed";

  return (
    <>
      <div
        className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition cursor-pointer"
        onClick={() => router.push(`/shop/account/orders/${order._id}`)}
      >
        {/* Top Section */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-semibold text-sm">
                #{order.orderNumber}
              </span>
              <OrderStatusBadge status={order.status} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(order.createdAt)}
            </p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {order.items.length} item{order.items.length > 1 ? "s" : ""} ·{" "}
              {order.items[0]?.name}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-lg">
              {formatPrice(order.totalAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Estimated:{" "}
            {order.estimatedDelivery
              ? formatDate(order.estimatedDelivery)
              : "3-5 business days"}
          </span>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Link href={`/shop/account/orders/${order._id}`}>
              <Button variant="outline" size="sm" className="rounded-xl">
                View Details
              </Button>
            </Link>
            {canCancel && (
              <AlertDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-destructive"
                  >
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel order #{order.orderNumber}. If paid online,
                    refund will be processed in 5-7 business days.
                  </AlertDialogDescription>
                  <Textarea
                    placeholder="Reason for cancellation (optional)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="mt-4"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Order</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
