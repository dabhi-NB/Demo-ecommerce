"use client";

import { useState } from "react";
import AppConfig from "@/appConfig";
import { resolveImageUrl } from "@/lib/utils";
import { Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "@/context/CartContext";

interface OrderSummaryProps {
  items: CartItem[];
  couponCode?: string;
  couponDiscount?: number;
  onCouponApply?: (code: string) => void;
  onCouponRemove?: () => void;
  isCouponLoading?: boolean;
  showCouponInput?: boolean;
}

export function OrderSummary({
  items,
  couponCode,
  couponDiscount,
  onCouponApply,
  onCouponRemove,
  isCouponLoading = false,
  showCouponInput = true,
}: OrderSummaryProps) {
  const [couponInput, setCouponInput] = useState("");

  // Calculations
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal >= 999 ? 0 : 99;
  const discount = couponDiscount || 0;
  const total = subtotal + shipping - discount;

  const handleCouponApply = () => {
    if (couponInput.trim() && onCouponApply) {
      onCouponApply(couponInput.trim().toUpperCase());
    }
  };

  const handleCouponRemove = () => {
    if (onCouponRemove) {
      onCouponRemove();
    }
    setCouponInput("");
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      {/* Title */}
      <h2 className="text-base font-semibold mb-4">Order Summary</h2>

      {/* Items List */}
      {items.length > 0 ? (
        <>
          {items.length > 3 ? (
            <ScrollArea className="max-h-52">
              <div className="space-y-0">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="w-11 h-11 rounded-xl bg-muted/50 relative flex-shrink-0">
                      <img
                        src={resolveImageUrl(item.image || "/file.svg")}
                        alt={item.name}
                        className="object-contain w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            AppConfig.DEFULT_IMAGE;
                        }}
                      />
                    </div>
                    <p className="text-sm line-clamp-1 flex-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ×{item.quantity}
                    </p>
                    <p className="text-sm font-medium">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="space-y-0">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className="w-11 h-11 rounded-xl bg-muted/50 relative flex-shrink-0">
                    <img
src={resolveImageUrl(item.image)}
                      alt={item.name}
                      className="object-contain w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = AppConfig.DEFULT_IMAGE;
                      }}
                      
                    />
                  </div>
                  <p className="text-sm line-clamp-1 flex-1">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ×{item.quantity}
                  </p>
                  <p className="text-sm font-medium">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Coupon Section */}
          {showCouponInput && (
            <>
              <Separator className="mt-3 mb-3" />

              {!couponCode ? (
                <>
                  <p className="text-sm font-medium mb-2">Have a coupon?</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      className="uppercase"
                    />
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={handleCouponApply}
                      disabled={!couponInput.trim() || isCouponLoading}
                    >
                      {isCouponLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">
                      {couponCode} applied
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCouponRemove}
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Price Breakdown */}
          <Separator className="mt-3" />
          <div className="space-y-2 mt-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              {shipping === 0 ? (
                <span className="text-green-500 font-medium">FREE</span>
              ) : (
                <span>₹{shipping.toLocaleString("en-IN")}</span>
              )}
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Coupon Discount</span>
                <span className="text-green-500">
                  -₹{discount.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>

          <Separator className="mt-2" />
          <div className="flex justify-between font-bold text-base mt-2">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            🔒 Secure checkout. Prices inclusive of taxes.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Your cart is empty
        </p>
      )}
    </div>
  );
}

export default OrderSummary;
