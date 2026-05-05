import { useLocation, Link } from "react-router";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { Monitor, Lock, User, Key, History } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarNavItems = [
  {
    title: "Account",
    href: "/admin/account/update",
    icon: <User size={18} />,
  },
  {
    title: "Password Change",
    href: "/admin/account/change_password",
    icon: <Key size={18} className="rotate-45" />,
  },
  {
    title: "Two Factor Authentication",
    href: "/admin/account/tfa",
    icon: <Lock size={18} />,
  },
  {
    title: "Device",
    href: "/admin/account/device",
    icon: <Monitor size={18} />,
  },
  {
    title: "Activity",
    href: "/admin/account/user-activity",
    icon: <History size={18} />,
  },
];

export function AccountBlock() {
  const location = useLocation();

  return (
    <>
      {/* Mobile Menu */}
      <div className="lg:hidden w-full bg-card rounded-md mb-6">
        <div className="flex flex-col">
          {sidebarNavItems.map((item, index) => {
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "px-4 py-3.5 text-sm font-medium flex items-center gap-2.5 transition-colors",
                  index !== 0 && "border-t border-border",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent active:bg-accent",
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-full lg:w-64 shrink-0 lg:mr-8">
        <SidebarNav items={sidebarNavItems} />
      </aside>
    </>
  );
}
