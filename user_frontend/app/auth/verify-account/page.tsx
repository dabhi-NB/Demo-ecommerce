"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import ResendOtp from "@/app/common/resendotp";

type OtpFormData = { otp: string };

export default function VerifyAccount() {
  const params = useSearchParams();
  const router = useRouter();
  const [code, setCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>();

  useEffect(() => {
    const c = params.get("code");
    if (!c) {
      toast.error("Invalid verification link");
      router.push("/auth/register");
      return;
    }
    setCode(c);
  }, [params, router]);

  const onSubmit = async (data: OtpFormData) => {
    try {
      const res = await authService.verifyAccount({
        otp: data.otp,
        code,
      });

      if (res.status === 1) {
        toast.success(res.message);
        router.push("/auth/login");
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Verification failed");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-500 text-center">
          Enter the OTP sent to your email
        </p>

        <div>
          <label className="text-sm font-medium">
            OTP <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            maxLength={6}
            placeholder="Enter OTP"
            {...register("otp", {
              required: "OTP is required",
              minLength: { value: 6, message: "OTP must be 6 digits" },
            })}
          />
          <p className="text-red-500 text-sm mt-1">{errors.otp?.message}</p>
        </div>

        <Button type="submit" className="w-full">
          Verify
        </Button>

        <ResendOtp type="verify_account" code={code} />
      </form>
    </>
  );
}
