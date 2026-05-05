"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Package, MapPin, Truck } from "lucide-react";
import { getOrderById, cancelOrder, IOrder } from "@/services/order.service";
import { OrderStatusBadge } from "@/components/layout/order-layout/OrderStatusBadge";
import { OrderTimeline } from "@/components/layout/order-layout/OrderTimeline";
import AccountLayout from "@/components/layout/account-layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { resolveImageUrl } from "@/lib/utils";
import AppConfig from "@/appConfig";

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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (error: any) {
        if (error?.response?.status === 404) {
          setNotFound(true);
        }
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      await cancelOrder(order._id, cancelReason || undefined);
      toast.success("Order cancelled successfully");
      const updatedOrder = await getOrderById(order._id);
      setOrder(updatedOrder);
      setCancelDialogOpen(false);
      setCancelReason("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const canCancel = order?.status === "placed" || order?.status === "confirmed";

  if (loading) {
    return (
      <AccountLayout title="Order Details">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </AccountLayout>
    );
  }

  if (notFound || !order) {
    return (
      <AccountLayout
        title="Order Not Found"
        subtitle="The order you're looking for doesn't exist"
      >
        <div className="flex flex-col items-center justify-center py-16">
          <h1 className="text-2xl font-bold">Order not found</h1>
          <p className="text-muted-foreground mt-2">
            The order you're looking for doesn't exist.
          </p>
          <Link href="/shop/account/orders">
            <Button className="mt-6">← My Orders</Button>
          </Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title={`Order #${order.orderNumber}`}
      subtitle={`Placed on ${formatDate(order.createdAt)}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <Link href="/shop/account/orders">
          <Button variant="ghost" size="sm">
            ← My Orders
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <OrderStatusBadge status={order.status} />
        </div>

        {canCancel && (
          <AlertDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="rounded-xl">
                Cancel Order
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
              <AlertDialogDescription>
                Order #{order.orderNumber} will be cancelled. This cannot be
                undone.
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
                  disabled={isCancelling}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isCancelling ? "Cancelling..." : "Yes, Cancel Order"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
              <Truck size={18} className="text-primary" />
              Order Tracking
            </h3>
            <OrderTimeline
              timeline={order.timeline}
              currentStatus={order.status}
            />
            {order.status === "shipped" && order.estimatedDelivery && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mt-3 text-center">
                <p className="text-sm text-primary font-medium">
                  🚚 Expected delivery by {formatDate(order.estimatedDelivery)}
                </p>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Package size={18} />
              Items Ordered ({order.items.length})
            </h3>
            <div>
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 py-3 border-b border-border last:border-0"
                >

<Link href={`/shop/products/${item.product?.slug || ''}`} className="flex-shrink-0">
                    <div className="w-[72px] h-[72px] rounded-xl bg-muted/50 overflow-hidden relative">
                      <Image
                        src={resolveImageUrl(item.image)}
                        alt={item.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 64px, 72px"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            AppConfig.DEFULT_IMAGE;
                        }}
                      />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/shop/products/${item.product?.slug || ''}`}>
                      <p className="font-medium text-sm leading-snug hover:text-primary">
                        {item.name}
                      </p>
                    </Link>

                    {/* Variant info */}
                    {item.variant?.combination &&
                      item.variant.combination.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-0.5">
                          {item.variant.combination.map((c: any, i: number) => (
                            <span
                              key={i}
                              className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground"
                            >
                              {c.name}:{" "}
                              <span className="font-medium text-foreground">
                                {c.value}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}

                    <p className="text-xs text-muted-foreground mt-0.5">
                      Qty: {item.quantity} × ₹
                      {item.price?.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin size={16} />
              Delivery Address
            </h3>
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.phone}
            </p>
            <p className="text-sm mt-2">{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && (
              <p className="text-sm text-muted-foreground">
                {order.shippingAddress.addressLine2}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
              {order.shippingAddress.pincode}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-3">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span>
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : "Online Payment"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={
                    order.paymentStatus === "paid"
                      ? "default"
                      : order.paymentStatus === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                  className={
                    order.paymentStatus === "paid"
                      ? "bg-green-500"
                      : order.paymentStatus === "pending"
                        ? "bg-orange-500"
                        : "bg-red-500"
                  }
                >
                  {order.paymentStatus.charAt(0).toUpperCase() +
                    order.paymentStatus.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-3">Bill Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span
                  className={
                    order.shippingCharge === 0 ? "text-green-500" : undefined
                  }
                >
                  {order.shippingCharge === 0
                    ? "FREE"
                    : `₹${order.shippingCharge.toLocaleString("en-IN")}`}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Coupon ({order.coupon?.code})</span>
                  <span>-₹{order.discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Total Paid</span>
                <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
