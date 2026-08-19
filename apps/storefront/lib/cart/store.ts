import {
  findPriceChanges,
  removeCartLine,
  summarizeCart,
  upsertCartLine,
  type CartLineInput,
} from "@bommastock/commerce";
import { getPrisma } from "@bommastock/database";
import { cookies } from "next/headers";
import { getCatalogSource, getAssetById } from "../catalog/catalog";

export const CART_COOKIE = "bommastock.storefront.cart";
export const GUEST_COOKIE = "bommastock.storefront.guest";

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

function parseCookieCart(value: string | undefined): CartLineInput[] {
  if (!value) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as CartLineInput).assetId !== "string" ||
        typeof (item as CartLineInput).assetLicenseId !== "string" ||
        typeof (item as CartLineInput).quotedUnitPriceIncludingTaxPaise !==
          "number"
      ) {
        return [];
      }
      const line = item as CartLineInput;
      if (
        !line.assetId ||
        !line.assetLicenseId ||
        !Number.isInteger(line.quotedUnitPriceIncludingTaxPaise) ||
        line.quotedUnitPriceIncludingTaxPaise < 0
      ) {
        return [];
      }
      return [line];
    });
  } catch {
    return [];
  }
}

async function useLiveCommerce(): Promise<boolean> {
  return (await getCatalogSource()) === "live";
}

async function readCookieLines(): Promise<CartLineInput[]> {
  const store = await cookies();
  return parseCookieCart(store.get(CART_COOKIE)?.value);
}

async function writeCookieLines(items: CartLineInput[]): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, JSON.stringify(items), cookieOptions());
}

async function guestToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) {
    return existing;
  }
  const token = crypto.randomUUID();
  store.set(GUEST_COOKIE, token, cookieOptions());
  return token;
}

async function findCartId(userId: string | null): Promise<string | null> {
  const prisma = getPrisma();
  if (userId) {
    const existing = await prisma.cart.findUnique({ where: { userId } });
    return existing?.id ?? null;
  }

  const store = await cookies();
  const token = store.get(GUEST_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const existing = await prisma.cart.findUnique({
    where: { guestToken: token },
  });
  return existing?.id ?? null;
}

async function prismaCartId(userId: string | null): Promise<string> {
  const existingId = await findCartId(userId);
  if (existingId) {
    return existingId;
  }

  const prisma = getPrisma();
  if (userId) {
    const created = await prisma.cart.create({ data: { userId } });
    return created.id;
  }

  const token = await guestToken();
  const created = await prisma.cart.create({ data: { guestToken: token } });
  return created.id;
}

async function readPrismaLines(
  userId: string | null,
): Promise<CartLineInput[]> {
  const prisma = getPrisma();
  const cartId = await findCartId(userId);
  if (!cartId) {
    return [];
  }
  const items = await prisma.cartItem.findMany({ where: { cartId } });
  return items.map((item) => ({
    assetId: item.assetId,
    assetLicenseId: item.assetLicenseId,
    quotedUnitPriceIncludingTaxPaise: item.quotedUnitPriceIncludingTaxPaise,
  }));
}

export async function getCartLines(
  userId: string | null,
): Promise<CartLineInput[]> {
  if (await useLiveCommerce()) {
    return readPrismaLines(userId);
  }
  return readCookieLines();
}

export async function getCartCount(userId: string | null): Promise<number> {
  return (await getCartLines(userId)).length;
}

export async function addCartLine(
  userId: string | null,
  line: CartLineInput,
): Promise<void> {
  if (await useLiveCommerce()) {
    const prisma = getPrisma();
    const cartId = await prismaCartId(userId);
    await prisma.cartItem.upsert({
      where: {
        cartId_assetId_assetLicenseId: {
          cartId,
          assetId: line.assetId,
          assetLicenseId: line.assetLicenseId,
        },
      },
      create: {
        cartId,
        assetId: line.assetId,
        assetLicenseId: line.assetLicenseId,
        quotedUnitPriceIncludingTaxPaise: line.quotedUnitPriceIncludingTaxPaise,
      },
      update: {
        quotedUnitPriceIncludingTaxPaise: line.quotedUnitPriceIncludingTaxPaise,
      },
    });
    return;
  }
  const items = upsertCartLine(await readCookieLines(), line);
  await writeCookieLines(items);
}

export async function removeCartItem(
  userId: string | null,
  assetId: string,
  assetLicenseId: string,
): Promise<void> {
  if (await useLiveCommerce()) {
    const prisma = getPrisma();
    const cartId = await prismaCartId(userId);
    await prisma.cartItem.deleteMany({
      where: { cartId, assetId, assetLicenseId },
    });
    return;
  }
  await writeCookieLines(
    removeCartLine(await readCookieLines(), assetId, assetLicenseId),
  );
}

export async function replaceCartQuotes(
  userId: string | null,
  items: CartLineInput[],
): Promise<void> {
  if (await useLiveCommerce()) {
    const prisma = getPrisma();
    const cartId = await prismaCartId(userId);
    await prisma.$transaction(
      items.map((item) =>
        prisma.cartItem.updateMany({
          where: {
            cartId,
            assetId: item.assetId,
            assetLicenseId: item.assetLicenseId,
          },
          data: {
            quotedUnitPriceIncludingTaxPaise:
              item.quotedUnitPriceIncludingTaxPaise,
          },
        }),
      ),
    );
    return;
  }
  await writeCookieLines(items);
}

export async function getActiveTaxRateBps(): Promise<number | null> {
  if (!(await useLiveCommerce())) {
    return null;
  }
  const prisma = getPrisma();
  const rate = await prisma.taxRate.findFirst({
    where: { status: "ACTIVE" },
  });
  return rate?.rateBps ?? null;
}

export async function mergeGuestCart(userId: string): Promise<void> {
  if (!(await useLiveCommerce())) {
    return;
  }

  const store = await cookies();
  const token = store.get(GUEST_COOKIE)?.value;
  if (!token) {
    return;
  }

  const prisma = getPrisma();
  const guestCart = await prisma.cart.findUnique({
    where: { guestToken: token },
    include: { items: true },
  });
  if (!guestCart) {
    store.delete(GUEST_COOKIE);
    return;
  }

  const userCartId = await prismaCartId(userId);
  for (const item of guestCart.items) {
    await prisma.cartItem.upsert({
      where: {
        cartId_assetId_assetLicenseId: {
          cartId: userCartId,
          assetId: item.assetId,
          assetLicenseId: item.assetLicenseId,
        },
      },
      create: {
        cartId: userCartId,
        assetId: item.assetId,
        assetLicenseId: item.assetLicenseId,
        quotedUnitPriceIncludingTaxPaise: item.quotedUnitPriceIncludingTaxPaise,
      },
      update: {},
    });
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
  store.delete(GUEST_COOKIE);
}

export async function resolveCartLine(line: CartLineInput) {
  const asset = await getAssetById(line.assetId);
  const license = asset?.licenses.find(
    (option) => option.id === line.assetLicenseId,
  );
  return { line, asset, license };
}

export { findPriceChanges, summarizeCart, upsertCartLine };
export type { CartLineInput };
