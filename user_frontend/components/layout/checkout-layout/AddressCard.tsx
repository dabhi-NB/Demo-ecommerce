"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { ShippingAddress } from "@/services/order.service";

interface AddressCardProps {
  address: ShippingAddress & { _id?: string };
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function AddressCard({
  address,
  isSelected = false,
  onSelect,
  onDelete,
  showActions = true,
}: AddressCardProps) {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`border rounded-2xl p-4 cursor-pointer transition-all ${
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Left - Radio circle */}
        <div
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
            isSelected ? "border-primary bg-primary" : "border-border"
          }`}
        >
          {isSelected && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
        </div>

        {/* Center - Address details */}
        <div className="flex-1">
          <p className="font-semibold text-sm">{address.fullName}</p>
          <p className="text-xs text-muted-foreground">{address.phone}</p>
          <p className="text-sm mt-1">
            {address.addressLine1}
            {address.addressLine2 && `, ${address.addressLine2}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {address.city}, {address.state} — {address.pincode}
          </p>
        </div>

        {/* Right - Delete action */}
        {showActions && address._id && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive w-8 h-8"
                onClick={handleDeleteClick}
              >
                <Trash2 size={16} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Address</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this address? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

export default AddressCard;
