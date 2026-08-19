"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { getAssetById } from "../catalog/catalog";
import {
  addCartLine,
  getCartLines,
  removeCartItem,
  replaceCartQuotes,
} from "./store";

async function userId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function addToCartAction(formData: FormData): Promise<void> {
  const assetId = formString(formData, "assetId");
  const asset = await getAssetById(assetId);
  if (!asset) {
    return;
  }

  const requestedLicenseId = formString(formData, "assetLicenseId");
  const license =
    asset.licenses.find((option) => option.id === requestedLicenseId) ??
    asset.licenses.find((option) => option.isDefault) ??
    asset.licenses[0];
  if (!license) {
    return;
  }

  await addCartLine(await userId(), {
    assetId: asset.id,
    assetLicenseId: license.id,
    quotedUnitPriceIncludingTaxPaise: license.pricePaise,
  });
  revalidatePath("/", "layout");
}

export async function buyNowAction(formData: FormData): Promise<void> {
  await addToCartAction(formData);
  const session = await auth();
  if (session?.user?.id) {
    redirect("/checkout");
  }
  redirect("/login?callbackUrl=/checkout");
}

export async function removeCartItemAction(formData: FormData): Promise<void> {
  await removeCartItem(
    await userId(),
    formString(formData, "assetId"),
    formString(formData, "assetLicenseId"),
  );
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function updateCartLicenseAction(
  formData: FormData,
): Promise<void> {
  const assetId = formString(formData, "assetId");
  const previousLicenseId = formString(formData, "previousLicenseId");
  const nextLicenseId = formString(formData, "assetLicenseId");
  const asset = await getAssetById(assetId);
  const license = asset?.licenses.find((option) => option.id === nextLicenseId);
  if (!asset || !license) {
    return;
  }

  const id = await userId();
  await removeCartItem(id, assetId, previousLicenseId);
  await addCartLine(id, {
    assetId,
    assetLicenseId: license.id,
    quotedUnitPriceIncludingTaxPaise: license.pricePaise,
  });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function acceptCartPricesAction(): Promise<void> {
  const id = await userId();
  const lines = await getCartLines(id);
  const next = [];
  for (const line of lines) {
    const asset = await getAssetById(line.assetId);
    const license = asset?.licenses.find(
      (option) => option.id === line.assetLicenseId,
    );
    if (!asset || !license) {
      continue;
    }
    next.push({
      assetId: line.assetId,
      assetLicenseId: line.assetLicenseId,
      quotedUnitPriceIncludingTaxPaise: license.pricePaise,
    });
  }
  await replaceCartQuotes(id, next);
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
