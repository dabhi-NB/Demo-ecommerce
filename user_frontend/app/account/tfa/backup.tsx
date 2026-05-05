"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authService } from "../../../services/auth.service";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

type BackupCodeProps = {
  onClose?: () => void;
};

export default function BackupCodes({ onClose }: BackupCodeProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    const fetchBackupCodes = async () => {
      try {
        const response = await authService.backupCode();
        if (response.status === 1) {
          // Parse backup codes from comma-separated string
          const codes = response.data.backupCode
            ? response.data.backupCode.split(",")
            : [];
          setBackupCodes(codes);
        } else {
          toast.error(response.message || "Failed to load backup codes");
        }
      } catch (error) {
        toast.error("An error occurred while loading backup codes");
      }
    };

    fetchBackupCodes();
  }, []);

  const handleRegenerate = async () => {
    setIsSubmitting(true);
    try {
      const response = await authService.backupCodesRegenerate();
      if (response.status === 1) {
        setBackupCodes(response.data.backup_codes || []);
        toast.success("Backup codes regenerated successfully");
      } else {
        toast.error(response.message || "Failed to regenerate backup codes");
      }
    } catch (error: any) {
      toast.error("An error occurred while regenerating backup codes");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 z-50 flex justify-center items-start pt-16">
      <div className="w-full max-w-xl px-4 sm:px-6 md:px-0">
        <div className="bg-background rounded-2xl border shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Backup Codes</h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {backupCodes.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="p-2  rounded border text-center font-mono text-sm"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center ">No backup codes available</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-4 p-4 border-t border-t-border-primary mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="mb-4 mx-3"
              >
                Cancel
              </Button>

              <Button
                onClick={handleRegenerate}
                disabled={isSubmitting}
                className="btn btn-primary me-3 mb-4  pjax"
              >
                <span className="d-none d-sm-block">
                  {isSubmitting ? "Regenerating..." : "Regenerate"}
                </span>
                <Upload
                  size={20}
                  strokeWidth={2.5}
                  className="d-block d-sm-none"
                />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
