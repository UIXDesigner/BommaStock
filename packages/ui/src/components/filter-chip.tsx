import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export type FilterChipProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function FilterChip({ href, children, className }: FilterChipProps) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
      <span aria-hidden="true">×</span>
    </a>
  );
}
