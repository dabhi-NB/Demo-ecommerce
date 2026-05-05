import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import AppConfig from '@/appConfig';
import { Settings, LogOut, UserIcon } from 'lucide-react';  
import { Link } from 'react-router-dom';
import { ConfirmationDialog } from '@/pages/admin/layouts/component/ConfirmationDialog'; 

export function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
  const initials = fullName ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'SN';
  const userEmail = user?.email || '';
  const avatarUrl = user?.image
    ? (user.image.startsWith('http') ? user.image : `${AppConfig.API_URL.replace(/\/$/, '')}/upload/profile/${user.image}`)
    : '';

  return (
    <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName || 'User'} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
            <Avatar className="h-8 w-8">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName || 'User'} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm leading-none font-medium">{fullName || 'User'}</p>
              <p className="text-muted-foreground text-xs leading-none">
                {userEmail}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/admin/account/update">
              <UserIcon />
              My Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/admin/setting/update">
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <ConfirmationDialog
          title="Are you sure you want to sign out?"
          description="This action will log you out of your account. You will need to sign in again to access your account."
          confirmText="Sign out"
          onConfirm={() => { logout(); navigate('/'); }}
        >
          <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </ConfirmationDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
