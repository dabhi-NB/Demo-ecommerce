"use client";

import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, X, ShoppingCart, ShoppingBag, ArrowRight } from "lucide-react";
import AppConfig from "@/appConfig";
import { resolveImageUrl } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

interface CartDrawerProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { isAuthenticated } = useAuth();
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart } =
    useCart();
  const router = useRouter();

  const shipping = totalPrice >= 999 ? 0 : 99;
  const total = totalPrice + shipping;

  const handleClose = () => {
    onOpenChange?.(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[380px] p-0 flex flex-col gap-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" />
            <span
              className="font-bold text-base"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              My Cart
            </span>
            {isAuthenticated && totalItems > 0 && (
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <SheetClose asChild>
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X size={18} />
            </button>
          </SheetClose>
        </div>

        {/* NOT LOGGED IN */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
              <ShoppingBag size={32} className="text-primary/60" />
            </div>
            <div>
              <p className="font-bold text-base">Sign in to view your cart</p>
              <p className="text-sm text-muted-foreground mt-1.5">
                Login to add items & place orders
              </p>
            </div>
            <button
              onClick={() => {
                handleClose();
                router.push("/auth/login?redirect=/shop/account/cart");
              }}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all btn-press"
            >
              Login / Sign Up
            </button>
          </div>
        ) : items.length === 0 ? (
          /* EMPTY */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
              <ShoppingCart size={32} className="text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-bold text-base">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1.5">
                Add items to get started
              </p>
            </div>
            <button
              onClick={() => {
                handleClose();
                router.push("/shop/products");
              }}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all btn-press"
            >
              Shop Now
            </button>
          </div>
        ) : (
          <>
            {/* Free delivery progress */}
            <div
              className={`px-5 py-3 border-b border-border ${totalPrice >= 999 ? "bg-green-500/8" : "bg-muted/30"}`}
            >
              {totalPrice < 999 ? (
                <>
                  <p className="text-xs text-foreground/80 mb-1.5">
                    Add{" "}
                    <span className="font-bold text-primary">
                      ₹{(999 - totalPrice).toLocaleString("en-IN")}
                    </span>{" "}
                    more for <span className="font-bold">FREE delivery</span>
                  </p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{
                        width: Math.min((totalPrice / 999) * 100, 100) + "%",
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs text-green-600 dark:text-green-400 font-bold text-center">
                  🎉 You unlocked FREE delivery!
                </p>
              )}
            </div>

            {/* Items */}
            <div
              className="flex-1 overflow-y-auto px-5 py-4 space-y-5 cart-scroll"
              style={{ maxHeight: "calc(100vh - 220px)" }}
            >
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <Link
                    href={"/shop/products/" + item.slug}
                    onClick={handleClose}
                    className="flex-shrink-0"
                  >
                    <div className="w-[68px] h-[68px] rounded-xl bg-muted/40 border border-border overflow-hidden">
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.name}
                        className="object-contain w-full h-full p-1"
onError={(e) => {
                          (e.target as HTMLImageElement).src = AppConfig.DEFULT_IMAGE;
                        }}
                      />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={"/shop/products/" + item.slug}
                      onClick={handleClose}
                    >
                      <p className="text-sm font-semibold line-clamp-2 leading-snug hover:text-primary transition-colors">
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
                    <p className="text-sm font-black text-foreground mt-1">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-border rounded-xl overflow-hidden h-8">
                        <button
                          onClick={() =>
                            item.quantity > 1
                              ? updateQuantity(
                                  item.productId,
                                  item.quantity - 1,
                                )
                              : removeFromCart(item.productId)
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors text-sm font-bold"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 size={12} className="text-destructive" />
                          ) : (
                            "−"
                          )}
                        </button>
                        <span className="w-8 text-center text-sm font-bold border-x border-border">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.maxStock}
                          className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-card px-5 py-4 space-y-3.5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span
                    className={
                      shipping === 0 ? "text-green-600 font-semibold" : ""
                    }
                  >
                    {shipping === 0 ? "FREE" : "₹99"}
                  </span>
                </div>
                <div className="flex justify-between font-black text-base pt-2 border-t border-border text-foreground">
                  <span>Total</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  handleClose();
                  router.push("/shop/account/checkout");
                }}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all btn-press flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>
              <button
                onClick={() => {
                  handleClose();
                  router.push("/shop/account/cart");
                }}
                className="w-full border border-border py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                View Full Cart
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
