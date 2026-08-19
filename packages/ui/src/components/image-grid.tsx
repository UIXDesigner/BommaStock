import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export type ImageGridProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function ImageGrid({ children, className, ...props }: ImageGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4 2xl:grid-cols-5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
