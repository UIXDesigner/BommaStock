import { describe, expect, it } from "vitest";
import { normalizeIndianMobile } from "./india";
import {
  registerSchema,
  updateAddressSchema,
  updateBillingProfileSchema,
  updateProfileSchema,
} from "./schemas";

describe("registerSchema", () => {
  it("requires terms acceptance", () => {
    const parsed = registerSchema.safeParse({
      email: "customer@example.com",
      password: "longenoughpassword",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a valid registration with terms", () => {
    const parsed = registerSchema.safeParse({
      name: "Rajesh",
      email: "Customer@Example.com",
      password: "longenoughpassword",
      termsAccepted: "on",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("customer@example.com");
      expect(parsed.data.termsAccepted).toBe(true);
    }
  });
});

describe("updateProfileSchema", () => {
  it("normalizes an Indian mobile number", () => {
    const parsed = updateProfileSchema.safeParse({
      name: "Rajesh Lanka",
      phone: "09876543210",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phone).toBe("+919876543210");
    }
  });

  it("rejects an invalid mobile number", () => {
    const parsed = updateProfileSchema.safeParse({
      name: "Rajesh",
      phone: "12345",
    });
    expect(parsed.success).toBe(false);
  });

  it("allows clearing the phone", () => {
    const parsed = updateProfileSchema.safeParse({
      name: "Rajesh",
      phone: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phone).toBeNull();
    }
  });
});

describe("updateAddressSchema", () => {
  it("stores an Indian billing address", () => {
    const parsed = updateAddressSchema.safeParse({
      line1: "12 Temple Street",
      line2: "",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500001",
      country: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.country).toBe("IN");
      expect(parsed.data.line2).toBeNull();
    }
  });

  it("rejects a non-Indian country", () => {
    const parsed = updateAddressSchema.safeParse({
      line1: "12 Temple Street",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500001",
      country: "US",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("updateBillingProfileSchema", () => {
  it("accepts a valid GSTIN and invoice name", () => {
    const parsed = updateBillingProfileSchema.safeParse({
      invoiceName: "Lanka Studio",
      gstin: "36AABCU9603R1ZV",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.gstin).toBe("36AABCU9603R1ZV");
    }
  });

  it("rejects an invalid GSTIN", () => {
    const parsed = updateBillingProfileSchema.safeParse({
      invoiceName: "Lanka Studio",
      gstin: "NOT-A-GSTIN",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("normalizeIndianMobile", () => {
  it("accepts +91 and 10-digit numbers", () => {
    expect(normalizeIndianMobile("+91 98765 43210")).toBe("+919876543210");
    expect(normalizeIndianMobile("9876543210")).toBe("+919876543210");
  });
});
