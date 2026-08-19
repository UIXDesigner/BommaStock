const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Display helper only. Charging always uses integer paise on the server. */
export function formatInrFromPaise(paise: number): string {
  if (!Number.isInteger(paise) || paise < 0) {
    throw new Error("paise must be a non-negative integer.");
  }

  return inrFormatter.format(paise / 100);
}
