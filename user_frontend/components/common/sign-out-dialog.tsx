"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "./confirm-dialog";
import { useAuth } from "@/context/AuthContext";
interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const router = useRouter();
  const auth = useAuth();

  const handleSignOut = () => {
    auth.logout();
    router.push("/auth/login");
  };
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign Out"
      desc="Are you sure you want to sign out? You will need to sign in again to access your account."
      confirmText="Sign Out"
      destructive
      handleConfirm={handleSignOut}
      className="sm:max-w-sm"
    />
  );
}
