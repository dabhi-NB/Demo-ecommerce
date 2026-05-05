"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, ShoppingBag, AlertCircle } from "lucide-react";
import { useCart, CartItem } from "@/context/CartContext";
import { validateCoupon } from "@/services/order.service";
import { OrderSummary } from "@/components/layout/checkout-layout/OrderSummary";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import AppConfig from "@/appConfig"; 
import { resolveImageUrl } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    totalItems,
    totalPrice,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [stockWarning, setStockWarning] = useState(false);

  // Check and adjust stock on mount
  useEffect(() => {
    let hasStockIssue = false;
    items.forEach((item) => {
      if (item.quantity > item.maxStock) {
        hasStockIssue = true;
        updateQuantity(item.productId, item.maxStock);
      }
    });
    setStockWarning(hasStockIssue);
    if (hasStockIssue) {
      toast.warning(
        "Some items have limited stock. Quantities have been adjusted.",
      );
    }
  }, []);

  const shipping = totalPrice >= 999 ? 0 : 99;
  const total = totalPrice + shipping - (appliedCoupon?.discount || 0);

  const handleCouponApply = async (code: string) => {
    setIsCouponLoading(true);
    try {
      const result = await validateCoupon(code, totalPrice);
      if (result.valid) {
        setAppliedCoupon({
          code: code.toUpperCase(),
          discount: result.discount,
        });
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to apply coupon");
    } finally {
      setIsCouponLoading(false);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col py-20 items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto">
            <ShoppingCart size={40} className="text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground">
            Looks like you haven&apos;t added anything yet.
          </p>
          <Link href="/shop/products">
            <Button size="lg" className="rounded-xl mt-4">
              Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {totalItems} items
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive text-xs">
                Clear Cart
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Cart</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove all items from your cart? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearCart}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear Cart
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stock Warning */}
      {stockWarning && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Some items have limited stock. Quantities have been adjusted.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Layout */}
      <div className="md:grid md:grid-cols-3 gap-6">
        {/* Left - Cart Items */}
        <div className="col-span-2">
          {items.map((item) => (
            <CartItemCard
              key={item.productId}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>

        {/* Right - Order Summary */}
        <div className="col-span-1">
          <OrderSummary
            items={items}
            couponCode={appliedCoupon?.code}
            couponDiscount={appliedCoupon?.discount}
            onCouponApply={handleCouponApply}
            onCouponRemove={() => setAppliedCoupon(null)}
            isCouponLoading={isCouponLoading}
            showCouponInput={true}
          />

          {/* Below Order Summary */}
          <div className="mt-4 space-y-3">
            <Button
              className="w-full rounded-xl"
              size="lg"
              onClick={() => router.push("/shop/account/checkout")}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Proceed to Checkout
            </Button>

            {/* Free delivery progress */}
            {totalPrice < 999 ? (
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Add ₹{(999 - totalPrice).toLocaleString("en-IN")} more for
                  free delivery
                </p>
                <div className="bg-muted rounded-full h-1.5 mt-2">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${(totalPrice / 999) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                <p className="text-xs text-green-600 font-medium">
                  🎉 You&apos;ve unlocked free delivery!
                </p>
              </div>
            )}

            <Link href="/shop/products" className="block">
              <Button variant="ghost" className="w-full text-sm">
                ← Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cart Item Card Component
interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.productId, item.quantity - 1);
    } else {
      setShowConfirm(true);
    }
  };

  const handleIncrement = () => {
    if (item.quantity < item.maxStock) {
      onUpdateQuantity(item.productId, item.quantity + 1);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-3 flex gap-4">
      {/* Image */}
      <Link
        href={`/shop/products/${item.slug}`}
        className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-muted/50 relative flex-shrink-0"
      >
          <img
src={resolveImageUrl(item.image)}
            alt={item.name}
            className="object-contain w-full h-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src = AppConfig.DEFULT_IMAGE;
            }}
          />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/shop/products/${item.slug}`}>
          <p className="font-semibold text-sm leading-snug hover:text-primary line-clamp-2">
            {item.name}
          </p>
        </Link>
        
        {/* Variant Combination Display */}
        {item.variantCombination && item.variantCombination.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-0.5">
            {item.variantCombination.map((c: any, i: number) => (
              <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {c.name}: <span className="font-semibold text-foreground">{c.value}</span>
              </span>
            ))}
          </div>
        )}
        
        {item.variant?.color && !item.variantCombination && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Color: {item.variant.color}
          </p>
        )}

        {/* Price row */}
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold">
            ₹{item.price.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-muted-foreground">per item</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end justify-between">
        {/* Item total */}
        <p className="font-bold text-base text-primary">
          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
        </p>

        {/* Quantity control */}
        <div className="flex items-center">
          <div className="flex items-center border border-border rounded-xl overflow-hidden h-9 w-fit">
            {/* Decrement button */}
            <button
              onClick={handleDecrement}
              className="w-9 h-9 hover:bg-muted transition flex items-center justify-center"
            >
              {item.quantity === 1 ? (
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              ) : (
                <span className="text-sm">−</span>
              )}
            </button>

            {/* Quantity display */}
            <span className="w-10 text-center text-sm font-medium">
              {item.quantity}
            </span>

            {/* Increment button */}
            <button
              onClick={handleIncrement}
              disabled={item.quantity >= item.maxStock}
              className="w-9 h-9 hover:bg-muted transition flex items-center justify-center disabled:opacity-50"
            >
              <span className="text-sm">+</span>
            </button>
          </div>

          {/* Remove button */}
          <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
            <AlertDialogTrigger asChild>
              <button className="ml-2 w-9 h-9 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove "{item.name}" from your cart?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onRemove(item.productId)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
