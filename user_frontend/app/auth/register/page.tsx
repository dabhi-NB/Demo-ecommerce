"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField, 
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { authService } from "@/services/auth.service";
import General from "@/lib/general";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import RecaptchaWidget from "../../common/recaptcha";

type RegisterFormData = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  confirm_password: string;
  agree: boolean;
};

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [deviceUid, setDeviceUid] = useState("");
  const { googleRecaptchaEnabled, googleRecaptchaPublicKey } = useAppSettings();
  const [recaptchaToken, setRecaptchaToken] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const paramUid = (searchParams.get("device_uid") || "").trim();
    const storedUid = (localStorage.getItem("device_uid") || "").trim();
    const resolvedUid = paramUid || storedUid || General.makeId(32);
    localStorage.setItem("device_uid", resolvedUid);
    setDeviceUid(resolvedUid);
  }, [searchParams]);

  const form = useForm<RegisterFormData>({
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      password: "",
      confirm_password: "",
      agree: false,
    },
    mode: "onChange",
  });
  const extractMessage = (res: any) => {
    return (
      res?.message ??
      res?.data?.message ??
      res?.data?.msg ??
      res?.msg ??
      res?.error ??
      res?.data?.error ??
      res?.toString?.() ??
      ""
    );
  };
  const registerMutation = useMutation({
    mutationFn: authService.register,

    onSuccess: (res) => {
      const msg = extractMessage(res);

      if (res.status !== 1) {
        toast.error(msg);

        return;
      }
      toast.success(msg);

      if (res.next === "redirect" && res.url) {
        router.push(`/${res.url}`);
        return;
      }

      if (res.data?.token && res.data?.user) {
        login(res.data.token, res.data.user);
        router.push("/");
      }
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Registration failed",
      );
    },
  });

  const onSubmit = (values: RegisterFormData) => {
    if (googleRecaptchaEnabled && !recaptchaToken) {
      toast.error("Please verify the CAPTCHA!");
      return;
    }

    const payload: any = {
      first_name: values.first_name,
      last_name: values.last_name,
      phone: values.phone,
      email: values.email,
      password: values.password,
      timezone: General.getTimezone(),
      device_uid: deviceUid,
    };
    if (googleRecaptchaEnabled) {
      payload.recaptcha_token = recaptchaToken;
    }
    registerMutation.mutate(payload);
  };

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit, (formErrors) => {
        const firstError = Object.values(formErrors)[0];
        if (firstError?.message) {
          toast.error(firstError.message);
        }
      })}
      className="space-y-4"
    >
      <FormField
        control={form.control}
        name="first_name"
rules={{
  required: "First name is required",
  pattern: {
    value: /^[A-Za-z]+$/,
    message: "First name must contain only letters",
  },
}}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              First Name <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Enter your first name"
                {...field}
                suppressHydrationWarning
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="last_name"
rules={{
  required: "Last name is required",
  pattern: {
    value: /^[A-Za-z]+$/,
    message: "Last name must contain only letters",
  },
}}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Last Name <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Enter your last name"
                {...field}
                suppressHydrationWarning
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone"
rules={{
          required: "Phone number is required",
          pattern: {
            value: /^[0-9]{10}$/,
            message: "Phone must be exactly 10 digits (numbers only)",
          },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Phone <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                {...field}
                suppressHydrationWarning
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
              <Input
                type="email"
                placeholder="Enter your email address"
                {...field}
                suppressHydrationWarning
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        rules={{
          required: "Password is required",
          minLength: {
            value: 6,
            message: "Minimum 6 characters",
          },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Password <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <PasswordInput
                placeholder="Create a password"
                {...field}
                suppressHydrationWarning
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="confirm_password"
        rules={{
          required: "Password confirmation is required",
          validate: (val: string) =>
            val === form.watch("password") || "Passwords do not match",
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Confirm Password <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <PasswordInput
                placeholder="Re-enter your password"
                {...field}
                suppressHydrationWarning
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {googleRecaptchaEnabled && googleRecaptchaPublicKey && (
        <RecaptchaWidget onVerify={setRecaptchaToken} />
      )}

      <FormField
        control={form.control}
        name="agree"
        rules={{
          required: "You must agree to the Privacy Policy & Terms.",
        }}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-start gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1"
                />
              </FormControl>
              <FormLabel className="text-sm">
                I agree to{" "}
                <a
                  href="/page/privacypolicy"
                  target="_blank"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Privacy Policy & Terms
                </a>
              </FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button type="submit" className="w-full" suppressHydrationWarning={true}>
        {registerMutation.isPending ? "Registering..." : "Register"}
      </Button>
    </Form>
  );
}
