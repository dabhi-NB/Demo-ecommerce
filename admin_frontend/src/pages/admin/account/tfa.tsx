import { useState, useEffect } from "react";
import { AccountBlock } from "./component/account_block";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

import { toast } from "sonner";
import { Shield, ShieldCheck, Smartphone, AlertTriangle } from "lucide-react";
import { authService } from "@/services/auth.service";

export function TFASettings() {
  const { user, updateUser } = useAuth();

  // Loading states
  const [tfaLoading, setTfaLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);

  // TFA state
  const [tfaEnabled, setTfaEnabled] = useState<boolean>(!!user?.tfa_enabled);

  // Sync TFA state when user context changes
  useEffect(() => {
    setTfaEnabled(!!user?.tfa_enabled);
  }, [user]);

  // Toggle TFA handler
  const handleToggleTFA = async () => {
    if (!user) return;

    setTfaLoading(true);
    try {
      const res = await authService.tfastatus(user.user_id);

      if (res.status === 1 && res.data) {
        const newStatus = !tfaEnabled; // toggle

        setTfaEnabled(newStatus);

        // Update user context safely
        updateUser({ ...user, tfa_enabled: newStatus });

        toast.success(
          newStatus
            ? "Two-Factor Authentication enabled"
            : "Two-Factor Authentication disabled",
        );
      } else {
        toast.error(res.message || "Failed to update TFA");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update TFA");
    } finally {
      setTfaLoading(false);
    }
  };

  // Revoke all trusted devices
  const handleRevokeAllDevices = async () => {
    if (!user) return;

    setRevokeLoading(true);
    try {
      const res = await authService.revokeAllDevices();

      if (res.status === 1) {
        toast.success(res.message || "All trusted devices revoked");
      } else {
        toast.error(res.message || "Failed to revoke devices");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to revoke devices");
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <>
      <AccountBlock />

      <div className="flex-1 sm:px-10 mt-6 sm:mt-9 space-y-6">
        {/* Two-Factor Authentication Status Card */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5" />
              Two-Step Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium">
                  {tfaEnabled ? "Enabled" : "Disabled"}
                </h5>
                <p className="text-sm text-muted-foreground">
                  Two-factor authentication is{" "}
                  {tfaEnabled ? "enabled" : "disabled"}.
                </p>
              </div>
              <Badge
                variant={tfaEnabled ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                {tfaEnabled ? (
                  <>
                    <ShieldCheck className="h-3 w-3" />
                    Enabled
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    Disabled
                  </>
                )}
              </Badge>
            </div>

            <Button
              onClick={handleToggleTFA}
              disabled={tfaLoading}
              variant={tfaEnabled ? "destructive" : "default"}
              className="w-full sm:w-auto"
            >
              {tfaLoading
                ? "Processing..."
                : tfaEnabled
                  ? "Disable Two-Factor Authentication"
                  : "Enable Two-Factor Authentication"}
            </Button>
          </CardContent>
        </Card>

        {/* Trusted Devices Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Devices That Don't Need a Second Step
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You can skip the second step on devices you trust, such as your
              own computer.
            </p>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h5 className="font-medium">Trusted Devices</h5>
                    <p className="text-sm text-muted-foreground">
                      Revoke trusted status from your devices that skip 2-Step
                      Verification.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleRevokeAllDevices}
                  disabled={revokeLoading}
                  variant="default"
                  size="sm"
                >
                  {revokeLoading ? "Revoking..." : "REVOKE ALL"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default TFASettings;
