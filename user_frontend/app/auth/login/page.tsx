"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";
import type { LoginRequest } from "@/services/auth.service";
import General from "@/lib/general";
import LoginWithOtp from "./LoginWithOtp";

type LoginFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

type ApiError = {
  message?: string;
  data?: { message?: string; error?: string };
  error?: string;
};

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading, tfaEnabled } = useAuth();
  const [showOtp, setShowOtp] = useState(false);
  const [deviceUid, setDeviceUid] = useState("");
  const [savedFormValues, setSavedFormValues] =
    useState<LoginFormValues | null>(null);
  const [currentLoginValues, setCurrentLoginValues] =
    useState<LoginFormValues | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  useEffect(() => {
    const paramUid = searchParams.get("device_uid") || "";
    const storedUid = localStorage.getItem("device_uid") || "";
    const resolved = paramUid || storedUid || General.makeId(32);
    localStorage.setItem("device_uid", resolved);
    setDeviceUid(resolved);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.has("import")) {
      params.delete("import");
      router.replace(
        params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname,
      );
    }
  }, [searchParams, router]);

  const form = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "", remember: false },
    mode: "onSubmit",
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("saved_email");
    const savedPassword = localStorage.getItem("saved_password");
    if (savedEmail) form.setValue("email", savedEmail);
    if (savedPassword) form.setValue("password", savedPassword);
    if (savedEmail || savedPassword) form.setValue("remember", true);
  }, []);

  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: async (data) => {
      console.log("Login mutation onSuccess:", data);
      if (data?.status === 1 && data.data?.user) {
        if (data.data?.token) {
          // Set token temporarily
          localStorage.setItem("auth_token", data.data.token);

          // Check if TFA is required based on backend response
          if (
            data.data.next === "redirect" &&
            data.data.url === "/auth/verify?type=tfa"
          ) {
            // TFA required, redirect to verify page
            localStorage.setItem(
              "temp_user_data",
              JSON.stringify(data.data.user),
            );
            // Pass device_uid to verify page
            router.push(`/auth/verify?type=tfa&device_uid=${deviceUid}`);
          } else {
            // No TFA required, login successful
            toast.success(data.message || "Login successful");
            login(data.data.token, data.data.user);
            router.push("/dashboard");
          }
        } else {
          toast.error("Login failed: Missing token");
        }
      } else if (data?.http_status === 403 && data?.data?.verifyUrl) {
        let verifyUrl = data.data.verifyUrl.trim();
        // Store the code in localStorage for resend functionality
        localStorage.setItem("verifyUrl", data.data.verifyUrl.trim());
        if (!/^https?:\/\//i.test(verifyUrl)) {
          verifyUrl = `/auth/verify-account?code=${verifyUrl}`;
        }
        toast.error(
          <span>
            Please verify your email to continue.{" "}
            <Link href={verifyUrl} className="noroute text-blue-600 underline">
              Click here
            </Link>{" "}
            to verify.
          </span>,
          { duration: 10000 },
        );
      } else {
        toast.error(data.message || "Login failed");
      }
    },
    onError: (err: any) =>
      // console.log("Login mutation onError:", err) ||
      toast.error(err?.response?.message || err?.message || "Login failed"),
  });

  const handleStandardLogin = (values: any) => {
    console.log("handleStandardLogin called with values:", values);
    const { remember, ...rest } = values;

    // Save to localStorage if remember is checked
    if (remember) {
      localStorage.setItem("saved_email", rest.email);
      localStorage.setItem("saved_password", rest.password);
    } else {
      localStorage.removeItem("saved_email");
      localStorage.removeItem("saved_password");
    }

    setCurrentLoginValues(values);

    loginMutation.mutate({
      ...rest,
      device_uid: deviceUid,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  return (
    <>
      {showOtp ? (
        <LoginWithOtp onBack={() => setShowOtp(false)} />
      ) : (
        <FormProvider {...form}>
          <div className="space-y-4">
            {/* Email Field */}
            <FormField
              control={form.control}
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
                    <Input placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              rules={{ required: "Password is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Enter password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="h-4 w-4"
                    />
                    <span>Remember Me</span>
                  </label>
                )}
              />
              <Link
                href="/auth/password-forgot"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="button"
              className="w-full mt-2"
              onClick={() => {
                alert("Button clicked");
                try {
                  console.log("Login button clicked");
                  form.handleSubmit(
                    (values) => {
                      console.log("Form is valid, values:", values);
                      handleStandardLogin(values);
                    },
                    (errors) => {
                      console.log("Form validation errors:", errors);
                    },
                  )();
                } catch (error) {
                  console.error("Error in button onClick:", error);
                }
              }}
            >
              {loginMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Login"
              )}
            </Button>

            {/* Login with OTP Button */}
            <Button
              type="button"
              className="w-full "
              onClick={() => setShowOtp(true)}
            >
              Login with OTP
            </Button>
          </div>
        </FormProvider>
      )}
    </>
  );
}
