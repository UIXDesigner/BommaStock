import type { PriceChangedItem } from "@bommastock/types";
import { extractGst } from "./gst";

export type CartLineInput = {
  assetId: string;
  assetLicenseId: string;
  quotedUnitPriceIncludingTaxPaise: number;
};

export function upsertCartLine(
  items: CartLineInput[],
  line: CartLineInput,
): CartLineInput[] {
  const next = items.filter(
    (item) =>
      !(
        item.assetId === line.assetId &&
        item.assetLicenseId === line.assetLicenseId
      ),
  );
  next.push(line);
  return next;
}

export function removeCartLine(
  items: CartLineInput[],
  assetId: string,
  assetLicenseId: string,
): CartLineInput[] {
  return items.filter(
    (item) =>
      !(item.assetId === assetId && item.assetLicenseId === assetLicenseId),
  );
}

export function summarizeCart(
  items: CartLineInput[],
  taxRateBps: number | null,
): {
  itemCount: number;
  totalIncludingTaxPaise: number;
  taxPaise: number | null;
  beforeTaxPaise: number | null;
} {
  const totalIncludingTaxPaise = items.reduce(
    (sum, item) => sum + item.quotedUnitPriceIncludingTaxPaise,
    0,
  );

  if (taxRateBps === null) {
    return {
      itemCount: items.length,
      totalIncludingTaxPaise,
      taxPaise: null,
      beforeTaxPaise: null,
    };
  }

  let taxPaise = 0;
  for (const item of items) {
    taxPaise += extractGst(
      item.quotedUnitPriceIncludingTaxPaise,
      taxRateBps,
    ).taxPaise;
  }

  return {
    itemCount: items.length,
    totalIncludingTaxPaise,
    taxPaise,
    beforeTaxPaise: totalIncludingTaxPaise - taxPaise,
  };
}

export function findPriceChanges(
  items: CartLineInput[],
  livePricesByLicenseId: Map<string, number>,
): PriceChangedItem[] {
  const changes: PriceChangedItem[] = [];
  for (const item of items) {
    const currentPaise = livePricesByLicenseId.get(item.assetLicenseId);
    if (
      currentPaise === undefined ||
      currentPaise === item.quotedUnitPriceIncludingTaxPaise
    ) {
      continue;
    }
    changes.push({
      assetId: item.assetId,
      assetLicenseId: item.assetLicenseId,
      previousPaise: item.quotedUnitPriceIncludingTaxPaise,
      currentPaise,
    });
  }
  return changes;
}
