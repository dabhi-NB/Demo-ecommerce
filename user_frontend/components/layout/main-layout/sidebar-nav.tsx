import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SidebarNavProps {
  items: {
    title: string;
    href: string;
    icon: React.ReactNode;
  }[];
  activeTab?: string;
}

export function SidebarNav({ items, activeTab }: SidebarNavProps) {
  let activeValue = "";
  if (activeTab) {
    const found = items.find(
      (i) =>
        i.title.toLowerCase().replace(/\s+/g, "") ===
        activeTab.toLowerCase().replace(/\s+/g, ""),
    );
    activeValue = found ? found.href : "";
  } else {
    activeValue = typeof window !== "undefined" ? window.location.pathname : "";
  }

  return (
    <div className="pt-3">
      {/* Desktop Navigation */}
      <ul className="hidden md:flex flex-row gap-2 w-full mb-6">
        {items.map((item) => {
          const isActive = item.href === activeValue;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-2 rounded",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {item.icon}
                <span className="ml-2">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Mobile Navigation */}
      <div className="md:hidden mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-center">
              {items.find((item) => item.href === activeValue)?.title ||
                "Navigation"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full  max-w-none" align="center">
            {items.map((item) => {
              const isActive = item.href === activeValue;
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center w-full px-4 py-3",
                      isActive && "bg-accent",
                    )}
                  >
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
