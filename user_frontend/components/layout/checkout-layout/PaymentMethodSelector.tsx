"use client";

import { Banknote, CreditCard } from "lucide-react";

interface PaymentMethodSelectorProps {
  selected: "cod" | "online";
  onChange: (method: "cod" | "online") => void;
  totalAmount: number;
}

export function PaymentMethodSelector({
  selected,
  onChange,
  totalAmount,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      {/* Cash on Delivery Card */}
      <div
        onClick={() => onChange("cod")}
        className={`border border-border rounded-2xl p-4 cursor-pointer transition-all ${
          selected === "cod"
            ? "border-primary bg-primary/5"
            : "hover:border-primary/30"
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Icon box */}
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <Banknote size={20} className="text-green-500" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <p className="font-semibold text-sm">Cash on Delivery</p>
            <p className="text-xs text-muted-foreground">
              Pay ₹{totalAmount.toLocaleString("en-IN")} when your order arrives
            </p>
          </div>

          {/* Radio circle */}
          <div
            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
              selected === "cod" ? "border-primary bg-primary" : "border-border"
            }`}
          >
            {selected === "cod" && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Online Payment Card */}
      <div
        onClick={() => onChange("online")}
        className={`border border-border rounded-2xl p-4 cursor-pointer transition-all ${
          selected === "online"
            ? "border-primary bg-primary/5"
            : "hover:border-primary/30"
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Icon box */}
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <CreditCard size={20} className="text-blue-500" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Online Payment</p>
              <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Recommended
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              UPI, Credit/Debit Card, Net Banking
            </p>
          </div>

          {/* Radio circle */}
          <div
            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
              selected === "online"
                ? "border-primary bg-primary"
                : "border-border"
            }`}
          >
            {selected === "online" && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </div>
        </div>

        {/* Additional message for online payment */}
        {selected === "online" && (
          <div className="bg-muted/50 rounded-xl px-4 py-2 mt-2 text-xs text-muted-foreground text-center">
            You&apos;ll be redirected to payment gateway after placing order
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentMethodSelector;
