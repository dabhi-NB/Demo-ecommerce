"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import ResendOtp from "../../common/resendotp";

type OtpFormData = {
  otp: string;
  skip_tfa?: boolean;
  type?: string;
  ignore_device?: boolean;
};

export default function Verify({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout, login } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(true); // Assume OTP already sent

  // Check if this is account verification without code - redirect to correct page
  useEffect(() => {
    const type = searchParams.get("type");
    const code = searchParams.get("code");
    if (type === "verify_account" && !code) {
      const storedCode = localStorage.getItem("verifyUrl");
      if (storedCode) {
        router.replace(`/auth/verify-account?code=${storedCode}`);
      } else {
        toast.error("Invalid verification link");
        router.push("/auth/login");
      }
    }
  }, [searchParams, router]);

  const form = useForm<OtpFormData>({
    defaultValues: {
      otp: "",
      skip_tfa: true,
    },
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  const onSubmit = async (values: OtpFormData) => {
    setIsSubmitting(true);
    try {
      const type = searchParams.get("type");
      let code = searchParams.get("code") || "";

      // For TFA verification, generate code from stored user data
      if (type === "tfa" && !code) {
        const tempUserData = localStorage.getItem("temp_user_data");
        if (tempUserData) {
          const user = JSON.parse(tempUserData);
          code = btoa(user.email); // Base64 encode the email
        }
      }

      const requestData = {
        otp: values.otp,
        code: code,
        type: type || undefined,
        ignore_device: values.ignore_device,
        device_uid: searchParams.get("device_uid") || undefined,
      };

      const res = await authService.verifyOtp(requestData);
      if (res?.status === 1) {
        if (type === "tfa") {
          // TFA verification - complete login
          const tempUserData = localStorage.getItem("temp_user_data");
          const authToken = res.data?.token; // Get token from API response

          if (tempUserData && authToken) {
            const user = JSON.parse(tempUserData);
            login(authToken, user);
            localStorage.removeItem("temp_user_data");
            toast.success(
              res.message || "Two-factor authentication successful",
            );
            router.push("/");
          } else {
            toast.error("Session expired. Please login again.");
            logout();
            router.push("/auth/login");
          }
        } else if (type === "account_update") {
          // Account update verification - redirect to login
          toast.success(res.message || "Account updated successfully");
          logout();
          router.push("/auth/login");
        } else {
          // Other account verification
          toast.success(res.message || "Account verified successfully");
          logout();
          router.push("/auth/login");
        }
      } else {
        toast.error(res?.message || "Invalid OTP");
      }
    } catch (err: any) {
      toast.error(err?.message || "Invalid OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form form={form} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h4 className="text-xl font-semibold text-center pt-2 mb-1">
          Two Step Verification
        </h4>
        <p className="text-center mb-4 text-muted-foreground">
          OTP is sent on your Email Address.
        </p>
        <FormField
          control={control}
          name="otp"
          rules={{
            required: "OTP is required",
            minLength: { value: 6, message: "OTP must be 6 digits" },
            maxLength: { value: 6, message: "OTP must be 6 digits" },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                OTP <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter OTP"
                  maxLength={6}
                  minLength={6}
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ResendOtp
          type="verify_account"
          code={
            searchParams.get("code") ||
            btoa(localStorage.getItem("verifyUrl") || "")
          }
        />
        {/* Show checkbox only for TFA verification */}
        {searchParams.get("type") === "tfa" && (
          <FormField
            control={control}
            name="ignore_device"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-4 w-4"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    ignore this device next time
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    You won't be asked for a verification code on this device
                    again.
                  </p>
                </div>
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            logout();
            if (onBack) onBack();
            else router.push("/auth/login");
          }}
        >
          Logout
        </Button>
      </Form>
    </>
  );
}
