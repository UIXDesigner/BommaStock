import { describe, expect, it } from "vitest";
import {
  findPriceChanges,
  removeCartLine,
  summarizeCart,
  upsertCartLine,
} from "./cart";

describe("upsertCartLine", () => {
  it("adds a new line and replaces the same asset license quote", () => {
    const first = upsertCartLine([], {
      assetId: "a1",
      assetLicenseId: "l1",
      quotedUnitPriceIncludingTaxPaise: 10_000,
    });
    const updated = upsertCartLine(first, {
      assetId: "a1",
      assetLicenseId: "l1",
      quotedUnitPriceIncludingTaxPaise: 12_000,
    });
    expect(updated).toEqual([
      {
        assetId: "a1",
        assetLicenseId: "l1",
        quotedUnitPriceIncludingTaxPaise: 12_000,
      },
    ]);
  });
});

describe("removeCartLine", () => {
  it("removes only the matching asset license", () => {
    const items = [
      {
        assetId: "a1",
        assetLicenseId: "l1",
        quotedUnitPriceIncludingTaxPaise: 10_000,
      },
      {
        assetId: "a1",
        assetLicenseId: "l2",
        quotedUnitPriceIncludingTaxPaise: 20_000,
      },
    ];
    expect(removeCartLine(items, "a1", "l1")).toEqual([items[1]]);
  });
});

describe("summarizeCart", () => {
  it("keeps tax null when no active rate is configured", () => {
    expect(
      summarizeCart(
        [
          {
            assetId: "a1",
            assetLicenseId: "l1",
            quotedUnitPriceIncludingTaxPaise: 11_800,
          },
        ],
        null,
      ),
    ).toEqual({
      itemCount: 1,
      totalIncludingTaxPaise: 11_800,
      taxPaise: null,
      beforeTaxPaise: null,
    });
  });

  it("extracts GST from inclusive line totals when a rate exists", () => {
    expect(
      summarizeCart(
        [
          {
            assetId: "a1",
            assetLicenseId: "l1",
            quotedUnitPriceIncludingTaxPaise: 11_800,
          },
        ],
        1_800,
      ),
    ).toEqual({
      itemCount: 1,
      totalIncludingTaxPaise: 11_800,
      taxPaise: 1_800,
      beforeTaxPaise: 10_000,
    });
  });
});

describe("findPriceChanges", () => {
  it("returns PRICE_CHANGED rows when live catalog prices differ", () => {
    expect(
      findPriceChanges(
        [
          {
            assetId: "a1",
            assetLicenseId: "l1",
            quotedUnitPriceIncludingTaxPaise: 10_000,
          },
        ],
        new Map([["l1", 12_000]]),
      ),
    ).toEqual([
      {
        assetId: "a1",
        assetLicenseId: "l1",
        previousPaise: 10_000,
        currentPaise: 12_000,
      },
    ]);
  });
});
