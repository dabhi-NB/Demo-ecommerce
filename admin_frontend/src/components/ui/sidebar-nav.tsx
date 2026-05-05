import { useLocation, Link } from "react-router";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface SidebarNavProps {
  items: {
    title: string;
    href: string;
    icon: React.ReactNode;
  }[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const location = useLocation();

  return (
    <nav className="flex items-center pl-12 pr-2 text-sm font-medium lg:pr-4 space-x-4">
      {items.map((item) => {
        const isActive = location.pathname === item.href;

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "justify-start transition-colors duration-200",
              isActive
                ? "bg-primary text-primary-foreground cursor-default" // active: no hover effect
                : "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground", // inactive: hover effect
            )}
          >
            {item.icon}
            <span className="ml-2">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
