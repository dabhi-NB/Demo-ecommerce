import { useAuth } from '@/context/AuthContext';
import { ThemeSwitch } from './ThemeSwitch';
import { ProfileDropdown } from './ProfileDropdown';
import { NavUser } from './nav-user';
import AppConfig from '@/appConfig';

// AppHeader component to provide navbar UI for main layout
export function AppHeader() {
  const { user } = useAuth();

  const avatarUrl = user?.image
    ? (user.image.startsWith('http')
        ? user.image
        : `${AppConfig.API_URL.replace(/\/$/, '')}/upload/profile/${user.image}`)
    : '';

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-background border-b">
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg">Admin Panel</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitch />
        <ProfileDropdown />
        {user && <NavUser user={{ name: `${user.first_name} ${user.last_name}`.trim() || 'User', email: user.email || '', avatar: avatarUrl }} />}
      </div>
    </header>
  );
}

// Re-export types and components for convenience
export { NavGroup, type NavItem, type NavGroupProps, type NavLink, type NavCollapsible } from './nav-group';





