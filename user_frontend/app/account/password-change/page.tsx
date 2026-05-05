"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../../services/auth.service";
import AccountLayout from "@/components/layout/account-layout/AccountLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type ChangePasswordForm = {
  current_password: string;
  password: string;
  confirm_password: string;
};

const getStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 6) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
};

const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const strengthColor = [
  "bg-destructive",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-green-500",
];

export default function ChangePassword() {
  const form = useForm<ChangePasswordForm>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      current_password: "",
      password: "",
      confirm_password: "",
    },
  });

  const { reset, watch } = form;
  const passwordValue = watch("password", "");
  const strength = getStrength(passwordValue);

  const [show, setShow] = useState({
    current: false,
    password: false,
    confirm: false,
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    if (data.password !== data.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await authService.changePassword(data);
      if (res.status !== 1) {
        toast.error(res.message || "Something went wrong");
        return;
      }

      toast.success(res.message || "Password changed successfully");

      if (res.next === "refresh") {
        window.location.reload();
      }

      reset();
    } catch (err: any) {
      toast.error(err?.message || err?.data?.message || "Something went wrong");
    }
  };

  return (
    <AccountLayout
      title="Change Password"
      subtitle="Update your account password"
    >
      <div className="bg-card border border-border rounded-2xl p-5">
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="current_password"
              rules={{
                required: "Please enter the current password",
                minLength: {
                  value: 6,
                  message: "Minimum 6 characters",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Current Password <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={show.current ? "text" : "password"}
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                        onClick={() =>
                          setShow({ ...show, current: !show.current })
                        }
                        suppressHydrationWarning
                      >
                        {show.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="hidden md:block"></div>

            <FormField
              control={form.control}
              name="password"
              rules={{
                required: "Please enter the new password",
                minLength: {
                  value: 6,
                  message: "Minimum 6 characters",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    New Password <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={show.password ? "text" : "password"}
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                        onClick={() =>
                          setShow({ ...show, password: !show.password })
                        }
                        suppressHydrationWarning
                      >
                        {show.password ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  {/* Password Strength Indicator */}
                  {passwordValue && (
                    <>
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              i <= strength
                                ? strengthColor[strength]
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs mt-1 text-muted-foreground">
                        {strengthLabel[strength]}
                      </p>
                    </>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              rules={{
                required: "Please confirm the new password",
                validate: (value) =>
                  value === passwordValue || "Passwords do not match",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Confirm New Password{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={show.confirm ? "text" : "password"}
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                        onClick={() =>
                          setShow({ ...show, confirm: !show.confirm })
                        }
                        suppressHydrationWarning
                      >
                        {show.confirm ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Security Tips */}
          <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground border border-border">
            <p className="font-semibold text-foreground text-xs mb-2">
              💡 Strong password tips:
            </p>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>At least 6 characters</li>
              <li>Mix of uppercase and lowercase</li>
              <li>Include numbers and symbols</li>
              <li>Don't reuse old passwords</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full sm:w-auto"
            >
              {form.formState.isSubmitting ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => reset()}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </AccountLayout>
  );
}
