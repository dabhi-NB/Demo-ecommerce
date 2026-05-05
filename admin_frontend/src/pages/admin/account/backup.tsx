import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import axios from "axios";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type BackupCodeForm = {
  backup_code: string;
};

type BackupCodeProps = {
  initialCode?: string;
  onClose?: () => void;
};

export default function BackupCodes({
  initialCode = "",
  onClose,
}: BackupCodeProps) {
  const form = useForm<BackupCodeForm>({
    mode: "onSubmit",
    defaultValues: {
      backup_code: initialCode,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: BackupCodeForm) => {
    setIsSubmitting(true);
    try {
      await axios.post("/backup-codes/regenerate", data, {
        headers: {
          "X-CSRF-TOKEN": (
            document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement
          )?.content,
        },
      });
      alert("Backup code regenerated successfully");
      form.reset();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-start pt-16">
      <div className="w-full max-w-xl px-4 sm:px-6 md:px-0">
        {" "}
        {/* <-- Mobile padding added */}
        <div className="bg-white rounded-2xl border shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Backup Codes
            </h2>
          </div>

          {/* Form */}
          <div className="p-6">
            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Backup Code Input */}
                <FormField
                  name="backup_code"
                  rules={{ required: "Backup code is required" }}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Backup Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your backup code"
                          {...field}
                          className={`${
                            fieldState.invalid
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : ""
                          }`}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                {/* Buttons */}
                <div className="flex gap-4 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-muted text-muted-foreground hover:bg-muted"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-black text-white hover:bg-gray-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Regenerating..." : "Regenerate"}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
