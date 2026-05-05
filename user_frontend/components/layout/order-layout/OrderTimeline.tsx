"use client";

import {
  PackageOpen,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface OrderTimelineProps {
  timeline: Array<{ status: string; time: string; note?: string }>;
  currentStatus: string;
}

const STANDARD_STEPS = ["placed", "confirmed", "shipped", "delivered"] as const;

const stepIcons: Record<string, LucideIcon> = {
  placed: PackageOpen,
  confirmed: CheckCircle2,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
};

const stepLabels: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Order Confirmed",
  shipped: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Order Cancelled",
};

export function OrderTimeline({ timeline, currentStatus }: OrderTimelineProps) {
  const timelineStatuses = timeline.map((t) => t.status);

  // Determine which steps to show
  let stepsToShow: string[];
  if (currentStatus === "cancelled") {
    stepsToShow = ["placed", "cancelled"];
  } else {
    stepsToShow = [...STANDARD_STEPS];
  }

  return (
    <div className="space-y-0">
      {stepsToShow.map((step, index) => {
        const isCompleted = timelineStatuses.includes(step);
        const isCurrent = step === currentStatus;
        const isFuture = !isCompleted && !isCurrent;
        const isLast = index === stepsToShow.length - 1;

        const Icon = stepIcons[step];

        // Icon circle classes
        let iconCircleClass = "";
        if (isCompleted) {
          iconCircleClass = "bg-primary text-primary-foreground";
        } else if (isCurrent) {
          iconCircleClass =
            "bg-primary/20 border-2 border-primary text-primary";
        } else {
          iconCircleClass =
            "bg-muted border border-border text-muted-foreground";
        }

        // Line classes
        const lineClass = isCompleted ? "bg-primary" : "bg-border";

        // Label classes
        let labelClass = "text-sm font-medium";
        if (isCompleted || isCurrent) {
          labelClass += " text-foreground";
        } else {
          labelClass += " text-muted-foreground";
        }

        // Get time and note from timeline
        const timelineItem = timeline.find((t) => t.status === step);

        return (
          <div key={step} className="flex gap-4 relative">
            {/* Left - Icon column */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconCircleClass}`}
              >
                <Icon size={18} />
              </div>
              {/* Vertical line */}
              {!isLast && (
                <div className={`flex-1 w-px ${lineClass} mt-1 min-h-[2rem]`} />
              )}
            </div>

            {/* Right - Content */}
            <div className="pb-6">
              <p className={labelClass}>{stepLabels[step]}</p>
              {isCompleted && timelineItem && (
                <>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(timelineItem.time).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {timelineItem.note && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">
                      {timelineItem.note}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default OrderTimeline;
