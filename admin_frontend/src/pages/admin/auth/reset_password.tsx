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
import { useNavigate, useLocation } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};
  const email = navState.email || "";
  const userId = navState.userId || "";
  const otp = navState.otp || "";

  const form = useForm({
    defaultValues: { password: "", password_confirm: "" },
    mode: "onSubmit",
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: any) => authService.passwordForgotProcess(payload),
    onSuccess: (res) => {
      if (res.status === 1) {
        navigate("/");
      }
    },
  });

  const handleSubmit = (values: {
    password: string;
    password_confirm: string;
  }) => {
    resetPasswordMutation.mutate({
      email,
      userId,
      otp,
      password: values.password,
      password_confirm: values.password_confirm,
      step: 3,
    });
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-1">Reset Password</h2>
        <p className="text-muted-foreground mb-4">
          Enter your new password below.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            rules={{
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            }}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  New Password <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    aria-invalid={!!fieldState.error}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password_confirm"
            rules={{
              required: "Confirm password is required",
              validate: (value) =>
                value === form.getValues("password") ||
                "Passwords do not match",
            }}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Confirm Password <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    aria-invalid={!!fieldState.error}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            {resetPasswordMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Reset Password"
            )}
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
    </>
  );
};

export default ResetPassword;
