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
  saveSocialSettings,
  type SocialSettings,
} from "@/services/setting.service";

interface SocialTabProps {
  form: SocialSettings;
  setForm: (form: SocialSettings) => void;
  refetch: () => void;
}

export function SocialTab({ form, setForm, refetch }: SocialTabProps) {
  const socialMutation = useMutation({
    mutationFn: saveSocialSettings,
    onSuccess: (response) =>
      response.status === 1
        ? (toast.success(
            response.message || "Social settings saved successfully",
          ),
          refetch())
        : toast.error(response.message || "Failed to save social settings"),
    onError: () => toast.error("Failed to save social settings"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        socialMutation.mutate(form);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="google_login">Google Login</Label>
          <Select
            value={form["setting.google_login"]}
            onValueChange={(value) =>
              setForm({ ...form, "setting.google_login": value })
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
          <Label htmlFor="google_client_id">
            Google Client ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="google_client_id"
            value={form["services.google_client_id"]}
            onChange={(e) =>
              setForm({ ...form, "services.google_client_id": e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="google_client_secret">
            Google Client Secret <span className="text-red-500">*</span>
          </Label>
          <Input
            id="google_client_secret"
            value={form["services.google_client_secret"]}
            onChange={(e) =>
              setForm({
                ...form,
                "services.google_client_secret": e.target.value,
              })
            }
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={socialMutation.isPending}>
        {socialMutation.isPending ? (
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
