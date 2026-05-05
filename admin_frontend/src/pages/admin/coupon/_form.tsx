import { useState, useEffect, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createCoupon,
  updateCoupon,
  getCouponById,
} from "@/services/coupon.service";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CouponFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: (data?: any) => void;
  onError?: () => void;
}

const CouponForm = forwardRef<any, CouponFormProps>(
  ({ isEdit, id, onSuccess }, _ref) => {
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEdit);

    const form = useForm({
      defaultValues: {
        code: "",
        description: "",
        discountType: "percentage" as "percentage" | "fixed",
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscount: null as number | null,
        usageLimit: null as number | null,
        validFrom: "",
        validUntil: "",
        isActive: true,
      },
      mode: "onSubmit",
    });

    const { watch } = form;
    const discountType = watch("discountType");

    useEffect(() => {
      if (isEdit && id) {
        fetchCoupon(id);
      }
    }, [id, isEdit]);

    const fetchCoupon = async (couponId: string) => {
      try {
        setLoading(true);
        const coupon = await getCouponById(couponId);

        form.reset({
          code: coupon.code ?? "",
          description: coupon.description ?? "",
          discountType: coupon.discountType ?? "percentage",
          discountValue: coupon.discountValue ?? 0,
          minOrderAmount: coupon.minOrderAmount ?? 0,
          maxDiscount: coupon.maxDiscount ?? null,
          usageLimit: coupon.usageLimit ?? null,
          validFrom: coupon.validFrom
            ? new Date(coupon.validFrom).toISOString().split("T")[0]
            : "",
          validUntil: coupon.validUntil
            ? new Date(coupon.validUntil).toISOString().split("T")[0]
            : "",
          isActive: coupon.isActive ?? true,
        });
      } catch (error: any) {
        console.error("Error fetching coupon:", error.message);
        toast.error(error.message || "Failed to load coupon data");
      } finally {
        setLoading(false);
      }
    };

    const onSubmit = async (values: any) => {
      try {
        setSubmitting(true);

        const payload = {
          code: values.code.toUpperCase(),
          description: values.description || "",
          discountType: values.discountType,
          discountValue: values.discountValue,
          minOrderAmount: values.minOrderAmount || 0,
          maxDiscount: values.maxDiscount || null,
          usageLimit: values.usageLimit || null,
          validFrom: values.validFrom,
          validUntil: values.validUntil,
          isActive: values.isActive,
        };

        let response;
        if (isEdit && id) {
          response = await updateCoupon(id, payload);
        } else {
          response = await createCoupon(payload);
        }

        if (response?.status === 1) {
          toast.success(
            response.message ||
              `Coupon ${isEdit ? "updated" : "created"} successfully`,
          );
          onSuccess(isEdit ? id : response.data);
        } else {
          toast.error(
            response.message ||
              `Failed to ${isEdit ? "update" : "create"} coupon`,
          );
        }
      } catch (error: any) {
        console.error(
          `Error ${isEdit ? "updating" : "creating"} coupon:`,
          error,
        );
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isEdit ? "update" : "create"} coupon`;
        toast.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    };

    if (loading) {
      return <div className="text-center py-10">Loading...</div>;
    }

    const discountValueSuffix = discountType === "percentage" ? "%" : "₹";

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="code"
              rules={{
                required: "Code is required",
                pattern: {
                  value: /^[A-Za-z0-9-]+$/,
                  message: "Only alphanumeric and dashes allowed",
                },
              }}
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    Coupon Code <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SAVE20"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Summer sale discount"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>
                    Discount Type <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="percentage" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Percentage (%)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="fixed" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Fixed Amount (₹)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountValue"
              rules={{
                required: "Discount value is required",
                validate: (value) => {
                  if (!value || value <= 0) {
                    return "Value must be greater than 0";
                  }
                  if (
                    discountType === "percentage" &&
                    (value < 1 || value > 100)
                  ) {
                    return "Percentage must be between 1 and 100";
                  }
                  return true;
                },
              }}
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    Discount Value <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder={
                          discountType === "percentage" ? "20" : "100"
                        }
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        value={field.value || ""}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {discountValueSuffix}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="minOrderAmount"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Min Order Amount (₹)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        value={field.value || 0}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₹
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            {discountType === "percentage" && (
              <FormField
                control={form.control}
                name="maxDiscount"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Max Discount (₹)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="500"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            )
                          }
                          value={field.value ?? ""}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          ₹
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="usageLimit"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Usage Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Leave empty for unlimited usage
                  </p>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable this coupon
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="validFrom"
              rules={{ required: "Valid from date is required" }}
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    Valid From <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="validUntil"
              rules={{
                required: "Valid until date is required",
                validate: (value) => {
                  const validFrom = form.getValues("validFrom");
                  if (validFrom && value < validFrom) {
                    return "Valid until must be after valid from";
                  }
                  return true;
                },
              }}
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    Valid Until <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update Coupon"
              ) : (
                "Create Coupon"
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  },
);

CouponForm.displayName = "CouponForm";

export default CouponForm;
