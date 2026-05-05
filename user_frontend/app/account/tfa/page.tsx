"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AccountLayout from "@/components/layout/account-layout/AccountLayout";
import BackupCodes from "./backup";
import AuthenticatorModal from "../../common/verify_authenticator_modal";
import OtpModal from "../../common/verify_otp_modal";
import { toast } from "sonner";
import { useAuth } from "../../../context/AuthContext";
import { authService } from "../../../services/auth.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function TwoFactorAuth() {
  const { user, updateUser, updateTfaStatus } = useAuth();
  const queryClient = useQueryClient();

  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showAuthenticatorModal, setShowAuthenticatorModal] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [authenticatorAddedLocal, setAuthenticatorAddedLocal] = useState(false);

  // Fetch TFA status and devices from database
  const { data: tfaData, isLoading: tfaLoading } = useQuery({
    queryKey: ["tfa-status"],
    queryFn: async () => {
      try {
        const res = await authService.getTfaStatus();
        const data = res.data || { status_tfa: 0, userAuthList: [] };
        return {
          ...data,
          status_tfa: Number(data.status_tfa),
        };
      } catch (error) {
        return { status_tfa: 0, userAuthList: [] };
      }
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch TOTP configuration status
  const { data: totpData } = useQuery({
    queryKey: ["totp-status"],
    queryFn: async () => {
      if (!user?.user_id) return { isConfigured: false };
      try {
        const response = await authService.getQrModal(user.user_id);
        if (response.status === 1) {
          return { isConfigured: false };
        } else if (response.message === "TOTP already enabled") {
          return { isConfigured: true };
        } else {
          return { isConfigured: false };
        }
      } catch (error: any) {
        if (error?.http_status === 403) {
          return { isConfigured: true };
        } else {
          return { isConfigured: false };
        }
      }
    },
    enabled: !!user,
  });

  const tfaEnabledFromQuery = tfaData?.status_tfa || 0;
  const userAuthList = tfaData?.userAuthList || [];
  const authenticatorAdded = totpData?.isConfigured || false;

  // Sync local state with query data
  useEffect(() => {
    setAuthenticatorAddedLocal(authenticatorAdded);
  }, [authenticatorAdded]);

  // Sync context with query data
  useEffect(() => {
    if (tfaData?.status_tfa !== undefined) {
      updateTfaStatus(Boolean(tfaData.status_tfa));
    }
  }, [tfaData?.status_tfa, updateTfaStatus]);

  // Force refresh user data on page load to sync with database
  useEffect(() => {
    const refreshUserData = async () => {
      if (user?.user_id) {
        try {
          const response = await authService.getTfaStatus();
          if (
            response.status === 1 &&
            response.data?.status_tfa !== undefined
          ) {
            const tfaStatus = Boolean(response.data.status_tfa);
            updateTfaStatus(tfaStatus);
            if (user) {
              updateUser({
                ...user,
                status_tfa: tfaStatus,
              });
            }
          }
        } catch (error) {
          // Handle error silently
        }
      }
    };

    refreshUserData();
  }, [user?.user_id, updateUser, updateTfaStatus]);

  const handleToggleTfa = async () => {
    const confirmed = window.confirm("You won't be able to revert this!");
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await authService.tfaStatusChange();
      if (response.status === 1) {
        toast.success(response.message || "TFA status updated successfully");
        if (response.data?.user?.status_tfa !== undefined && user) {
          const tfaStatus = Boolean(response.data.user.status_tfa);
          updateTfaStatus(tfaStatus);
          updateUser({
            ...user,
            status_tfa: tfaStatus,
          });
        }
        queryClient.invalidateQueries({
          queryKey: ["tfa-status"],
        });
        queryClient.refetchQueries({
          queryKey: ["tfa-status"],
        });
      } else {
        toast.error(response.message || "Failed to update TFA status");
      }
    } catch (error) {
      toast.error("An error occurred while updating TFA status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountLayout
      title="Two-Factor Authentication"
      subtitle="Secure your account with 2FA"
    >
      <div className="space-y-6">
        {/* Two-steps verification Card */}
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h5 className="text-lg font-semibold mb-6 text-card-foreground">
              Two-steps verification
            </h5>
            {tfaEnabledFromQuery === 1 ? (
              <h5 className="text-base text-muted-foreground mb-4">
                Two factor authentication is enabled.
              </h5>
            ) : (
              <h5 className="text-base text-muted-foreground mb-4">
                Two factor authentication is disabled.
              </h5>
            )}
            <button
              onClick={handleToggleTfa}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? "Updating..."
                : (tfaEnabledFromQuery === 1 ? "Disable" : "Enable") +
                  " Two-Factor Authentication"}
            </button>
          </div>
        </div>

        {/* Authenticator App Card */}
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h5 className="text-lg font-semibold mb-6 text-card-foreground">
              Authenticator App
            </h5>
            <div className="flex flex-wrap gap-3 items-center">
              {authenticatorAddedLocal ? (
                <>
                  <button
                    onClick={async () => {
                      const confirmed = window.confirm(
                        "Are you sure you want to remove TOTP authentication?",
                      );
                      if (!confirmed) return;

                      try {
                        const response = await authService.removeTotp();
                        if (response.status === 1) {
                          toast.success(
                            "TOTP authentication removed successfully",
                          );
                          setAuthenticatorAddedLocal(false);
                          queryClient.setQueryData(["totp-status"], {
                            isConfigured: false,
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["totp-status"],
                          });
                          queryClient.refetchQueries({
                            queryKey: ["totp-status"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["tfa-status"],
                          });
                          queryClient.refetchQueries({
                            queryKey: ["tfa-status"],
                          });
                        } else {
                          toast.error(
                            response.message || "Failed to remove TOTP",
                          );
                        }
                      } catch (error) {
                        toast.error("An error occurred while removing TOTP");
                      }
                    }}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-md font-medium transition-colors"
                    tabIndex={0}
                  >
                    <span className="hidden sm:inline">
                      Remove Authenticator
                    </span>
                    <svg
                      className="w-5 h-5 sm:hidden"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowBackupCodes(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors"
                    tabIndex={0}
                  >
                    <span className="hidden sm:inline">Backup Code</span>
                    <svg
                      className="w-5 h-5 sm:hidden"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthenticatorModal(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors"
                  tabIndex={0}
                >
                  <span className="hidden sm:inline">
                    Add Authenticator App
                  </span>
                  <svg
                    className="w-5 h-5 sm:hidden"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Devices That Don't Need a Second Step Card */}
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h5 className="text-lg font-semibold mb-6 text-card-foreground">
              Devices That Don't Need a Second Step
            </h5>
            <h5 className="text-base text-muted-foreground mb-4">
              You can skip the second step on devices you trust, such as your
              own computer.
            </h5>

            {/* Table */}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-border border-t border-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {userAuthList.length > 0 ? (
                    userAuthList.map((userAuth, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground border-r border-border">
                          {userAuth.client}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {userAuth.location}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-4 text-center text-muted-foreground"
                      >
                        No trusted device available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Device Trust Section */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon icon-tabler icon-tabler-devices-check h-12 w-12 text-muted-foreground"
                    width="50"
                    height="50"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M13 15.5v-6.5a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1v4" />
                    <path d="M18 8v-3a1 1 0 0 0 -1 -1h-13a1 1 0 0 0 -1 1v12a1 1 0 0 0 1 1h7" />
                    <path d="M16 9h2" />
                    <path d="M15 19l2 2l4 -4" />
                  </svg>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-foreground">
                      Device You Trust
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      Revoke trusted status from your device that skips 2-Step
                      Verification.
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      const confirmed = window.confirm(
                        "You won't be able to revert this!",
                      );
                      if (!confirmed) return;

                      try {
                        const response = await authService.revokeAll();
                        if (response.status === 1) {
                          toast.success(
                            response.message ||
                              "Your Devices Revoked Successfully",
                          );
                          updateTfaStatus(false);
                          if (user) {
                            updateUser({ ...user, status_tfa: false });
                          }
                          queryClient.invalidateQueries({
                            queryKey: ["tfa-status"],
                          });
                        } else {
                          toast.error(
                            response.message || "Failed to revoke devices",
                          );
                        }
                      } catch (error) {
                        toast.error("An error occurred while revoking devices");
                      }
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors"
                    title="Revoke All"
                  >
                    REVOKE ALL
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showBackupCodes && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center pt-16">
          <BackupCodes onClose={() => setShowBackupCodes(false)} />
        </div>
      )}
      {showAuthenticatorModal && (
        <AuthenticatorModal
          onClose={() => setShowAuthenticatorModal(false)}
          onNext={(key: string) => {
            setSecretKey(key);
            setShowAuthenticatorModal(false);
          }}
        />
      )}
      {secretKey && (
        <OtpModal
          secretKey={secretKey}
          onClose={() => setSecretKey("")}
          onSuccess={() => {
            setSecretKey("");
            setAuthenticatorAddedLocal(true);
            queryClient.invalidateQueries({
              queryKey: ["totp-status"],
            });
            queryClient.invalidateQueries({
              queryKey: ["tfa-status"],
            });
            toast.success("Authenticator App Added Successfully");
          }}
        />
      )}
    </AccountLayout>
  );
}
