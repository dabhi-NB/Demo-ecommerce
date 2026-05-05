import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { AccountBlock } from "./component/account_block";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ChangePasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export default function ChangePassword() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordForm>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const [show, setShow] = useState({
    current: false,
    password: false,
    confirm: false,
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    try {
      const res = await authService.changePassword(data);
      if (res.status !== 1) {
        toast.error(res.message || "Something went wrong");
        return;
      }

      toast.success(res.message || "Password changed successfully");

      reset();
    } catch (err: any) {
      toast.error(err?.message || err?.data?.message || "Something went wrong");
    }
  };

  return (
    <>
      <AccountBlock />
      <div className="flex-1 sm:px-6 md:px-10 mt-6 sm:mt-9">
        <div className="bg-card rounded-2xl border shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-6 text-foreground">
            Change Password
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={show.current ? "text" : "password"}
                    {...register("current_password", {
                      required: "Please enter the current password",
                      minLength: {
                        value: 6,
                        message: "Minimum 6 characters",
                      },
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                    onClick={() => setShow({ ...show, current: !show.current })}
                  >
                    {show.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-destructive text-sm mt-1">
                  {errors.current_password?.message}
                </p>
              </div>

              {/* Spacer */}
              <div className="hidden md:block"></div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={show.password ? "text" : "password"}
                    {...register("new_password", {
                      required: "Please enter the new password",
                      minLength: {
                        value: 6,
                        message: "Minimum 6 characters",
                      },
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                    onClick={() =>
                      setShow({ ...show, password: !show.password })
                    }
                  >
                    {show.password ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-destructive text-sm mt-1">
                  {errors.new_password?.message}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={show.confirm ? "text" : "password"}
                    {...register("confirm_password", {
                      required: "Please confirm the new password",
                      validate: (val) =>
                        val === watch("new_password") ||
                        "Passwords do not match",
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                    onClick={() => setShow({ ...show, confirm: !show.confirm })}
                  >
                    {show.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-destructive text-sm mt-1">
                  {errors.confirm_password?.message}
                </p>
              </div>
            </div>

            {/* Password Rules */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Password Requirements:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>Password must be at least 6 characters long.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Saving..." : "Save changes"}
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
          </form>
        </div>
      </div>
    </>
  );
}
