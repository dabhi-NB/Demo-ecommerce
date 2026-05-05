import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

type OtpFormData = { otp: string };

const VerifyPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const navState = location.state || {};
  const email = navState.email || "";
  const userId = navState.userId || (user ? user.user_id : "");
  const phone = navState.phone || "";
  const type =
    navState.type ||
    (user ? "login" : email ? "forgot_password" : phone ? "update" : "");

  const form = useForm<OtpFormData>({ defaultValues: { otp: "" } });
  const { handleSubmit, control, reset, watch } = form;

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const onSubmit = async (data: OtpFormData) => {
    if (!userId) {
      toast.error("User not found. Please login again.");
      navigate("/");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = { otp: data.otp, type, userId };
      if (email) payload.email = email;
      if (phone) payload.phone = phone;

      const response = await authService.verifyOtp(payload);
      if (response.status === 1) {
        toast.success(response.message || "OTP verified successfully");
        if (type === "login") {
          navigate("/admin/dashboard");
        } else if (type === "forgot_password") {
          navigate("/auth/reset-password", {
            state: { email, userId, otp: data.otp },
          });
        } else {
          navigate("/");
        }
      } else toast.error(response.message || "Invalid OTP");
    } catch {
      toast.error("OTP verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResendLoading(true);
    try {
      let response;
      if (type === "login" && userId) {
        response = await authService.resendOtp({ userId });
      } else if (type === "forgot_password" && email) {
        // @ts-expect-error: resend is not in the type but is handled by backend
        response = await authService.forgotPassword({ email, resend: true });
      } else if (type === "update" && userId) {
        response = await authService.resendOtp({ userId });
      } else {
        toast.error("User not found. Please login again.");
        navigate("/");
        return;
      }
      if (response.status === 1) {
        toast.success("OTP sent successfully");
        setResendTimer(60);
        reset({ otp: "" });
      } else toast.error(response.message || "Failed to resend OTP");
    } catch {
      toast.error("Server error");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h4 className="text-xl font-semibold text-center pt-2">
          Two Step Verification
        </h4>
        <p className="text-center text-muted-foreground">
          OTP has been sent to your email address.
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
                <InputOTP
                  maxLength={6}
                  value={field.value}
                  onChange={field.onChange}
                  containerClassName="flex items-center gap-2 w-full justify-center"
                >
                  <InputOTPGroup className="w-full flex justify-between gap-2">
                    <InputOTPSlot index={0} className="flex-1 min-w-0" />
                    <InputOTPSlot index={1} className="flex-1 min-w-0" />
                    <InputOTPSeparator />
                    <InputOTPSlot index={2} className="flex-1 min-w-0" />
                    <InputOTPSlot index={3} className="flex-1 min-w-0" />
                    <InputOTPSeparator />
                    <InputOTPSlot index={4} className="flex-1 min-w-0" />
                    <InputOTPSlot index={5} className="flex-1 min-w-0" />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-center text-sm text-muted-foreground">
          Didn't get the code?{" "}
          <button
            type="button"
            disabled={resendTimer > 0 || resendLoading}
            onClick={handleResend}
            className="underline text-primary disabled:opacity-50"
          >
            {resendLoading
              ? "Resending..."
              : resendTimer > 0
                ? `Resend OTP in ${resendTimer}s`
                : "Resend OTP"}
          </button>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || watch("otp").length !== 6}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>

        <div className=" text-center">
          <a
            href="/"
            className="text-blue-600 hover:underline flex items-center justify-center"
          >
            <span className="mr-1">&larr;</span> Back to login
          </a>
        </div>
      </form>
    </Form>
  );
};

export default VerifyPage;
