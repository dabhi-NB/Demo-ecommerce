import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createUserAddress, updateUserAddress } from "@/services/user-details.service";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: any;
  userId: string;
  onSuccess: () => void;
}

export function AddressDialog({ open, onOpenChange, address, userId, onSuccess }: AddressDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!address;

  const form = useForm({
    defaultValues: {
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: "",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (address) {
        form.reset({
          fullName: address.fullName || "",
          phone: address.phone || "",
          addressLine1: address.addressLine1 || "",
          addressLine2: address.addressLine2 || "",
          city: address.city || "",
          state: address.state || "",
          pincode: address.pincode || "",
          country: address.country || "",
          isDefault: address.isDefault || false,
        });
      } else {
        form.reset({
          fullName: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          pincode: "",
          country: "",
          isDefault: false,
        });
      }
    }
  }, [open, address, form]);

  const onSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      
      let response;
      if (isEdit && address._id) {
        response = await updateUserAddress(userId, address._id, values);
      } else {
        response = await createUserAddress(userId, values);
      }

      if (response?.status === 1) {
        toast.success(response.message || (isEdit ? "Address updated successfully" : "Address added successfully"));
        onSuccess();
      } else {
        toast.error(response.message || (isEdit ? "Failed to update address" : "Failed to add address"));
      }
    } catch (error: any) {
      console.error("Error saving address:", error);
      toast.error(error?.response?.data?.message || error?.message || (isEdit ? "Failed to update address" : "Failed to add address"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Address" : "Add Address"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                rules={{ required: "Full name is required" }}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                rules={{ required: "Phone is required" }}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Phone <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="addressLine1"
              rules={{ required: "Address is required" }}
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Address Line 1 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Street address" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Apartment, suite, etc. (optional)" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                rules={{ required: "City is required" }}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                rules={{ required: "State is required" }}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pincode"
                rules={{ required: "Pincode is required" }}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Pincode <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Pincode" {...field} />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                rules={{ required: "Country is required" }}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Country" {...field} />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4 mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Set as default address</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? "Updating..." : "Adding..."}
                  </>
                ) : isEdit ? (
                  "Update Address"
                ) : (
                  "Add Address"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

