"use client";

import { buttonVariants, cn } from "@bommastock/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/profile", label: "Profile", exact: false },
  { href: "/account/settings", label: "Settings", exact: false },
  { href: "/account/orders", label: "Orders", exact: false },
  { href: "/account/downloads", label: "Downloads", exact: false },
  { href: "/favorites", label: "Favorites", exact: false },
] as const;

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              buttonVariants({
                size: "sm",
                variant: active ? "default" : "outline",
              }),
            )}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
