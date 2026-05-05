import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useDeviceUid } from "@/hooks/useDeviceUid";
import RecaptchaWidget from "../../common/recaptcha";
import ResendOtp from "../../common/resendotp";
import { authService } from "@/services/auth.service";

type LoginWithOtpProps = {
  onBack?: () => void;
};

export default function LoginWithOtp({ onBack }: LoginWithOtpProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isAuthenticated, login } = useAuth();
  const [otpSent, setOtpSent] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [emailForVerification, setEmailForVerification] = useState("");

  const { googleRecaptchaEnabled, googleRecaptchaPublicKey } = useAppSettings();

  const deviceUid = useDeviceUid();

  const otpForm = useForm<{ email: string; otp: string }>({
    defaultValues: { email: "", otp: "" },
    mode: "onSubmit",
  });

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const otpMutation = useMutation({
    mutationFn: (payload: any) => authService.loginOtpProcess(payload),
    onSuccess: (data) => {
      if (data?.status === 1) {
        if (otpSent) {
          toast.success(data.message || "OTP verified successfully");
          login(data.data!.token, data.data!.user!);
          router.push("/");
        } else {
          toast.success(data.message || "OTP sent successfully");
          setOtpSent(true);
          setEmailForVerification(otpForm.getValues("email"));
          // Keep captcha token for resend functionality
          otpForm.reset({ otp: "" });
        }
      } else {
        toast.error(data.message || "OTP failed");
      }
    },
    onError: (err: any) =>
      toast.error(err?.response?.message || err?.message || "OTP failed"),
  });

  const handleBackToPassword = () => {
    setOtpSent(false);
    setRecaptchaToken("");
    otpForm.reset({ email: "", otp: "" });
    if (onBack) {
      onBack();
    } else {
      router.push("/auth/login");
    }
  };

  const handleSendOtp = (rawEmail: string) => {
    const email = rawEmail.trim();

    if (!email) {
      toast.error("Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Enter a valid email address");
      return;
    }

    // Only require captcha for initial send
    if (googleRecaptchaEnabled && !recaptchaToken) {
      toast.error("Please complete the captcha verification");
      return;
    }

    // Use loginOtpProcess for initial send
    const payload: any = {
      email,
      step: 1,
      device_uid: deviceUid,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    // Only send captcha token for initial send
    if (googleRecaptchaEnabled && recaptchaToken) {
      payload["g-recaptcha-response"] = recaptchaToken;
    }

    otpMutation.mutate(payload);
  };

  const handleVerifyOtp = (values: { email: string; otp: string }) => {
    otpMutation.mutate({
      email: emailForVerification.trim(),
      otp: values.otp,
      step: 2,
      device_uid: deviceUid,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  return (
    <>
      <Form
        form={otpForm}
        onSubmit={otpForm.handleSubmit((values) => {
          if (!otpSent) {
            handleSendOtp(values.email);
          } else {
            handleVerifyOtp(values);
          }
        })}
        className="space-y-4"
      >
        {!otpSent ? (
          <>
            <FormField
              control={otpForm.control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {googleRecaptchaEnabled && googleRecaptchaPublicKey && (
              <RecaptchaWidget onVerify={setRecaptchaToken} />
            )}

            <Button className="w-full" type="submit">
              {otpMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Send OTP"
              )}
            </Button>
          </>
        ) : (
          <>
            <FormField
              control={otpForm.control}
              name="otp"
              rules={{
                validate: (value) => {
                  if (!otpSent) return true;
                  if (!value) return "OTP is required";
                  return /^\d{4,6}$/.test(value) || "Enter a valid OTP";
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    OTP <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter OTP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ResendOtp
              type="verify_account"
              code={btoa(emailForVerification)}
            />
            <Button className="w-full" type="submit">
              {otpMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Verify OTP"
              )}
            </Button>
          </>
        )}
        <Button type="button" className="w-full" onClick={handleBackToPassword}>
          Login with Password
        </Button>
      </Form>
    </>
  );
}
