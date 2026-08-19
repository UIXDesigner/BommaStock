import { Button } from "@bommastock/ui";
import type { ReactNode } from "react";
import { signOutAction } from "../lib/auth-actions";
import { AdminMobileNav, AdminSidebar } from "./admin-nav";

export function AdminHeader({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border px-4 md:px-6">
      <p className="truncate text-sm text-muted-foreground">
        {name ? `${name} · ` : ""}
        {email}
      </p>
      <form action={signOutAction}>
        <Button type="submit" size="sm" variant="outline">
          Sign out
        </Button>
      </form>
    </header>
  );
}

export function AdminShell({
  children,
  email,
  name,
}: {
  children: ReactNode;
  email: string;
  name?: string | null;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader email={email} name={name} />
        <AdminMobileNav />
        <div className="flex-1 bg-secondary/30">{children}</div>
      </div>
    </div>
  );
}
