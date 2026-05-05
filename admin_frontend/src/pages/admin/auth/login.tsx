import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router";
import { authService } from "@/services/auth.service";
import type { LoginRequest } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import General from "@/helper/general";
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
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [deviceUid, setDeviceUid] = useState("");

  useEffect(() => {
    console.log("Login: isAuthenticated =", isAuthenticated);
    if (isAuthenticated) {
      console.log("Login: navigating to /admin/dashboard");
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, navigate]);

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
      navigate(
        params.toString()
          ? `${location.pathname}?${params.toString()}`
          : location.pathname,
        { replace: true },
      );
    }
  }, [searchParams, navigate, location.pathname]);

  const form = useForm<{
    email: string;
    password: string;
    remember: boolean;
  }>({
    defaultValues: { email: "", password: "", remember: false },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    criteriaMode: "firstError",
    shouldFocusError: true,
  });

  const extractMessage = (res: any) =>
    res?.message || res?.data?.message || res?.data?.error || res?.error || "";

  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (data) => {
      if (data?.status === 1) {
        toast.success(data.message || "Login successful");
        login(data.data.token, data.data.user);
        navigate("/admin/dashboard");
      } else {
        toast.error(data.message || "Login failed");
      }
    },
    onError: (err: any) => toast.error(extractMessage(err?.response || err)),
  });

  const handleStandardLogin = (values: any) => {
    const { remember, ...rest } = values;

    // Save to localStorage if remember is checked
    if (remember) {
      localStorage.setItem("saved_email", rest.email);
      localStorage.setItem("saved_password", rest.password);
    } else {
      localStorage.removeItem("saved_email");
      localStorage.removeItem("saved_password");
    }

    loginMutation.mutate({
      ...rest,
      device_uid: deviceUid,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleStandardLogin)}
        className="space-y-4"
      >
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
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Email <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          rules={{ required: "Password is required" }}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Password <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Enter password"
                  aria-invalid={!!fieldState.error}
                  {...field}
                />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        {/* Remember Me and Forgot Password */}
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="remember"
            render={({ field, fieldState }) => (
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="h-4 w-4"
                  aria-invalid={!!fieldState.error}
                />
                <span>Remember Me</span>
                {fieldState.error && (
                  <FormMessage>{fieldState.error.message}</FormMessage>
                )}
              </label>
            )}
          />
          <Link
            to="/auth/password-forgot"
            className="text-sm text-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Login Button */}
        <Button type="submit" className="w-full">
          {loginMutation.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Form>
  );
}
