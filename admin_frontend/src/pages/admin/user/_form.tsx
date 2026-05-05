import { useState, useEffect, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchSelect } from "@/components/ui/search-select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createUser, updateUser, getUserById } from "@/services/user.service";
import countries from "@/assets/countries.json";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AppConfig from "@/appConfig";

interface UserFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: (data?: any) => void;
  onError?: () => void;
}

const UserForm = forwardRef<any, UserFormProps>(
  ({ isEdit, id, onSuccess }, _ref) => {
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);

    const form = useForm({
      defaultValues: {
        first_name: "",
        last_name: "",
        password: "",
        email: "",
        phone: "",
        country: "",
        status: "1",
        image: null as File | null,
      },
      mode: "onSubmit",
    });

    useEffect(() => {
      if (isEdit && id) {
        fetchUser(id);
      }
    }, [id, isEdit]);

    const fetchUser = async (userId: string) => {
      try {
        setLoading(true);
        const user = await getUserById(userId);

        form.reset({
          first_name: user.first_name ?? "",
          last_name: user.last_name ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
          country: user.country ?? "",
          status: String(user.status ?? "1"),
          password: "",
          image: null,
        });

        if (user.image) {
          setExistingImage(user.image);
        }
      } catch (error: any) {
        console.error("Error fetching user:", error.message);
        toast.error(error.message || "Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    const onSubmit = async (values: any) => {
      try {
        setSubmitting(true);

        const formData = new FormData();
        formData.append("first_name", values.first_name);
        formData.append("last_name", values.last_name);

        formData.append("email", values.email);
        formData.append("phone", values.phone || "");
        formData.append("country", values.country || "");
        formData.append("status", String(values.status));
        formData.append("role", "4");

        if (values.password) {
          formData.append("password", values.password);
        }

        if (values.image) {
          formData.append("image", values.image);
        }

        console.log("FormData being sent:", Object.fromEntries(formData));

        let response;
        if (isEdit && id) {
          response = await updateUser(id, formData);
        } else {
          response = await createUser(formData as any);
        }

        if (response?.status === 1) {
          toast.success(
            response.message ||
              `User ${isEdit ? "updated" : "created"} successfully`,
          );
          onSuccess(isEdit ? id : response.data);
        } else {
          toast.error(
            response.message ||
              `Failed to ${isEdit ? "update" : "create"} user`,
          );
        }
      } catch (error: any) {
        console.error(`Error ${isEdit ? "updating" : "creating"} user:`, error);
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isEdit ? "update" : "create"} user`;
        toast.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    };

    if (loading) {
      return <div className="text-center py-10">Loading...</div>;
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              rules={{ required: "First name is required" }}
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    First Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="First name" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              rules={{ required: "Last name is required" }}
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    Last Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Last name" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              rules={{ required: !isEdit ? "Password is required" : false }}
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    Password{" "}
                    {!isEdit && <span className="text-red-500">*</span>}
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Password"
                      {...field}
                      readOnly={isEdit}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
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
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <SearchSelect
                      options={countries.map((c) => ({
                        label: c.name,
                        value: c.name,
                      }))}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select country"
                      searchPlaceholder="Search country..."
                      emptyText="No country found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Active</SelectItem>
                      <SelectItem value="0">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="image"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Profile Image</FormLabel>

                {/* Image Preview */}
                <div className="mb-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded border"
                    />
                  ) : existingImage && !imageError ? (
                    <img
                      src={`${AppConfig.API_URL}upload/user_profile/${existingImage}`}
                      alt="Current Profile"
                      className="w-24 h-24 object-cover rounded border"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded border flex items-center justify-center text-xs  text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>

                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange(file);
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setImagePreview(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-muted mt-2">
                  Optional. Images are sent as base64.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update User"
              ) : (
                "Create User"
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  },
);

UserForm.displayName = "UserForm";

export default UserForm;
