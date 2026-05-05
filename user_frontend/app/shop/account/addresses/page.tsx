"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  getAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  ShippingAddress,
} from "@/services/order.service";
import { AddressCard } from "@/components/layout/checkout-layout/AddressCard";
import { AddressForm } from "@/components/layout/checkout-layout/AddressForm";
import AccountLayout from "@/components/layout/account-layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const MAX_ADDRESSES = 5;

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const data = await getAddresses();
        setAddresses(data);
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  // Handle add address
  const handleAdd = async (data: ShippingAddress) => {
    setIsAdding(true);
    try {
      await addAddress(data);
      const updatedAddresses = await getAddresses();
      setAddresses(updatedAddresses);
      setShowForm(false);
      toast.success("Address saved!");
    } catch (error) {
      toast.error("Failed to save address");
    } finally {
      setIsAdding(false);
    }
  };

  // Handle delete address
  const handleDelete = async (addressId: string) => {
    try {
      await deleteAddress(addressId);
      const updatedAddresses = await getAddresses();
      setAddresses(updatedAddresses);
      toast.success("Address deleted");
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  // Handle set default
  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
      const updatedAddresses = await getAddresses();
      setAddresses(updatedAddresses);
      toast.success("Default address updated");
    } catch (error) {
      toast.error("Failed to set default address");
    }
  };

  const canAddMore = addresses.length < MAX_ADDRESSES;

  return (
    <AccountLayout
      title="Saved Addresses"
      subtitle="Manage your delivery addresses"
    >
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        {/* Add New Address Button */}
        {canAddMore && (
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Address
          </Button>
        )}

        {/* Max addresses note */}
        {!canAddMore && (
          <p className="text-sm text-muted-foreground">
            Maximum 5 addresses allowed
          </p>
        )}

        {/* Address Form */}
        {showForm && (
          <div className="bg-muted/30 border border-border rounded-2xl p-5">
            <h3 className="text-base font-semibold mb-4">Add New Address</h3>
            <AddressForm
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
              submitLabel="Save Address"
              isLoading={isAdding}
            />
          </div>
        )}

        {/* Address Cards */}
        <div className="space-y-3">
          {loading && (
            <>
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </>
          )}

          {!loading && addresses.length === 0 && !showForm && (
            <p className="text-muted-foreground text-sm text-center py-8">
              No saved addresses. Add one to get started.
            </p>
          )}

          {!loading &&
            addresses.map((address) => (
              <div key={address._id}>
                <AddressCard
                  address={address}
                  showActions={true}
                  onDelete={() => address._id && handleDelete(address._id)}
                />
                {address.isDefault ? (
                  <p className="text-xs text-primary mt-1">✓ Default address</p>
                ) : (
                  address._id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-auto p-0 mt-1 text-muted-foreground hover:text-primary"
                      onClick={() => handleSetDefault(address._id!)}
                    >
                      Set as Default
                    </Button>
                  )
                )}
              </div>
            ))}
        </div>
      </div>
    </AccountLayout>
  );
}
