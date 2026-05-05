"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getOrderById, IOrder } from "@/services/order.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.replace("/");
      return;
    }

    getOrderById(orderId)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Skeleton className="w-24 h-24 rounded-full mx-auto" />
        <Skeleton className="h-8 w-48 mx-auto mt-6" />
        <Skeleton className="h-4 w-64 mx-auto mt-2" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground mt-2">
          We couldn&apos;t load your order details.
        </p>
        <Link href="/shop/account/orders">
          <Button className="mt-6">Go to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {/* Success Animation */}
      <div
        className="mx-auto w-24 h-24 rounded-full bg-green-500/10 border-4 border-green-500 flex items-center justify-center"
        style={{ animation: "checkPop 0.6s ease-out forwards" }}
      >
        <CheckCircle2 size={48} className="text-green-500" />
      </div>

      <h1 className="text-3xl font-black mt-6">Order Placed! 🎉</h1>
      <p className="text-muted-foreground mt-2">
        Thank you for your order. We&apos;ll get it to you soon.
      </p>

      {/* Order Number */}
      <div className="inline-flex items-center gap-2 bg-muted rounded-xl px-4 py-2 mt-4">
        <span className="text-sm text-muted-foreground">Order</span>
        <span className="font-mono font-bold text-primary">
          #{order.orderNumber}
        </span>
      </div>

      {/* Order Quick Summary */}
      <div className="bg-card border border-border rounded-2xl p-5 mt-6 text-left">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Items</span>
            <span>{order.items.length} item(s)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Payment</span>
            <span>
              {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>Total</span>
            <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-sm font-medium text-primary">
            <span>Estimated Delivery</span>
            <span>
              {order.estimatedDelivery
                ? new Date(order.estimatedDelivery).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    },
                  )
                : "3-5 business days"}
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-muted/30 rounded-xl p-4 mt-4 text-left text-sm">
        <p className="font-medium">📍 {order.shippingAddress.fullName}</p>
        <p className="text-muted-foreground">
          {order.shippingAddress.addressLine1}
        </p>
        <p className="text-muted-foreground">
          {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
          {order.shippingAddress.pincode}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 mt-8">
        <Link href={`/shop/account/orders/${order._id}`}>
          <Button className="w-full rounded-xl" size="lg">
            Track My Order
          </Button>
        </Link>
        <Link href="/shop/products">
          <Button variant="outline" className="w-full rounded-xl">
            Continue Shopping
          </Button>
        </Link>
      </div>

      <style jsx global>{`
        @keyframes checkPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
