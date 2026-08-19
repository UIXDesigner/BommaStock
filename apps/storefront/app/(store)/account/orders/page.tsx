import { EmptyState, buttonVariants, cn } from "@bommastock/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "../../../../components/account-shell";

export const metadata: Metadata = {
  title: "Orders",
};

export default function OrdersPage() {
  return (
    <AccountShell
      title="Orders"
      description="Paid orders appear here after Razorpay capture. Nothing is listed until a payment is verified server-side."
    >
      <EmptyState
        title="No orders yet"
        description="When checkout completes, order number, licenses, amounts, and download access will show here."
        action={
          <Link
            href="/explore"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Browse images
          </Link>
        }
      />
    </AccountShell>
  );
}
