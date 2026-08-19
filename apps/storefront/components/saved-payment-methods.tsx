import { EmptyState } from "@bommastock/ui";
import { isRazorpayConfigured } from "@bommastock/payments";
import Link from "next/link";

export function SavedPaymentMethods() {
  const configured = isRazorpayConfigured();

  return (
    <div className="flex flex-col gap-4">
      <EmptyState
        title="No saved cards"
        description={
          configured
            ? "Cards, UPI, and net banking are entered securely in Razorpay Checkout. Bommastock never stores card numbers, PAN, or CVV."
            : "Cards are added at Razorpay Checkout when payment keys exist. This screen is complete; card storage is not faked, and no Razorpay secrets are invented."
        }
      />
      <p className="text-sm text-muted-foreground">
        Pay from{" "}
        <Link
          href="/checkout"
          className="font-medium underline-offset-4 hover:underline"
        >
          checkout
        </Link>{" "}
        after adding licensed images to your cart. UPI IDs can be entered there
        later when Checkout is live.
      </p>
    </div>
  );
}
