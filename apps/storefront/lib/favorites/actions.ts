"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { toggleFavorite } from "./store";

export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const assetId = formData.get("assetId");
  if (typeof assetId !== "string" || !assetId) {
    return;
  }
  const session = await auth();
  await toggleFavorite(session?.user?.id ?? null, assetId);
  revalidatePath("/", "layout");
}
