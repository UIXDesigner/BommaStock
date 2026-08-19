import {
  Button,
  EmptyState,
  PriceDisplay,
  buttonVariants,
  cn,
} from "@bommastock/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "../../../auth";
import {
  acceptCartPricesAction,
  removeCartItemAction,
  updateCartLicenseAction,
} from "../../../lib/cart/actions";
import {
  findPriceChanges,
  getActiveTaxRateBps,
  getCartLines,
  summarizeCart,
} from "../../../lib/cart/store";
import { getAssetById } from "../../../lib/catalog/catalog";

export const metadata: Metadata = {
  title: "Cart",
};

export default async function CartPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const [lines, taxRateBps] = await Promise.all([
    getCartLines(userId),
    getActiveTaxRateBps(),
  ]);

  const resolved = [];
  for (const line of lines) {
    const asset = await getAssetById(line.assetId);
    const license = asset?.licenses.find(
      (option) => option.id === line.assetLicenseId,
    );
    resolved.push({ line, asset, license });
  }

  const available = resolved.filter(
    (
      item,
    ): item is typeof item & {
      asset: NonNullable<typeof item.asset>;
      license: NonNullable<typeof item.license>;
    } => Boolean(item.asset && item.license),
  );
  const unavailable = resolved.filter((item) => !item.asset || !item.license);

  const livePrices = new Map(
    available.map((item) => [item.license.id, item.license.pricePaise]),
  );
  const priceChanges = findPriceChanges(
    available.map((item) => item.line),
    livePrices,
  );
  const totals = summarizeCart(
    available.map((item) => ({
      ...item.line,
      quotedUnitPriceIncludingTaxPaise: item.license.pricePaise,
    })),
    taxRateBps,
  );

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-16"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Cart</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Prices are GST-inclusive in INR. Checkout uses live catalog prices, not
        the amount shown in the browser.
      </p>

      {available.length === 0 && unavailable.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Your cart is empty"
            description="Explore the library and add licensed images when you are ready."
            action={
              <Link
                href="/explore"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Continue browsing
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <ul className="flex flex-col gap-6">
            {priceChanges.length > 0 ? (
              <li className="rounded-lg border border-border bg-secondary/50 px-4 py-4">
                <p className="text-sm font-medium">Catalog prices changed</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  One or more licenses now have a different GST-inclusive price.
                  Confirm the new quotes before checkout.
                </p>
                <form action={acceptCartPricesAction} className="mt-3">
                  <Button type="submit" size="sm">
                    Accept updated prices
                  </Button>
                </form>
              </li>
            ) : null}
            {available.map(({ line, asset, license }) => (
              <li
                key={`${line.assetId}-${line.assetLicenseId}`}
                className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row"
              >
                <Link
                  href={`/images/${asset.slug}`}
                  className="shrink-0 overflow-hidden rounded-md bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <img
                    src={asset.thumbnailPublicUrl}
                    alt={asset.title}
                    className="h-28 w-40 object-cover"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div>
                    <Link
                      href={`/images/${asset.slug}`}
                      className="font-medium hover:underline"
                    >
                      {asset.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {asset.categoryName} · {asset.code}
                    </p>
                  </div>
                  <form
                    action={updateCartLicenseAction}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <input type="hidden" name="assetId" value={asset.id} />
                    <input
                      type="hidden"
                      name="previousLicenseId"
                      value={license.id}
                    />
                    <div className="flex min-w-48 flex-col gap-1.5">
                      <label
                        htmlFor={`license-${asset.id}`}
                        className="text-xs font-medium"
                      >
                        License
                      </label>
                      <select
                        id={`license-${asset.id}`}
                        name="assetLicenseId"
                        defaultValue={license.id}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {asset.licenses.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" size="sm" variant="outline">
                      Update license
                    </Button>
                  </form>
                  <div className="flex items-center justify-between gap-3">
                    <PriceDisplay
                      paise={license.pricePaise}
                      className="text-sm font-medium"
                    />
                    <form action={removeCartItemAction}>
                      <input type="hidden" name="assetId" value={asset.id} />
                      <input
                        type="hidden"
                        name="assetLicenseId"
                        value={license.id}
                      />
                      <Button type="submit" size="sm" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
            {unavailable.map(({ line }) => (
              <li
                key={`${line.assetId}-${line.assetLicenseId}`}
                className="flex items-center justify-between gap-3 border-b border-border pb-6 text-sm"
              >
                <p className="text-muted-foreground">
                  An item is no longer available in the published catalog.
                </p>
                <form action={removeCartItemAction}>
                  <input type="hidden" name="assetId" value={line.assetId} />
                  <input
                    type="hidden"
                    name="assetLicenseId"
                    value={line.assetLicenseId}
                  />
                  <Button type="submit" size="sm" variant="ghost">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-lg border border-border p-5">
            <h2 className="text-lg font-semibold tracking-tight">Summary</h2>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt>Items</dt>
                <dd>{String(totals.itemCount)}</dd>
              </div>
              {totals.beforeTaxPaise !== null && totals.taxPaise !== null ? (
                <>
                  <div className="flex justify-between gap-3">
                    <dt>Before tax</dt>
                    <dd>
                      <PriceDisplay paise={totals.beforeTaxPaise} />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>GST</dt>
                    <dd>
                      <PriceDisplay paise={totals.taxPaise} />
                    </dd>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Catalog prices include GST. A tax breakdown appears when an
                  active tax rate is configured.
                </p>
              )}
              <div className="flex justify-between gap-3 border-t border-border pt-3 font-medium">
                <dt>Total</dt>
                <dd>
                  <PriceDisplay paise={totals.totalIncludingTaxPaise} />
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-col gap-2">
              {session?.user?.id ? (
                <Link href="/checkout" className={cn(buttonVariants())}>
                  Continue to checkout
                </Link>
              ) : (
                <Link
                  href="/login?callbackUrl=/checkout"
                  className={cn(buttonVariants())}
                >
                  Sign in to checkout
                </Link>
              )}
              <Link
                href="/explore"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
