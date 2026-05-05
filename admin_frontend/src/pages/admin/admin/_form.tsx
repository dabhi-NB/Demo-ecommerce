import { useState, useEffect, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  createAdmin,
  updateAdmin,
  getAdminById,
} from "@/services/admin.service";
import countries from "@/assets/countries.json";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AppConfig from "@/appConfig";
import { PermissionService } from "@/services/permission.service";

interface AdminFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: (data?: any) => void;
  onError?: () => void;
}

const AdminForm = forwardRef<any, AdminFormProps>(
  ({ isEdit, id, onSuccess }, _ref) => {
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);

    const permissionListData = PermissionService.getPermissionListData();

    const form = useForm({
      defaultValues: {
        first_name: "",
        last_name: "",
        password: "",
        email: "",
        phone: "",
        country: "",
        status: 1,
        image: null as File | null,
      },
      mode: "onSubmit",
    });

    useEffect(() => {
      if (isEdit && id) {
        fetchAdmin(id);
      }
    }, [id, isEdit]);

    const fetchAdmin = async (adminId: string) => {
      try {
        setLoading(true);
        const admin = await getAdminById(adminId);

        form.reset({
          first_name: admin.first_name ?? "",
          last_name: admin.last_name ?? "",
          email: admin.email ?? "",
          phone: admin.phone ?? "",
          country: admin.country ?? "",
          status: admin.status ?? 1,
          password: "",
          image: null,
        });

        if (admin.image) {
          setExistingImage(admin.image);
        }

        // Load permissions
        if (admin.permission) {
          const permissionArray = admin.permission
            .split(",")
            .map((p: string) => p.trim());
          setPermissions(permissionArray);
        }
      } catch (error: any) {
        console.error("Error fetching admin:", error.message);
        toast.error(error.message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    const handlePermissionChange = (
      permissionKey: string,
      checked: boolean,
    ) => {
      setPermissions((prev) => {
        let newPermissions = [...prev];

        if (checked) {
          // Add the permission itself
          if (!newPermissions.includes(permissionKey)) {
            newPermissions.push(permissionKey);
          }

          // Check if it's a parent permission (has children)
          const parentGroup = permissionListData.find(
            (group) => group.key === permissionKey,
          );
          if (parentGroup && parentGroup.list) {
            // If parent is checked, automatically check all children
            parentGroup.list.forEach((child) => {
              if (!newPermissions.includes(child.key)) {
                newPermissions.push(child.key);
              }
            });
          }

          // Check if it's a child permission
          const childGroup = permissionListData.find((group) =>
            group.list?.some((p) => p.key === permissionKey),
          );
          if (childGroup && !newPermissions.includes(childGroup.key)) {
            // If child is checked, also check parent
            newPermissions.push(childGroup.key);
          }
        } else {
          // Remove permission
          newPermissions = newPermissions.filter((p) => p !== permissionKey);

          // If it's a parent permission, remove all children
          const group = permissionListData.find((g) => g.key === permissionKey);
          if (group && group.list) {
            group.list.forEach((child) => {
              newPermissions = newPermissions.filter((p) => p !== child.key);
            });
          }

          // If it's a child permission being unchecked, check if parent should remain
          const parentGroup = permissionListData.find((group) =>
            group.list?.some((p) => p.key === permissionKey),
          );
          if (parentGroup) {
            // Check if any other children of this parent are still checked
            const hasOtherChildrenChecked = parentGroup.list!.some(
              (child) =>
                child.key !== permissionKey &&
                newPermissions.includes(child.key),
            );
            // If no other children are checked, remove the parent as well
            if (!hasOtherChildrenChecked) {
              newPermissions = newPermissions.filter(
                (p) => p !== parentGroup.key,
              );
            }
          }
        }

        return newPermissions;
      });
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
        formData.append("role", "1"); // Admin role
        formData.append("permission", permissions.join(","));

        if (values.password) {
          formData.append("password", values.password);
        }

        if (values.image) {
          formData.append("image", values.image);
        }

        console.log("FormData being sent:", Object.fromEntries(formData));

        let response;
        if (isEdit && id) {
          response = await updateAdmin(id, formData);
        } else {
          response = await createAdmin(formData as any);
        }

        if (response?.status === 1) {
          toast.success(
            response.message ||
              `Admin ${isEdit ? "updated" : "created"} successfully`,
          );
          onSuccess(isEdit ? id : response.data);
        } else {
          toast.error(
            response.message ||
              `Failed to ${isEdit ? "update" : "create"} Admin`,
          );
        }
      } catch (error: any) {
        console.error(
          `Error ${isEdit ? "updating" : "creating"} admin:`,
          error,
        );
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isEdit ? "update" : "create"} Admin`;
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
                    value={String(field.value)}
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
                  ) : existingImage ? (
                    <img
                      src={`${AppConfig.API_URL}upload/profile/${existingImage}`}
                      alt="Current Profile"
                      className="w-24 h-24 object-cover rounded border"
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

          <div className="space-y-4">
            <FormLabel className="text-base font-medium">
              Permission <span className="text-red-500">*</span>
            </FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {permissionListData.map((permissionGroup) => (
                <div
                  key={permissionGroup.key}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={permissionGroup.key}
                      checked={
                        permissions.includes(permissionGroup.key) ||
                        (permissionGroup.list &&
                          permissionGroup.list.some((p) =>
                            permissions.includes(p.key),
                          ))
                      }
                      onCheckedChange={(checked) =>
                        handlePermissionChange(
                          permissionGroup.key,
                          checked as boolean,
                        )
                      }
                    />
                    <label
                      htmlFor={permissionGroup.key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {permissionGroup.title}
                    </label>
                  </div>
                  {permissionGroup.list && permissionGroup.list.length > 0 && (
                    <div className="ml-4 space-y-2 ">
                      {permissionGroup.list.map((permission) => (
                        <div
                          key={permission.key}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={permission.key}
                            checked={permissions.includes(permission.key)}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                permission.key,
                                checked as boolean,
                              )
                            }
                          />
                          <label
                            htmlFor={permission.key}
                            className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.title}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update Admin"
              ) : (
                "Create Admin"
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  },
);

AdminForm.displayName = "AdminForm";

export default AdminForm;
