import { cn } from "@/lib/utils";
import React from "react";

type MainProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
  fluid?: boolean;
  ref?: React.Ref<HTMLElement>;
};

export function MainContent({ fixed, className, fluid, ...props }: MainProps) {
  return (
    <main
      data-layout={fixed ? "fixed" : "auto"}
      className={cn(
        "py-6 min-h-screen",
        fixed && "flex grow flex-col overflow-hidden",
        !fluid && "max-w-7xl mx-auto w-full",
        className,
      )}
      {...props}
    />
  );
}
