import { requireAdmin } from "@bommastock/auth/next";
import type { ReactNode } from "react";
import { auth } from "../../auth";
import { AdminShell } from "../../components/admin-shell";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin(() => auth());
  return (
    <AdminShell email={session.user.email} name={session.user.name}>
      {children}
    </AdminShell>
  );
}
