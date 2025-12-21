import * as React from "react";
import { cn } from "@/lib/utils";

interface ThemeAwareCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ThemeAwareCard({ children, className, ...props }: ThemeAwareCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        "bg-card text-card-foreground",
        "border border-border/50",
        "shadow-sm hover:shadow-md",
        "dark:bg-card dark:border-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
