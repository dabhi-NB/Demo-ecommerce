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
  saveCaptchaSettings,
  type CaptchaSettings,
} from "@/services/setting.service";

interface CaptchaTabProps {
  form: CaptchaSettings;
  setForm: (form: CaptchaSettings) => void;
  refetch: () => void;
}

export function CaptchaTab({ form, setForm, refetch }: CaptchaTabProps) {
  const captchaMutation = useMutation({
    mutationFn: saveCaptchaSettings,
    onSuccess: (response) =>
      response.status === 1
        ? (toast.success(
            response.message || "Captcha settings saved successfully",
          ),
          refetch())
        : toast.error(response.message || "Failed to save captcha settings"),
    onError: () => toast.error("Failed to save captcha settings"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        captchaMutation.mutate(form);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="recaptcha_enable">Enable</Label>
          <Select
            value={form["setting.google_recaptcha"]}
            onValueChange={(value) =>
              setForm({
                ...form,
                "setting.google_recaptcha": value,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="recaptcha_secret">
            Secret Key <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recaptcha_secret"
            value={form["setting.google_recaptcha_secret_key"]}
            onChange={(e) =>
              setForm({
                ...form,
                "setting.google_recaptcha_secret_key": e.target.value,
              })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recaptcha_public">
            Public Key <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recaptcha_public"
            value={form["setting.google_recaptcha_public_key"]}
            onChange={(e) =>
              setForm({
                ...form,
                "setting.google_recaptcha_public_key": e.target.value,
              })
            }
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={captchaMutation.isPending}>
        {captchaMutation.isPending ? (
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
