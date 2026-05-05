import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import RecaptchaWidget from "../common/recaptcha";
import { toast } from "sonner";
import { useAppSettings } from "@/hooks/useAppSettings";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [recaptchaToken, setRecaptchaToken] = useState("");

  const { googleRecaptchaEnabled } = useAppSettings();

  const form = useForm<{ email: string }>({
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: any) => authService.forgotPassword(payload),
    onSuccess: (res) => {
      if (res.status === 1) {
        const navState: any = { email: form.getValues("email") };
        if (res.userId) navState.userId = res.userId;
        navigate("/auth/verify", { state: navState });
      }
    },
  });

  const handleSubmitEmail = (values: { email: string }) => {
    if (googleRecaptchaEnabled && !recaptchaToken) {
      toast.error("Please complete the captcha verification");
      return;
    }

    const payload: any = { email: values.email, step: 1 };
    if (googleRecaptchaEnabled && recaptchaToken) {
      payload["g-recaptcha-response"] = recaptchaToken;
    }

    forgotPasswordMutation.mutate(payload);
  };

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold mb-2">Forgot Password? 🔒</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Enter your email and we'll send you instructions to reset your
          password.
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmitEmail)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="email"
            rules={{ required: "Email is required" }}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Email <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    aria-invalid={!!fieldState.error}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <RecaptchaWidget onVerify={setRecaptchaToken} isPublic={true} />

          <Button type="submit" className="w-full">
            {forgotPasswordMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Send OTP"
            )}
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center">
        <a
          href="/"
          className="text-blue-600 hover:underline flex items-center justify-center"
        >
          <span className="mr-1">&larr;</span> Back to login
        </a>
      </div>
    </>
  );
};

export default ForgotPassword;
