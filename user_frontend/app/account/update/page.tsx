"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AccountLayout from "@/components/layout/account-layout/AccountLayout";
import { ProfileImageUpload } from "../component/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";

export default function Update() {
  const { user, updateUser, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const router = useRouter();

  interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }

  const form = useForm<FormData>({
    defaultValues: {
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const { control, reset } = form;

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, reset]);

  const handleImageChange = (file: File | null) => {
    setProfileImage(file);
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const payload = {
        userId: user.user_id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
      };

      const resp = await authService.updateProfile(payload);

      if (resp.status === 1) {
        if (resp.next === "redirect" && resp.url) {
          toast.info("Please verify OTP to continue");
          router.push(resp.url);
          return;
        }

        updateUser({
          ...user,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
        });

        toast.success("Profile updated successfully!");
      } else {
        toast.error(resp.message || "An error occurred while updating profile");
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred while updating profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfirmed) {
      toast.error("Please confirm your account deactivation.");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.deleteAccount();

      if (data.status === 1) {
        toast.success(data.message || "Account deactivated successfully");
        logout();
        router.push("/");
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (error: any) {
      toast.error(error?.message || "Server error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountLayout
      title="My Profile"
      subtitle="Update your personal information"
    >
      <Card className="mb-6 w-full p-0">
        <div className="p-8 pb-4 border-b">
          <ProfileImageUpload
            currentImage={user?.image}
            onChange={handleImageChange}
          />
        </div>

        <div className="p-8 pt-4">
          <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="firstName"
                rules={{ required: "First name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      First Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="lastName"
                rules={{ required: "Last name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Last Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
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
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="phone"
                rules={{
                  required: "Phone number is required",
                  minLength: {
                    value: 10,
                    message: "Phone must be at least 10 digits",
                  },
                  maxLength: {
                    value: 10,
                    message: "Phone must be at least 10 digits",
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-8 flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
              <Button type="reset" variant="secondary">
                Cancel
              </Button>
            </div>
          </Form>
        </div>
      </Card>

      <Card className="p-6">
        <h5 className="text-lg font-semibold mb-4">Delete Account</h5>

        <div className="bg-muted p-4 rounded mb-6">
          <h5 className="mb-1">
            Are you sure you want to delete your account?
          </h5>
          <p className="text-sm mb-3">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
        </div>

        <form onSubmit={handleDelete}>
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mr-2"
            />
            <label>I confirm my account deactivation</label>
          </div>

          <Button type="submit" variant="destructive" disabled={loading}>
            {loading ? "Deactivating..." : "Deactivate Account"}
          </Button>
        </form>
      </Card>
    </AccountLayout>
  );
}
