import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export type ImageMasonryProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function ImageMasonry({
  children,
  className,
  ...props
}: ImageMasonryProps) {
  return (
    <div
      className={cn(
        "columns-2 gap-4 md:columns-3 md:gap-6 xl:columns-4 2xl:columns-5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
