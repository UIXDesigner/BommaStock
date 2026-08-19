import { getPrisma } from "@bommastock/database";
import { updateAddressSchema, updateBillingProfileSchema } from "./schemas";
import { isAuthConfigured } from "./types";

export type CustomerAddressRecord = {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type CustomerBillingRecord = {
  invoiceName: string | null;
  gstin: string | null;
};

export async function getCustomerAddress(
  userId: string,
): Promise<CustomerAddressRecord | null> {
  if (!isAuthConfigured()) {
    return null;
  }
  const prisma = getPrisma();
  const address = await prisma.address.findUnique({ where: { userId } });
  if (!address) {
    return null;
  }
  return {
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  };
}

export async function upsertCustomerAddress(input: {
  userId: string;
  line1: unknown;
  line2: unknown;
  city: unknown;
  state: unknown;
  postalCode: unknown;
  country: unknown;
}): Promise<
  { ok: true; address: CustomerAddressRecord } | { ok: false; error: string }
> {
  const parsed = updateAddressSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid address.",
    };
  }
  if (!isAuthConfigured()) {
    return {
      ok: false,
      error:
        "Authentication is not configured. Set DATABASE_URL and AUTH_SECRET.",
    };
  }

  const prisma = getPrisma();
  const address = await prisma.address.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      ...parsed.data,
    },
    update: parsed.data,
  });
  return {
    ok: true,
    address: {
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
  };
}

export async function getCustomerBillingProfile(
  userId: string,
): Promise<CustomerBillingRecord | null> {
  if (!isAuthConfigured()) {
    return null;
  }
  const prisma = getPrisma();
  const billing = await prisma.billingProfile.findUnique({
    where: { userId },
  });
  if (!billing) {
    return null;
  }
  return {
    invoiceName: billing.invoiceName,
    gstin: billing.gstin,
  };
}

export async function upsertCustomerBillingProfile(input: {
  userId: string;
  invoiceName: unknown;
  gstin: unknown;
}): Promise<
  { ok: true; billing: CustomerBillingRecord } | { ok: false; error: string }
> {
  const parsed = updateBillingProfileSchema.safeParse({
    invoiceName: input.invoiceName,
    gstin: input.gstin,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid billing details.",
    };
  }
  if (!isAuthConfigured()) {
    return {
      ok: false,
      error:
        "Authentication is not configured. Set DATABASE_URL and AUTH_SECRET.",
    };
  }

  const prisma = getPrisma();
  const billing = await prisma.billingProfile.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      invoiceName: parsed.data.invoiceName,
      gstin: parsed.data.gstin,
    },
    update: {
      invoiceName: parsed.data.invoiceName,
      gstin: parsed.data.gstin,
    },
  });
  return {
    ok: true,
    billing: {
      invoiceName: billing.invoiceName,
      gstin: billing.gstin,
    },
  };
}
