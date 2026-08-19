import { getPrisma } from "@bommastock/database";
import { cookies } from "next/headers";
import { getCatalogSource, listAssetsByIds } from "../catalog/catalog";
import type { CatalogAsset } from "../catalog/types";

export const FAVORITES_COOKIE = "bommastock.storefront.favorites";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
  };
}

function parseIds(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    );
  } catch {
    return [];
  }
}

async function readCookieIds(): Promise<string[]> {
  const store = await cookies();
  return parseIds(store.get(FAVORITES_COOKIE)?.value);
}

async function writeCookieIds(ids: string[]): Promise<void> {
  const store = await cookies();
  store.set(FAVORITES_COOKIE, JSON.stringify(ids), cookieOptions());
}

async function useLiveFavorites(userId: string | null): Promise<boolean> {
  return Boolean(userId) && (await getCatalogSource()) === "live";
}

export async function getFavoriteIds(userId: string | null): Promise<string[]> {
  if (await useLiveFavorites(userId)) {
    const prisma = getPrisma();
    const rows = await prisma.favorite.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: "desc" },
      select: { assetId: true },
    });
    return rows.map((row) => row.assetId);
  }
  return readCookieIds();
}

export async function isFavorite(
  userId: string | null,
  assetId: string,
): Promise<boolean> {
  const ids = await getFavoriteIds(userId);
  return ids.includes(assetId);
}

export async function toggleFavorite(
  userId: string | null,
  assetId: string,
): Promise<void> {
  if (await useLiveFavorites(userId)) {
    const prisma = getPrisma();
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_assetId: { userId: userId as string, assetId },
      },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return;
    }
    await prisma.favorite.create({
      data: { userId: userId as string, assetId },
    });
    return;
  }

  const ids = await readCookieIds();
  if (ids.includes(assetId)) {
    await writeCookieIds(ids.filter((id) => id !== assetId));
    return;
  }
  await writeCookieIds([assetId, ...ids]);
}

export async function listFavoriteAssets(
  userId: string | null,
): Promise<CatalogAsset[]> {
  const ids = await getFavoriteIds(userId);
  return listAssetsByIds(ids);
}

export async function mergeGuestFavorites(userId: string): Promise<void> {
  if ((await getCatalogSource()) !== "live") {
    return;
  }

  const ids = await readCookieIds();
  if (ids.length === 0) {
    return;
  }

  const prisma = getPrisma();
  for (const assetId of ids) {
    try {
      await prisma.favorite.upsert({
        where: { userId_assetId: { userId, assetId } },
        create: { userId, assetId },
        update: {},
      });
    } catch {
      // Mock or unpublished asset IDs cannot be stored against live rows.
    }
  }
  const store = await cookies();
  store.delete(FAVORITES_COOKIE);
}
