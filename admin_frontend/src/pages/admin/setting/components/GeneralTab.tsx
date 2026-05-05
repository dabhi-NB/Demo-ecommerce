import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  saveGeneralSettings,
  type GeneralSettings,
} from "@/services/setting.service";

interface GeneralTabProps {
  form: GeneralSettings;
  setForm: (form: GeneralSettings) => void;
  refetch: () => void;
}

export function GeneralTab({ form, setForm, refetch }: GeneralTabProps) {
  const generalMutation = useMutation({
    mutationFn: saveGeneralSettings,
    onSuccess: (response) => {
      if (response.status === 1) {
        refetch();
        setTimeout(
          () =>
            toast.success(response.message || "Settings saved successfully"),
          100,
        );
      } else {
        toast.error(response.message || "Failed to save settings");
      }
    },
    onError: () => toast.error("Failed to save settings"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        generalMutation.mutate(form);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="app_name">
            App Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="app_name"
            value={form["setting.app_name"]}
            onChange={(e) =>
              setForm({ ...form, "setting.app_name": e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin_email">
            Admin Contact Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="admin_email"
            type="email"
            value={form["setting.admin_email"]}
            onChange={(e) =>
              setForm({ ...form, "setting.admin_email": e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_format">Date Format</Label>
          <Select
            key={form["setting.date_format"]}
            value={form["setting.date_format"]}
            onValueChange={(value) =>
              setForm({ ...form, "setting.date_format": value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Y-m-d">YYYY-MM-DD</SelectItem>
              <SelectItem value="d-m-Y">DD-MM-YYYY</SelectItem>
              <SelectItem value="m-d-Y">MM-DD-YYYY</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_time_format">Date Time Format</Label>
          <Select
            key={form["setting.date_time_format"]}
            value={form["setting.date_time_format"]}
            onValueChange={(value) =>
              setForm({ ...form, "setting.date_time_format": value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Y-m-d h:i A">
                YYYY-MM-DD HH:MM AM/PM
              </SelectItem>
              <SelectItem value="d-m-Y h:i A">
                DD-MM-YYYY HH:MM AM/PM
              </SelectItem>
              <SelectItem value="m-d-Y h:i A">
                MM-DD-YYYY HH:MM AM/PM
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="login_otp">Login With OTP</Label>
          <Select
            key={form["setting.user_login_with_otp"]}
            value={form["setting.user_login_with_otp"]}
            onValueChange={(value) =>
              setForm({
                ...form,
                "setting.user_login_with_otp": value,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Enable</SelectItem>
              <SelectItem value="0">Disable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cookie_consent">Cookie Consent</Label>
          <Select
            key={form["setting.cookie_consent"]}
            value={form["setting.cookie_consent"]}
            onValueChange={(value) =>
              setForm({
                ...form,
                "setting.cookie_consent": value,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Enable</SelectItem>
              <SelectItem value="0">Disable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email_verify">Email Verify</Label>
          <Select
            key={form["setting.user_email_verify"]}
            value={form["setting.user_email_verify"]}
            onValueChange={(value) =>
              setForm({
                ...form,
                "setting.user_email_verify": value,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Enable</SelectItem>
              <SelectItem value="0">Disable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={generalMutation.isPending}>
        {generalMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit"
        )}
      </Button>
    </form>
  );
}
