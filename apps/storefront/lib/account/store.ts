import {
  acceptTermsSchema,
  isAuthConfigured,
  updateAddressSchema,
  updateBillingProfileSchema,
  updateProfileSchema,
} from "@bommastock/auth";
import {
  acceptCustomerTerms,
  getCustomerAddress,
  getCustomerBillingProfile,
  getCustomerProfile,
  updateCustomerProfile,
  upsertCustomerAddress,
  upsertCustomerBillingProfile,
  type CustomerAddressRecord,
  type CustomerBillingRecord,
} from "@bommastock/auth/next";
import { cookies } from "next/headers";

export const ACCOUNT_COOKIE = "bommastock.storefront.account";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type AccountAddress = CustomerAddressRecord;
export type AccountBilling = CustomerBillingRecord;

export type AccountSnapshot = {
  email: string;
  name: string | null;
  phone: string | null;
  termsAcceptedAt: string | null;
  address: AccountAddress | null;
  billing: AccountBilling | null;
  persisted: "database" | "session";
};

type SessionAccountCookie = {
  name?: string | null;
  phone?: string | null;
  termsAcceptedAt?: string | null;
  address?: AccountAddress | null;
  billing?: AccountBilling | null;
};

type AccountCookieStore = Record<string, SessionAccountCookie>;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
  };
}

function parseCookieStore(value: string | undefined): AccountCookieStore {
  if (!value) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    return parsed as AccountCookieStore;
  } catch {
    return {};
  }
}

async function readCookieStore(): Promise<AccountCookieStore> {
  const store = await cookies();
  return parseCookieStore(store.get(ACCOUNT_COOKIE)?.value);
}

async function writeCookieStore(next: AccountCookieStore): Promise<void> {
  const store = await cookies();
  store.set(ACCOUNT_COOKIE, JSON.stringify(next), cookieOptions());
}

async function patchCookie(
  userId: string,
  patch: SessionAccountCookie,
): Promise<void> {
  const all = await readCookieStore();
  all[userId] = { ...all[userId], ...patch };
  await writeCookieStore(all);
}

export async function getAccountSnapshot(input: {
  userId: string;
  email: string;
  name?: string | null;
}): Promise<AccountSnapshot> {
  if (isAuthConfigured()) {
    const [profile, address, billing] = await Promise.all([
      getCustomerProfile(input.userId),
      getCustomerAddress(input.userId),
      getCustomerBillingProfile(input.userId),
    ]);
    return {
      email: profile?.email ?? input.email,
      name: profile?.name ?? input.name ?? null,
      phone: profile?.phone ?? null,
      termsAcceptedAt: profile?.termsAcceptedAt?.toISOString() ?? null,
      address,
      billing,
      persisted: "database",
    };
  }

  const cookie = (await readCookieStore())[input.userId] ?? {};
  return {
    email: input.email,
    name: cookie.name ?? input.name ?? null,
    phone: cookie.phone ?? null,
    termsAcceptedAt: cookie.termsAcceptedAt ?? null,
    address: cookie.address ?? null,
    billing: cookie.billing ?? null,
    persisted: "session",
  };
}

export async function saveAccountProfile(input: {
  userId: string;
  name: unknown;
  phone: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isAuthConfigured()) {
    return updateCustomerProfile(input);
  }
  const parsed = updateProfileSchema.safeParse({
    name: input.name,
    phone: input.phone,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  }
  await patchCookie(input.userId, {
    name: parsed.data.name,
    phone: parsed.data.phone,
  });
  return { ok: true };
}

export async function saveAccountAddress(input: {
  userId: string;
  line1: unknown;
  line2: unknown;
  city: unknown;
  state: unknown;
  postalCode: unknown;
  country: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isAuthConfigured()) {
    const result = await upsertCustomerAddress(input);
    return result.ok ? { ok: true } : result;
  }
  const parsed = updateAddressSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid address.",
    };
  }
  await patchCookie(input.userId, { address: parsed.data });
  return { ok: true };
}

export async function saveAccountBilling(input: {
  userId: string;
  invoiceName: unknown;
  gstin: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isAuthConfigured()) {
    const result = await upsertCustomerBillingProfile(input);
    return result.ok ? { ok: true } : result;
  }
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
  await patchCookie(input.userId, { billing: parsed.data });
  return { ok: true };
}

export async function saveAccountTerms(input: {
  userId: string;
  termsAccepted: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isAuthConfigured()) {
    return acceptCustomerTerms(input);
  }
  const parsed = acceptTermsSchema.safeParse({
    termsAccepted: input.termsAccepted,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  }
  const existing = (await readCookieStore())[input.userId];
  await patchCookie(input.userId, {
    termsAcceptedAt: existing?.termsAcceptedAt ?? new Date().toISOString(),
  });
  return { ok: true };
}
