import { EmptyState, buttonVariants, cn } from "@bommastock/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "../../../../components/account-shell";

export const metadata: Metadata = {
  title: "Downloads",
};

export default function DownloadsPage() {
  return (
    <AccountShell
      title="Downloads"
      description="Master files are delivered as short-lived signed URLs after a paid, captured order. Keys and original storage paths are never shown here."
    >
      <EmptyState
        title="No downloads yet"
        description="Purchased assets will appear here with license details and a download action."
        action={
          <Link
            href="/account/orders"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            View orders
          </Link>
        }
      />
    </AccountShell>
  );
}
