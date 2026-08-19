import type { ReactNode } from "react";
import { AccountNav } from "./account-nav";

export function AccountShell({
  title,
  description,
  notice,
  children,
}: {
  title: string;
  description?: string;
  notice?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 md:px-6 md:py-16"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <AccountNav />
      {notice}
      {children}
    </main>
  );
}

export function PersistenceNotice({
  persisted,
}: {
  persisted: "database" | "session";
}) {
  if (persisted === "database") {
    return null;
  }
  return (
    <p
      className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
      role="status"
    >
      Authentication is not fully configured. Profile, address, billing, and
      terms are saved in a secure browser cookie for this session until
      DATABASE_URL and AUTH_SECRET are set. You still cannot store card numbers
      here.
    </p>
  );
}
