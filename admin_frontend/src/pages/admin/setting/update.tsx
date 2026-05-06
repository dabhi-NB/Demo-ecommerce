import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getSettings,
  clearCache,
  type GeneralSettings,
  type SmtpSettings,
  type CaptchaSettings,
  type SocialSettings,
  type ContentSettings,
} from "@/services/setting.service";
import { GeneralTab } from "./components/GeneralTab";
import { LogoTab } from "./components/LogoTab";
import { MailTab } from "./components/MailTab";
import { CaptchaTab } from "./components/CaptchaTab";
import { SocialTab } from "./components/SocialTab";
import { ContentTab } from "./components/ContentTab";
import { PaymentTab } from "./components/PaymentTab";
import { ThemeTab } from "./components/ThemeTab";
import { useAuth } from "@/context/AuthContext";

export default function SettingUpdate() {
  const { hasPermission } = useAuth();
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [faviconPreview, setFaviconPreview] = useState<string>("");

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const [generalForm, setGeneralForm] = useState<GeneralSettings>({
    "setting.app_name": "",
    "setting.admin_email": "",
    "setting.date_format": "Y-m-d",
    "setting.date_time_format": "Y-m-d h:i A",
    "setting.user_login_with_otp": "1",
    "setting.cookie_consent": "1",
    "setting.user_email_verify": "1",
  });

  const [smtpForm, setSmtpForm] = useState<SmtpSettings>({
    "mail.mailers.smtp.host": "",
    "mail.mailers.smtp.encryption": "ssl",
    "mail.mailers.smtp.port": "",
    "mail.mailers.smtp.username": "",
    "mail.mailers.smtp.password": "",
    "mail.from.name": "",
    "mail.from.address": "",
  });

  const [captchaForm, setCaptchaForm] = useState<CaptchaSettings>({
    "setting.google_recaptcha": "0",
    "setting.google_recaptcha_secret_key": "",
    "setting.google_recaptcha_public_key": "",
  });

  const [socialForm, setSocialForm] = useState<SocialSettings>({
    "setting.google_login": "0",
    "services.google_client_id": "",
    "services.google_client_secret": "",
  });

  const [contentForm, setContentForm] = useState<ContentSettings>({
    "setting.header_content": "",
    "setting.footer_content": "",
  });



  useEffect(() => {
    if (settings) {
      setGeneralForm({
        "setting.app_name": String(settings["setting.app_name"] || ""),
        "setting.admin_email": String(settings["setting.admin_email"] || ""),
        "setting.date_format": String(
          settings["setting.date_format"] || "Y-m-d",
        ),
        "setting.date_time_format": String(
          settings["setting.date_time_format"] || "Y-m-d h:i A",
        ),
        "setting.user_login_with_otp": String(
          settings["setting.user_login_with_otp"] || "0",
        ),
        "setting.cookie_consent": String(
          settings["setting.cookie_consent"] || "0",
        ),
        "setting.user_email_verify": String(
          settings["setting.user_email_verify"] || "0",
        ),
      });
      setSmtpForm({
        "mail.mailers.smtp.host": String(
          settings["mail.mailers.smtp.host"] || "",
        ),
        "mail.mailers.smtp.encryption": String(
          settings["mail.mailers.smtp.encryption"] || "ssl",
        ) as "ssl" | "tls",
        "mail.mailers.smtp.port": String(
          settings["mail.mailers.smtp.port"] || "",
        ),
        "mail.mailers.smtp.username": String(
          settings["mail.mailers.smtp.username"] || "",
        ),
        "mail.mailers.smtp.password": String(
          settings["mail.mailers.smtp.password"] || "",
        ),
        "mail.from.name": String(settings["mail.from.name"] || ""),
        "mail.from.address": String(settings["mail.from.address"] || ""),
      });
      setCaptchaForm({
        "setting.google_recaptcha": String(
          settings["setting.google_recaptcha"] || "0",
        ),
        "setting.google_recaptcha_secret_key": String(
          settings["setting.google_recaptcha_secret_key"] || "",
        ),
        "setting.google_recaptcha_public_key": String(
          settings["setting.google_recaptcha_public_key"] || "",
        ),
      });
      setSocialForm({
        "setting.google_login": String(settings["setting.google_login"] || "0"),
        "services.google_client_id": String(
          settings["services.google_client_id"] || "",
        ),
        "services.google_client_secret": String(
          settings["services.google_client_secret"] || "",
        ),
      });
      setContentForm({
        "setting.header_content": String(
          settings["setting.header_content"] || "",
        ),
        "setting.footer_content": String(
          settings["setting.footer_content"] || "",
        ),
      });

      setLogoPreview(String(settings["setting.app_logo"] || ""));
      setFaviconPreview(String(settings["setting.app_favicon"] || ""));
    }
  }, [settings]);

  const cacheMutation = useMutation({
    mutationFn: clearCache,
    onSuccess: (response) =>
      response.status === 1
        ? toast.success(response.message || "Cache cleared successfully")
        : toast.error(response.message || "Failed to clear cache"),
    onError: () => toast.error("Failed to clear cache"),
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        {hasPermission("admin/setting/update") && (
          <Button
            onClick={() => cacheMutation.mutate()}
            disabled={cacheMutation.isPending}
            variant="secondary"
          >
            {cacheMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              "Clear Cache"
            )}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="logo">Logo</TabsTrigger>
              <TabsTrigger value="mail">Mail</TabsTrigger>
              <TabsTrigger value="recaptcha">reCAPTCHA</TabsTrigger>
              <TabsTrigger value="social">Social Login</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="theme">Theme & Store</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <GeneralTab
                form={generalForm}
                setForm={setGeneralForm}
                refetch={refetch}
              />
            </TabsContent>
            <TabsContent value="logo">
              <LogoTab
                logoPreview={logoPreview}
                faviconPreview={faviconPreview}
                setLogoPreview={setLogoPreview}
                setFaviconPreview={setFaviconPreview}
                refetch={refetch}
              />
            </TabsContent>
            <TabsContent value="mail">
              <MailTab
                form={smtpForm}
                setForm={setSmtpForm}
                refetch={refetch}
              />
            </TabsContent>
            <TabsContent value="recaptcha">
              <CaptchaTab
                form={captchaForm}
                setForm={setCaptchaForm}
                refetch={refetch}
              />
            </TabsContent>
            <TabsContent value="social">
              <SocialTab
                form={socialForm}
                setForm={setSocialForm}
                refetch={refetch}
              />
            </TabsContent>
            <TabsContent value="content">
              <ContentTab
                form={contentForm}
                setForm={setContentForm}
                refetch={refetch}
              />
            </TabsContent>
            <TabsContent value="payment">
              <PaymentTab
                canEdit={hasPermission("admin/setting/update")}
              />
            </TabsContent>

            <TabsContent value="theme">
              <ThemeTab settings={settings as Record<string, string>} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
