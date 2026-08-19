"use client";

import { buttonVariants, cn, SearchBar } from "@bommastock/ui";
import { Heart, Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "./brand-logo";
import type { CatalogCategory } from "../lib/catalog/types";

export type HeaderUser = {
  email: string;
  name?: string | null;
};

export function SiteHeader({
  user,
  categories,
  cartCount = 0,
  favoriteCount = 0,
}: {
  user: HeaderUser | null;
  categories: CatalogCategory[];
  cartCount?: number;
  favoriteCount?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandLogo />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex">
          <Link
            href="/explore"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Explore
          </Link>
          <Link
            href="/new"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            New
          </Link>
          <Link
            href="/categories"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Categories
          </Link>
          {categories.slice(0, 4).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {category.name}
            </Link>
          ))}
        </nav>
        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBar
            id="header-search"
            size="sm"
            showSubmitButton={false}
            placeholder="Search the library"
          />
        </div>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Link
            href="/favorites"
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              "relative",
            )}
            aria-label={
              favoriteCount > 0
                ? `Favorites, ${String(favoriteCount)} saved`
                : "Favorites"
            }
          >
            <Heart className="size-4" />
            <span className="sr-only">Favorites</span>
            {favoriteCount > 0 ? (
              <span className="absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
                {favoriteCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/cart"
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "relative gap-2",
            )}
            aria-label={
              cartCount > 0 ? `Cart, ${String(cartCount)} items` : "Cart"
            }
          >
            <ShoppingBag className="size-4" />
            Cart
            {cartCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] leading-5 text-primary-foreground">
                {cartCount}
              </span>
            ) : null}
          </Link>
          {user ? (
            <Link
              href="/account"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Account
            </Link>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
              Sign in
            </Link>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <Link
            href="/favorites"
            className="inline-flex size-10 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Favorites"
          >
            <Heart className="size-5" />
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex size-10 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={
              cartCount > 0 ? `Cart, ${String(cartCount)} items` : "Cart"
            }
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
            ) : null}
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-border px-4 py-4 md:hidden"
        >
          <SearchBar
            id="mobile-search"
            size="sm"
            showSubmitButton={false}
            className="mb-4"
          />
          <ul className="flex flex-col gap-3">
            <li>
              <Link href="/explore" onClick={() => setOpen(false)}>
                Explore
              </Link>
            </li>
            <li>
              <Link href="/new" onClick={() => setOpen(false)}>
                New
              </Link>
            </li>
            <li>
              <Link href="/categories" onClick={() => setOpen(false)}>
                Categories
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="block py-1 text-sm"
                  onClick={() => setOpen(false)}
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              {user ? (
                <Link href="/account" onClick={() => setOpen(false)}>
                  Account
                </Link>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
              )}
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
