import type { ReactNode } from "react";
import { PriceDisplay } from "./price-display";
import { cn } from "../lib/utils";

export type ImageCardOrientation = "LANDSCAPE" | "PORTRAIT" | "SQUARE";

export type ImageCardProps = {
  href: string;
  title: string;
  thumbnailUrl: string;
  previewUrl?: string;
  categoryName: string;
  metadata: string;
  pricePaise: number;
  orientation?: ImageCardOrientation;
  width?: number;
  height?: number;
  layout?: "framed" | "natural";
  overlay?: ReactNode;
  action?: ReactNode;
  className?: string;
};

function aspectClass(orientation?: ImageCardOrientation): string {
  if (orientation === "PORTRAIT") {
    return "aspect-[3/4]";
  }
  if (orientation === "SQUARE") {
    return "aspect-square";
  }
  return "aspect-[3/2]";
}

export function ImageCard({
  href,
  title,
  thumbnailUrl,
  previewUrl,
  categoryName,
  metadata,
  pricePaise,
  orientation,
  width,
  height,
  layout = "framed",
  overlay,
  action,
  className,
}: ImageCardProps) {
  const natural = layout === "natural";

  return (
    <article
      className={cn(
        "group flex flex-col gap-3",
        natural && "mb-4 break-inside-avoid",
        className,
      )}
    >
      <div className="relative">
        <a
          href={href}
          className="relative block overflow-hidden rounded-lg bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {natural ? (
            <img
              src={thumbnailUrl}
              alt={title}
              width={width}
              height={height}
              loading="lazy"
              decoding="async"
              className={cn(
                "h-auto w-full transition duration-300",
                previewUrl ? "group-hover:opacity-0" : "group-hover:opacity-95",
              )}
            />
          ) : (
            <div className={cn("relative w-full", aspectClass(orientation))}>
              <img
                src={thumbnailUrl}
                alt={title}
                loading="lazy"
                decoding="async"
                className={cn(
                  "absolute inset-0 size-full object-cover transition duration-300",
                  previewUrl
                    ? "group-hover:opacity-0"
                    : "group-hover:scale-[1.02]",
                )}
              />
            </div>
          )}
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className={cn(
                "absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100",
              )}
            />
          ) : null}
        </a>
        {overlay ? (
          <div className="absolute top-2 right-2 z-10 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            {overlay}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium tracking-tight text-balance">
          <a
            href={href}
            className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {title}
          </a>
        </h3>
        <p className="text-xs text-muted-foreground">{categoryName}</p>
        <p className="text-xs text-muted-foreground">{metadata}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <PriceDisplay paise={pricePaise} className="text-sm font-medium" />
          {action}
        </div>
      </div>
    </article>
  );
}
