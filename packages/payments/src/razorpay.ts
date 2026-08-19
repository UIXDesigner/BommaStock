import type { PaymentStatus } from "@bommastock/types";

/** Razorpay Orders API: auto-capture. Do not call Razorpay from this package in Phase 1. */
export const RAZORPAY_PAYMENT_CAPTURE = 1;

export function isRazorpayConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(env.NEXT_PUBLIC_RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

const RAZORPAY_PAYMENT_STATUS_MAP = {
  created: "PENDING",
  attempted: "PENDING",
  authorized: "AUTHORIZED",
  captured: "CAPTURED",
  failed: "FAILED",
  refunded: "REFUNDED",
} as const satisfies Record<string, PaymentStatus>;

export function mapRazorpayPaymentStatus(
  providerStatus: string,
): PaymentStatus | undefined {
  const key = providerStatus.trim().toLowerCase();
  if (key === "cancelled" || key === "canceled" || key === "expired") {
    return "CANCELLED";
  }
  if (key in RAZORPAY_PAYMENT_STATUS_MAP) {
    return RAZORPAY_PAYMENT_STATUS_MAP[
      key as keyof typeof RAZORPAY_PAYMENT_STATUS_MAP
    ];
  }
  return undefined;
}
