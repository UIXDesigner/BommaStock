import { describe, expect, it } from "vitest";
import { extractGst } from "./gst";

describe("extractGst", () => {
  it("extracts 18% GST from an inclusive ₹118.00 amount", () => {
    expect(extractGst(11_800, 1_800)).toEqual({
      taxPaise: 1_800,
      beforeTaxPaise: 10_000,
    });
  });

  it("returns zero tax for a zero inclusive amount", () => {
    expect(extractGst(0, 1_800)).toEqual({
      taxPaise: 0,
      beforeTaxPaise: 0,
    });
  });

  it("returns zero tax when the rate is 0 bps", () => {
    expect(extractGst(10_000, 0)).toEqual({
      taxPaise: 0,
      beforeTaxPaise: 10_000,
    });
  });

  it("rounds half up on a non-integer paise split", () => {
    expect(extractGst(10_000, 1_800)).toEqual({
      taxPaise: 1_525,
      beforeTaxPaise: 8_475,
    });
  });
});
