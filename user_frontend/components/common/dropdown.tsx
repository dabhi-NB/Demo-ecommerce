"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useAuth } from "@/context/AuthContext";
import AppConfig from "@/appConfig";
import { UserIcon, Power } from "lucide-react";

const getImageUrl = (image: string | null | undefined) => {
  if (!image) return undefined;
  if (image.startsWith("http")) return image;
  return AppConfig.ADMIN_API_URL + "upload/user_profile/" + image;
};

export function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  const displayName = user ? `${user.first_name} ${user.last_name}` : "User";
  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "U";

  const handleSignOut = () => {
    logout();
    window.location.href = "/auth/login"; // Redirect to login after logout
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
            <div className="relative h-full w-full">
              <Avatar className="h-full w-full">
                <AvatarImage src={getImageUrl(user?.image)} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              {/* Dot inside avatar */}
              <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-green-500 border border-white" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <Link href="/account/update">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={getImageUrl(user?.image)}
                    alt={displayName}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>{" "}
              </div>
            </Link>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/account/update"></Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setOpen(true)}>
            <Power /> Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={!!open}
        onOpenChange={setOpen}
        title="Log Out"
        desc="Are you sure you want to Log out? You will need to login again to access your account."
        confirmText="Log Out"
        handleConfirm={handleSignOut}
        destructive
      />
    </>
  );
}
