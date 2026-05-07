"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppConfig from "@/appConfig";
import { resolveImageUrl } from "@/lib/utils";
import {
  Check,
  MapPin,
  Banknote,
  CreditCard,
  ShieldCheck,
  Plus,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart, CartItem } from "@/context/CartContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  getAddresses,
  addAddress,
  deleteAddress,
  placeOrder,
  ShippingAddress,
} from "@/services/order.service";
import { AddressCard } from "@/components/layout/checkout-layout/AddressCard";
import { AddressForm } from "@/components/layout/checkout-layout/AddressForm";
import { OrderSummary } from "@/components/layout/checkout-layout/OrderSummary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const STEPS = ["Delivery", "Payment", "Review"];

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const { payment } = useAppSettings();

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login?redirect=/shop/account/checkout");
    } else if (items.length === 0) {
      router.replace("/shop/account/cart");
    }
  }, [isAuthenticated, items.length, router]);

  // State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddress, setSelectedAddress] =
    useState<ShippingAddress | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(true);

  // Card details state
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
    upi: "",
  });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [showCvv, setShowCvv] = useState(false);

  // Auto-select default gateway when payment settings load
  useEffect(() => {
    if (payment.gateways.length > 0) {
      const defaultGw =
        payment.gateways.find((g) => g.isDefault) || payment.gateways[0];
      setSelectedGatewayId(defaultGw.id);
      if (payment.onlinePaymentEnabled) setPaymentMethod("online");
      else if (payment.codEnabled) setPaymentMethod("cod");
    } else {
      // Default to COD if no gateways
      if (payment.codEnabled) setPaymentMethod("cod");
    }
  }, [payment]);

  // Calculate totals
  const shipping = totalPrice >= 999 ? 0 : 99;
  const total = totalPrice + shipping - (appliedCoupon?.discount || 0);

  // Get selected gateway
  const selectedGateway = payment.gateways.find(
    (g) => g.id === selectedGatewayId,
  );

  // Fetch addresses on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAddresses = async () => {
      try {
        const addresses = await getAddresses();
        setSavedAddresses(addresses);

        const defaultAddr = addresses.find(
          (addr: ShippingAddress) => addr.isDefault,
        );
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
        setSavedAddresses([]);
      } finally {
        setAddressesLoading(false);
      }
    };

    fetchAddresses();
  }, [isAuthenticated]);

  // Handle save address
  const handleSaveAddress = async (data: ShippingAddress) => {
    try {
      await addAddress(data);
      const addresses = await getAddresses();
      setSavedAddresses(addresses);
      setShowAddressForm(false);
      setSelectedAddress(data);
      toast.success("Address saved");
    } catch (error) {
      toast.error("Failed to save address");
    }
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddress(addressId);
      const addresses = await getAddresses();
      setSavedAddresses(addresses);
      if (selectedAddress?._id === addressId) {
        setSelectedAddress(addresses[0] || null);
      }
      toast.success("Address deleted");
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  // Handle coupon apply
  const handleCouponApply = async (code: string) => {
    try {
      const result = await (
        await import("@/services/order.service")
      ).validateCoupon(code, totalPrice);
      if (result.valid) {
        setAppliedCoupon({
          code: code.toUpperCase(),
          discount: result.discount,
        });
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Invalid coupon");
    }
  };

  // Validate card details
  const validateCardDetails = (): boolean => {
    if (paymentMethod !== "online") return true;

    // If UPI filled — validate UPI only
    if (cardDetails.upi.trim()) {
      if (!/^[\w.\-]+@[\w]+$/.test(cardDetails.upi.trim())) {
        setCardErrors({ upi: "Enter a valid UPI ID (e.g. name@upi)" });
        return false;
      }
      return true;
    }

    const errors: Record<string, string> = {};

    // Card number: 16 digits
    const rawNum = cardDetails.number.replace(/\s/g, "");
    if (rawNum.length !== 16)
      errors.number = "Enter a valid 16-digit card number";

    // Name
    if (!cardDetails.name.trim() || cardDetails.name.trim().length < 3) {
      errors.name = "Enter the name as shown on card";
    }

    // Expiry: MM/YY, not in past
    const expiryMatch = cardDetails.expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (!expiryMatch) {
      errors.expiry = "Enter valid expiry (MM/YY)";
    } else {
      const [, mm, yy] = expiryMatch;
      const month = parseInt(mm);
      const year = 2000 + parseInt(yy);
      const now = new Date();
      if (month < 1 || month > 12) errors.expiry = "Invalid month";
      else if (
        year < now.getFullYear() ||
        (year === now.getFullYear() && month < now.getMonth() + 1)
      ) {
        errors.expiry = "Card has expired";
      }
    }

    // CVV: 3-4 digits
    if (!/^\d{3,4}$/.test(cardDetails.cvv)) errors.cvv = "Enter valid CVV";

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!selectedAddress) return;

    // Validate gateway selection for online payment
    if (paymentMethod === "online" && !selectedGatewayId) {
      toast.error("Please select a payment option");
      return;
    }

    // Validate card details first
    if (!validateCardDetails()) {
      toast.error("Please fill in valid payment details");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderItems = items.map((item: CartItem) => ({
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId || null,
        variant: item.variantCombination
          ? { combination: item.variantCombination }
          : undefined,
      }));

      // Place order first (creates it in DB with status 'placed')
      const order = await placeOrder({
        items: orderItems,
        shippingAddress: selectedAddress,
        paymentMethod,
        gatewayId: selectedGatewayId || null,
        couponCode: appliedCoupon?.code,
      });

      // For COD — order is done, go to success
      if (paymentMethod === "cod") {
        clearCart();
        router.push(`/shop/account/checkout/success?orderId=${order._id}`);
        return;
      }

      // For ONLINE payment — open Razorpay
      if (paymentMethod === "online") {
        // Dynamically import to avoid SSR issues
        const { initiatePayment, verifyPayment, openRazorpayCheckout } =
          await import("@/services/payment.service");

        // Load Razorpay script if not already loaded
        if (typeof window !== "undefined" && !(window as any).Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Razorpay SDK load failed"));
            document.body.appendChild(script);
          });
        }

        // Initiate payment with our backend (gets Razorpay order id)
        const paymentData = await initiatePayment(order._id);

        // Open Razorpay checkout widget
        openRazorpayCheckout(
          paymentData,
          {
            name: user?.first_name
              ? `${user.first_name} ${user.last_name || ""}`.trim()
              : "",
            email: user?.email || "",
          },
          async (razorpayResponse: any) => {
            // Payment success callback — verify with our backend
            try {
              await verifyPayment({
                razorpayOrderId: paymentData.razorpayOrderId,
                razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                razorpaySignature: razorpayResponse.razorpay_signature,
                orderId: order._id,
              });
              clearCart();
              router.push(
                `/shop/account/checkout/success?orderId=${order._id}`,
              );
            } catch {
              toast.error(
                "Payment verification failed. Please contact support with order #" +
                  order.orderNumber,
              );
              setIsPlacingOrder(false);
              router.push(`/shop/account/orders/${order._id}`);
            }
          },
          (error: any) => {
            // Payment failed/cancelled
            if (error?.message === "Payment cancelled by user") {
              toast.info(
                "Payment cancelled. Your order is saved — you can pay later from My Orders.",
              );
            } else {
              toast.error(
                "Payment failed: " + (error?.description || "Please try again"),
              );
            }
            setIsPlacingOrder(false);
            router.push(`/shop/account/orders/${order._id}`);
          },
        );

        return; // Don't stop loading spinner — Razorpay modal is open
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || "Failed to place order";
      toast.error(message);
      setIsPlacingOrder(false);
    }
  };

  // Show loading if not ready
  if (!isAuthenticated || items.length === 0) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Main Grid */}
      <div className="md:grid md:grid-cols-3 gap-6">
        {/* Left - Step Content */}
        <div className="col-span-2">
          {/* Step 1: Delivery Address */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Delivery Address</h2>

              {addressesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <>
                  {savedAddresses.length === 0 && !showAddressForm && (
                    <div className="bg-muted/30 border border-border rounded-2xl p-4 mb-3">
                      <p className="text-sm text-muted-foreground mb-3">
                        No saved addresses. Please add one to continue.
                      </p>
                      <AddressForm
                        onSubmit={handleSaveAddress}
                        onCancel={() => setShowAddressForm(false)}
                        isLoading={false}
                        submitLabel="Save & Use This Address"
                      />
                    </div>
                  )}

                  {savedAddresses.length > 0 && (
                    <div className="space-y-3">
                      {savedAddresses.map((addr) => (
                        <AddressCard
                          key={addr._id}
                          address={addr}
                          isSelected={selectedAddress?._id === addr._id}
                          onSelect={() => {
                            setSelectedAddress(addr);
                            setShowAddressForm(false);
                          }}
                          onDelete={() => handleDeleteAddress(addr._id!)}
                          showActions={true}
                        />
                      ))}
                    </div>
                  )}

                  {(savedAddresses.length > 0 || showAddressForm) && (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl mt-3"
                      onClick={() => {
                        setShowAddressForm(!showAddressForm);
                        setSelectedAddress(null);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Address
                    </Button>
                  )}

                  {showAddressForm && savedAddresses.length > 0 && (
                    <div className="bg-muted/30 border border-border rounded-2xl p-4 mt-3">
                      <AddressForm
                        onSubmit={handleSaveAddress}
                        onCancel={() => setShowAddressForm(false)}
                        isLoading={false}
                        submitLabel="Save & Use This Address"
                      />
                    </div>
                  )}
                </>
              )}

              <Button
                className="w-full rounded-xl mt-6"
                size="lg"
                disabled={!selectedAddress}
                onClick={() => setCurrentStep(2)}
              >
                Continue to Payment →
              </Button>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>

              <div className="space-y-3">
                <h3 className="font-bold text-sm">Payment Method</h3>

                {/* COD Option — only if admin enabled */}
                {payment.codEnabled && (
                  <button
                    onClick={() => setPaymentMethod("cod")}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      paymentMethod === "cod"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === "cod" ? "border-primary" : "border-muted-foreground"}`}
                    >
                      {paymentMethod === "cod" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Banknote size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          Cash on Delivery
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pay when your order arrives
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {/* ONLINE — only if admin enabled */}
                {payment.onlinePaymentEnabled &&
                  payment.gateways.length > 0 && (
                    <div>
                      <button
                        onClick={() => setPaymentMethod("online")}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === "online"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-border/80"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === "online" ? "border-primary" : "border-muted-foreground"}`}
                        >
                          {paymentMethod === "online" && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <CreditCard size={20} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Pay Online</p>
                            <p className="text-xs text-muted-foreground">
                              Secure payment
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Gateway selector — only if multiple active gateways */}
                      {paymentMethod === "online" &&
                        payment.gateways.length > 1 && (
                          <div className="mt-3 p-4 bg-muted/30 border border-border rounded-xl space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">
                              Select payment option:
                            </p>
                            <div className="space-y-2">
                              {payment.gateways.map((gw) => (
                                <button
                                  key={gw.id}
                                  onClick={() => setSelectedGatewayId(gw.id)}
                                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                    selectedGatewayId === gw.id
                                      ? "border-primary bg-primary/5"
                                      : "border-border bg-background hover:border-primary/40"
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selectedGatewayId === gw.id ? "border-primary bg-primary" : "border-muted-foreground"}`}
                                  />
                                  <div className="text-left flex-1">
                                    <p className="font-semibold text-sm">
                                      {gw.userDisplayConfig.label ||
                                        gw.displayName}
                                    </p>
                                    {gw.userDisplayConfig.description && (
                                      <p className="text-xs text-muted-foreground">
                                        {gw.userDisplayConfig.description}
                                      </p>
                                    )}
                                    {gw.supportedMethods.length > 0 && (
                                      <div className="flex gap-1 mt-1 flex-wrap">
                                        {gw.supportedMethods
                                          .slice(0, 4)
                                          .map((m) => (
                                            <span
                                              key={m}
                                              className="text-[10px] bg-muted px-1.5 py-0.5 rounded"
                                            >
                                              {m}
                                            </span>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                  {gw.mode === "test" && (
                                    <span className="text-[10px] text-orange-500 border border-orange-500/30 px-1.5 py-0.5 rounded">
                                      Test
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Single gateway info — no selector needed */}
                      {paymentMethod === "online" &&
                        payment.gateways.length === 1 && (
                          <div className="mt-2 px-4 py-2 bg-muted/30 rounded-xl">
                            <p className="text-xs text-muted-foreground">
                              {payment.gateways[0].userDisplayConfig
                                .description || "Secure online payment"}
                            </p>
                            {payment.gateways[0].supportedMethods.length >
                              0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {payment.gateways[0].supportedMethods.map(
                                  (m) => (
                                    <span
                                      key={m}
                                      className="text-[10px] bg-muted px-1.5 py-0.5 rounded"
                                    >
                                      {m}
                                    </span>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}

                {/* Neither enabled — admin hasn't configured */}
                {!payment.codEnabled &&
                  (!payment.onlinePaymentEnabled ||
                    payment.gateways.length === 0) && (
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                      <p className="text-sm text-orange-600 font-semibold">
                        Payment options not available
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Please contact support to complete your order.
                      </p>
                    </div>
                  )}
              </div>

              {/* CARD DETAILS FORM — only shown when online selected */}
              {paymentMethod === "online" && (
                <div className="mt-4 p-5 bg-muted/30 border border-border rounded-xl space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock size={14} className="text-green-600" />
                    <span className="text-xs text-muted-foreground font-medium">
                      100% Secure Payment
                    </span>
                  </div>

                  {/* Card Number */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        value={cardDetails.number}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 16);
                          const formatted = val
                            .replace(/(.{4})/g, "$1 ")
                            .trim();
                          setCardDetails((p) => ({ ...p, number: formatted }));
                        }}
                        className={`w-full h-11 px-4 pr-12 bg-background border rounded-xl text-sm outline-none font-mono tracking-wider ${
                          cardErrors.number
                            ? "border-destructive"
                            : "border-border focus:border-primary"
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                        {cardDetails.number.startsWith("4") && (
                          <span className="text-blue-600 text-xs font-bold">
                            VISA
                          </span>
                        )}
                        {cardDetails.number.startsWith("5") && (
                          <span className="text-red-600 text-xs font-bold">
                            MC
                          </span>
                        )}
                      </div>
                    </div>
                    {cardErrors.number && (
                      <p className="text-xs text-destructive mt-1">
                        {cardErrors.number}
                      </p>
                    )}
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name as on card"
                      value={cardDetails.name}
                      onChange={(e) =>
                        setCardDetails((p) => ({
                          ...p,
                          name: e.target.value.toUpperCase(),
                        }))
                      }
                      className={`w-full h-11 px-4 bg-background border rounded-xl text-sm outline-none uppercase tracking-wide ${
                        cardErrors.name
                          ? "border-destructive"
                          : "border-border focus:border-primary"
                      }`}
                    />
                    {cardErrors.name && (
                      <p className="text-xs text-destructive mt-1">
                        {cardErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Expiry + CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1.5 block">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        maxLength={7}
                        value={cardDetails.expiry}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4);
                          const formatted =
                            val.length > 2
                              ? val.slice(0, 2) + " / " + val.slice(2)
                              : val;
                          setCardDetails((p) => ({ ...p, expiry: formatted }));
                        }}
                        className={`w-full h-11 px-4 bg-background border rounded-xl text-sm outline-none font-mono ${
                          cardErrors.expiry
                            ? "border-destructive"
                            : "border-border focus:border-primary"
                        }`}
                      />
                      {cardErrors.expiry && (
                        <p className="text-xs text-destructive mt-1">
                          {cardErrors.expiry}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1.5 block">
                        CVV
                      </label>
                      <div className="relative">
                        <input
                          type={showCvv ? "text" : "password"}
                          placeholder="•••"
                          maxLength={4}
                          value={cardDetails.cvv}
                          onChange={(e) =>
                            setCardDetails((p) => ({
                              ...p,
                              cvv: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 4),
                            }))
                          }
                          className={`w-full h-11 px-4 pr-10 bg-background border rounded-xl text-sm outline-none font-mono ${
                            cardErrors.cvv
                              ? "border-destructive"
                              : "border-border focus:border-primary"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCvv(!showCvv)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showCvv ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {cardErrors.cvv && (
                        <p className="text-xs text-destructive mt-1">
                          {cardErrors.cvv}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* UPI Option */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-muted/30 px-3 text-xs text-muted-foreground">
                        OR
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      placeholder="yourname@upi"
                      value={cardDetails.upi}
                      onChange={(e) =>
                        setCardDetails((p) => ({ ...p, upi: e.target.value }))
                      }
                      className="w-full h-11 px-4 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary"
                    />
                    {cardErrors.upi && (
                      <p className="text-xs text-destructive mt-1">
                        {cardErrors.upi}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setCurrentStep(1)}
                >
                  ← Back
                </Button>
                <Button
                  className="rounded-xl flex-1"
                  onClick={() => setCurrentStep(3)}
                >
                  Continue to Review →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Place Order */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Review Your Order</h2>

              {/* Delivery Address Card */}
              <div className="bg-muted/30 border border-border rounded-2xl p-4 mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="size-4 text-primary" />
                      <span className="text-sm font-semibold">Delivery To</span>
                    </div>
                    <p className="text-sm font-medium">
                      {selectedAddress?.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAddress?.addressLine1}
                      {selectedAddress?.addressLine2 &&
                        `, ${selectedAddress.addressLine2}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedAddress?.city}, {selectedAddress?.state} -{" "}
                      {selectedAddress?.pincode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      📞 {selectedAddress?.phone}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                  >
                    Change
                  </Button>
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-muted/30 border border-border rounded-2xl p-4 mb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {paymentMethod === "cod" ? (
                      <Banknote className="size-4 text-primary" />
                    ) : (
                      <CreditCard className="size-4 text-primary" />
                    )}
                    <span className="text-sm font-semibold">
                      {paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : `Online Payment - ${selectedGateway?.displayName || "Payment Gateway"}`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(2)}
                  >
                    Change
                  </Button>
                </div>
              </div>

              {/* Items */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-sm font-semibold mb-3">
                  Items ({items.length})
                </h3>
                {items.map((item: CartItem) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 py-2 border-b last:border-0"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted/50 relative flex-shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-1">{item.name}</p>
                      {/* Show variant info in review */}
                      {item.variantCombination &&
                        item.variantCombination.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.variantCombination
                              .map((c) => `${c.name}: ${c.value}`)
                              .join(", ")}
                          </p>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ×{item.quantity}
                    </span>
                    <span className="text-sm font-medium">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Terms */}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                By placing this order, you agree to our Terms & Conditions and
                Privacy Policy.
              </p>

              {/* Place Order Button */}
              <Button
                className="w-full rounded-xl mt-4"
                size="lg"
                disabled={isPlacingOrder}
                onClick={handlePlaceOrder}
              >
                {isPlacingOrder ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Placing Order...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Place Order — ₹{total.toLocaleString("en-IN")}
                  </>
                )}
              </Button>

              {/* Back Button */}
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={() => setCurrentStep(2)}
              >
                ← Back to Payment
              </Button>
            </div>
          )}
        </div>

        {/* Right - Order Summary (Sticky) */}
        <div className="col-span-1">
          <div className="sticky top-6">
            <OrderSummary
              items={items}
              couponCode={appliedCoupon?.code}
              couponDiscount={appliedCoupon?.discount}
              onCouponApply={currentStep === 1 ? handleCouponApply : undefined}
              onCouponRemove={
                currentStep === 1 ? () => setAppliedCoupon(null) : undefined
              }
              showCouponInput={currentStep === 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={step} className="flex items-center">
            <div className="flex items-center flex-col">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2
                  ${
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-background border-border text-muted-foreground"
                  }
                `}
              >
                {isCompleted ? <Check className="size-4" /> : stepNum}
              </div>
              <span
                className={`text-xs mt-1 text-center ${isCurrent || isCompleted ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                {step}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${stepNum < currentStep ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
