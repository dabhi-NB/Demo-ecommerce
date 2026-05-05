"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import RecaptchaWidget from "@/app/common/recaptcha";
import { useAppSettings } from "@/hooks/useAppSettings";
import ResendOtp from "@/app/common/resendotp";

const ForgotPassword = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");

  const { googleRecaptchaEnabled, googleRecaptchaPublicKey } = useAppSettings();

  const formStep1 = useForm<{ email: string }>({
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const formStep2 = useForm<{ otp: string }>({
    defaultValues: { otp: "" },
    mode: "onSubmit",
  });

  const formStep3 = useForm<{ password: string; passwordConfirm: string }>({
    defaultValues: { password: "", passwordConfirm: "" },
    mode: "onSubmit",
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: any) => authService.forgotPassword(payload),
    onSuccess: (res) => {
      if (!res.status) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);

      if (res.next === "step_2") setStep(2);
      if (res.next === "step_3") setStep(3);
      if (res.next === "redirect" && res.url) {
        window.location.href = res.url;
      }
    },
    onError: (err: any) => toast.error(err?.message || "Something went wrong"),
  });
  const handleBackToPassword = () => {
    router.push("/auth/login");
  };
  const handleStep1 = (values: { email: string }) => {
    if (googleRecaptchaEnabled && !recaptchaToken) {
      toast.error("Please complete the captcha verification");
      return;
    }

    setEmail(values.email);
    const payload: any = { email: values.email, step: 1 };
    if (googleRecaptchaEnabled && recaptchaToken) {
      payload["g-recaptcha-response"] = recaptchaToken;
    }
    forgotPasswordMutation.mutate(payload);
  };

  const handleStep2 = (values: { otp: string }) => {
    setOtp(values.otp);
    forgotPasswordMutation.mutate({ email, otp: values.otp, step: 2 });
  };

  const handleStep3 = (values: {
    password: string;
    passwordConfirm: string;
  }) => {
    setPassword(values.password);
    setPasswordConfirm(values.passwordConfirm);
    forgotPasswordMutation.mutate({
      email,
      otp,
      password: values.password,
      password_confirm: values.passwordConfirm,
      step: 3,
    });
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-2">Forgot Password? 🔒</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Enter your email and we'll send you instructions to reset your password
      </p>
      {step === 1 && (
        <Form
          form={formStep1}
          onSubmit={formStep1.handleSubmit(handleStep1)}
          className="space-y-4"
        >
          <FormItem>
            <FormLabel>
              Email <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Enter your email"
                {...formStep1.register("email", {
                  required: "Email is required",
                })}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          {googleRecaptchaEnabled && googleRecaptchaPublicKey && (
            <RecaptchaWidget onVerify={setRecaptchaToken} />
          )}

          <Button type="submit" className="w-full">
            {forgotPasswordMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Send OTP"
            )}
          </Button>
        </Form>
      )}

      {step === 2 && (
        <Form
          form={formStep2}
          onSubmit={formStep2.handleSubmit(handleStep2)}
          className="space-y-4"
        >
          <FormItem>
            <FormLabel>
              OTP <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Enter OTP"
                {...formStep2.register("otp", {
                  required: "OTP is required",
                })}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <ResendOtp type="forgot_password" code={btoa(email)} />

          <Button type="submit" className="w-full">
            {forgotPasswordMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Verify OTP"
            )}
          </Button>
        </Form>
      )}

      {step === 3 && (
        <Form
          form={formStep3}
          onSubmit={formStep3.handleSubmit(handleStep3)}
          className="space-y-4"
        >
          <FormItem>
            <FormLabel>
              New Password <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <PasswordInput
                placeholder="Enter new password"
                {...formStep3.register("password", {
                  required: "Password is required",
                })}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel>
              Confirm Password <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <PasswordInput
                placeholder="Confirm new password"
                {...formStep3.register("passwordConfirm", {
                  required: "Confirmation is required",
                })}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <Button type="submit" className="w-full">
            {forgotPasswordMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Reset Password"
            )}
          </Button>
        </Form>
      )}
      <p
        onClick={handleBackToPassword}
        className="text-sm text-center mt-2 cursor-pointer"
      >
        <i className="fa fa-long-arrow-left" aria-hidden="true"></i>
        &lt; Back to login
      </p>
    </>
  );
};

export default ForgotPassword;
