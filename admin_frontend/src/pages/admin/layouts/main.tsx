import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, LayoutProvider } from "./component/main_sidebar";
import { ThemeSwitch } from "./component/ThemeSwitch";
import { ProfileDropdown } from "./component/ProfileDropdown";

// Header component
type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
  ref?: React.Ref<HTMLElement>;
};

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop);
    };

    // Add scroll listener to the body
    document.addEventListener("scroll", onScroll, { passive: true });

    // Clean up the event listener on unmount
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "z-50 h-16",
        fixed && "header-fixed peer/header sticky top-0 w-[inherit]",
        offset > 10 && fixed ? "shadow" : "shadow-none",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "relative flex h-full items-center gap-3 p-4 sm:gap-4",
          offset > 10 &&
            fixed &&
            "after:bg-background/20 after:absolute after:inset-0 after:-z-10 after:backdrop-blur-lg",
        )}
      >
        <SidebarTrigger variant="outline" className="max-md:scale-125" />
        <Separator orientation="vertical" className="h-6" />
        {children}
      </div>
    </header>
  );
}

// Main component
type MainProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
  fluid?: boolean;
  ref?: React.Ref<HTMLElement>;
};

export function Main({ fixed, className, fluid, ...props }: MainProps) {
  return (
    <main
      data-layout={fixed ? "fixed" : "auto"}
      className={cn(
        "px-4 py-6",
        fixed && "flex grow flex-col overflow-hidden",
        !fluid &&
          "@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl",
        className,
      )}
      {...props}
    />
  );
}

// AuthenticatedLayout component
type AuthenticatedLayoutProps = {
  children?: React.ReactNode;
};

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset
          className={cn(
            "@container/content",
            "has-data-[layout=fixed]:h-svh",
            "peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]",
          )}
        >
          <Header>
            {/* <TopNav links={topNavLinks} /> */}
            <div className="ms-auto flex items-center space-x-4">
              {/* <Search /> */}
              <ThemeSwitch />
              {/* <ConfigDrawer /> */}
              <ProfileDropdown />
            </div>
          </Header>
          <Main>{children}</Main>
        </SidebarInset>
      </SidebarProvider>
    </LayoutProvider>
  );
}
