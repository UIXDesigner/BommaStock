"use server";

import { auth } from "../../auth";
import {
  saveAccountAddress,
  saveAccountBilling,
  saveAccountProfile,
  saveAccountTerms,
} from "./store";

type ActionState = { error?: string; success?: string };

async function requireCustomerId(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to update your account." };
  }
  return { ok: true, userId: session.user.id };
}

export async function updateProfileAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireCustomerId();
  if (!session.ok) {
    return { error: session.error };
  }
  const result = await saveAccountProfile({
    userId: session.userId,
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!result.ok) {
    return { error: result.error };
  }
  return { success: "Profile updated." };
}

export async function updateAddressAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireCustomerId();
  if (!session.ok) {
    return { error: session.error };
  }
  const result = await saveAccountAddress({
    userId: session.userId,
    line1: formData.get("line1"),
    line2: formData.get("line2"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
  });
  if (!result.ok) {
    return { error: result.error };
  }
  return { success: "Address saved." };
}

export async function updateBillingAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireCustomerId();
  if (!session.ok) {
    return { error: session.error };
  }
  const result = await saveAccountBilling({
    userId: session.userId,
    invoiceName: formData.get("invoiceName"),
    gstin: formData.get("gstin"),
  });
  if (!result.ok) {
    return { error: result.error };
  }
  return { success: "Billing details saved." };
}

export async function acceptTermsAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireCustomerId();
  if (!session.ok) {
    return { error: session.error };
  }
  const result = await saveAccountTerms({
    userId: session.userId,
    termsAccepted: formData.get("termsAccepted"),
  });
  if (!result.ok) {
    return { error: result.error };
  }
  return { success: "Terms accepted." };
}
