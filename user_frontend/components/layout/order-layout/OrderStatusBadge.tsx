"use client";

import {
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  XCircle,
  RotateCcw,
  LucideIcon,
} from "lucide-react";

interface OrderStatusBadgeProps {
  status: string;
  size?: "sm" | "default";
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: LucideIcon }
> = {
  placed: {
    label: "Order Placed",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    icon: CheckCircle,
  },
  shipped: {
    label: "Shipped",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    className: "bg-green-500/10 text-green-600 border-green-500/20",
    icon: PackageCheck,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: XCircle,
  },
  returned: {
    label: "Returned",
    className: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    icon: RotateCcw,
  },
};

export function OrderStatusBadge({
  status,
  size = "default",
}: OrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.placed;
  const Icon = config.icon;
  const sizeClass =
    size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-3 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.className} ${sizeClass}`}
    >
      <Icon size={size === "sm" ? 10 : 12} />
      {config.label}
    </span>
  );
}

export default OrderStatusBadge;
