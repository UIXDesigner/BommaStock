export function extractGst(
  inclusivePaise: number,
  rateBps: number,
): { taxPaise: number; beforeTaxPaise: number } {
  if (!Number.isInteger(inclusivePaise) || inclusivePaise < 0) {
    throw new Error("inclusivePaise must be a non-negative integer.");
  }
  if (!Number.isInteger(rateBps) || rateBps < 0) {
    throw new Error("rateBps must be a non-negative integer.");
  }

  const divisor = 10_000 + rateBps;
  const numerator = inclusivePaise * rateBps;
  const taxPaise = Math.floor((numerator + Math.floor(divisor / 2)) / divisor);
  const beforeTaxPaise = inclusivePaise - taxPaise;

  return { taxPaise, beforeTaxPaise };
}
