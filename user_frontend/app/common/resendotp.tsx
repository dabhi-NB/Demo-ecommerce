import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";

type ResendOtpProps = {
  type: string;
  code: string;
};

export default function ResendOtp({ type, code }: ResendOtpProps) {
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60); // Start with 60 seconds

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const res = await authService.resendOtp({
        type,
        code,
      });

      if (res?.status === 1) {
        toast.success(res.message || "OTP resent to your email");
        setCountdown(60); // Start 60 second countdown again
      } else {
        toast.error(res?.message || "Failed to resend OTP");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const isDisabled = resendLoading || countdown > 0;

  return (
    <p className="text-muted-foreground text-center text-sm">
      Didn't get the code?{" "}
      <button
        type="button"
        className="underline text-primary bg-transparent border-none p-0 cursor-pointer disabled:opacity-50"
        onClick={handleResend}
        disabled={isDisabled}
      >
        {resendLoading
          ? "Resending..."
          : countdown > 0
            ? `Resend OTP in ${countdown}s`
            : "Resend OTP"}
      </button>
    </p>
  );
}
