import { EmptyState } from "@bommastock/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders",
};

export default function AdminOrdersPage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:px-8"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Order number, customer, snapshots, and payment status will appear here
          after checkout is implemented.
        </p>
      </div>
      <EmptyState
        title="No orders yet"
        description="Paid orders with captured payments will list here. Snapshots are immutable."
      />
    </main>
  );
}
