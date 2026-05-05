"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShippingAddress } from "@/services/order.service";

interface AddressFormProps {
  onSubmit: (data: ShippingAddress) => Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<ShippingAddress>;
  isLoading?: boolean;
  submitLabel?: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
];

type FormData = ShippingAddress;

export function AddressForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
  submitLabel,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
      ...defaultValues,
    },
  });

  const selectedState = watch("state");

  const onFormSubmit = async (data: FormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="Enter full name"
            className="rounded-xl"
            {...register("fullName", {
              required: "Full name is required",
              minLength: {
                value: 2,
                message: "Minimum 2 characters required",
              },
            })}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive mt-1">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="Enter 10-digit mobile number"
            className="rounded-xl"
            {...register("phone", {
              required: "Phone number is required",
              pattern: {
                value: /^[6-9]\d{9}$/,
                message: "Enter valid 10-digit mobile number",
              },
            })}
          />
          {errors.phone && (
            <p className="text-xs text-destructive mt-1">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Address Line 1 */}
        <div className="col-span-2 space-y-1">
          <Label htmlFor="addressLine1">Address Line 1</Label>
          <Input
            id="addressLine1"
            placeholder="Enter street address"
            className="rounded-xl"
            {...register("addressLine1", {
              required: "Address is required",
              minLength: {
                value: 10,
                message: "Minimum 10 characters required",
              },
            })}
          />
          {errors.addressLine1 && (
            <p className="text-xs text-destructive mt-1">
              {errors.addressLine1.message}
            </p>
          )}
        </div>

        {/* Address Line 2 */}
        <div className="col-span-2 space-y-1">
          <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
          <Input
            id="addressLine2"
            placeholder="Enter landmark, area, etc."
            className="rounded-xl"
            {...register("addressLine2")}
          />
        </div>

        {/* City */}
        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="Enter city"
            className="rounded-xl"
            {...register("city", {
              required: "City is required",
            })}
          />
          {errors.city && (
            <p className="text-xs text-destructive mt-1">
              {errors.city.message}
            </p>
          )}
        </div>

        {/* State */}
        <div className="space-y-1">
          <Label htmlFor="state">State</Label>
          <input type="hidden" {...register("state", { required: "State is required" })} />
          <Select
            value={selectedState}
            onValueChange={(value) => setValue("state", value, { shouldValidate: true })}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-xs text-destructive mt-1">
              {errors.state.message}
            </p>
          )}
        </div>

        {/* Pincode */}
        <div className="space-y-1">
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            placeholder="Enter 6-digit pincode"
            className="rounded-xl"
            maxLength={6}
            {...register("pincode", {
              required: "Pincode is required",
              pattern: {
                value: /^\d{6}$/,
                message: "Enter valid 6-digit pincode",
              },
            })}
          />
          {errors.pincode && (
            <p className="text-xs text-destructive mt-1">
              {errors.pincode.message}
            </p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="rounded-xl"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel || "Save Address"}
        </Button>
      </div>
    </form>
  );
}

export default AddressForm;
