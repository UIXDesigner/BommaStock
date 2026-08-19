import { EmptyState } from "@bommastock/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
};

export default function AdminCustomersPage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:px-8"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Customer accounts, purchase counts, and disable actions will live
          here. Password hashes are never shown.
        </p>
      </div>
      <EmptyState
        title="No customers yet"
        description="Registered storefront customers will appear here after the database is connected."
      />
    </main>
  );
}
