import { Button, PriceDisplay, buttonVariants, cn } from "@bommastock/ui";
import { requireUser } from "@bommastock/auth/next";
import { isRazorpayConfigured } from "@bommastock/payments";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { getAccountSnapshot } from "../../../lib/account/store";
import {
  getActiveTaxRateBps,
  getCartLines,
  summarizeCart,
} from "../../../lib/cart/store";
import { getAssetById } from "../../../lib/catalog/catalog";

export const metadata: Metadata = {
  title: "Checkout",
};

function formatAddress(address: {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}): string {
  return [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country === "IN" ? "India" : address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export default async function CheckoutPage() {
  const session = await requireUser(
    () => auth(),
    "/login?callbackUrl=/checkout",
  );
  const [lines, taxRateBps, account] = await Promise.all([
    getCartLines(session.user.id),
    getActiveTaxRateBps(),
    getAccountSnapshot({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
    }),
  ]);

  const available = [];
  for (const line of lines) {
    const asset = await getAssetById(line.assetId);
    const license = asset?.licenses.find(
      (option) => option.id === line.assetLicenseId,
    );
    if (asset && license) {
      available.push({ line, asset, license });
    }
  }

  if (available.length === 0) {
    redirect("/cart");
  }

  const totals = summarizeCart(
    available.map((item) => ({
      ...item.line,
      quotedUnitPriceIncludingTaxPaise: item.license.pricePaise,
    })),
    taxRateBps,
  );
  const canPay = isRazorpayConfigured();

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-16"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Review licenses and the GST-inclusive total. Payment is created on the
        server from live catalog prices.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="flex flex-col gap-8">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Account</h2>
            <p className="mt-2 text-sm">{session.user.email}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {account.name || "Add your name in account settings."}
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Billing contact
            </h2>
            <p className="mt-2 text-sm">
              {account.billing?.invoiceName ||
                account.name ||
                "Name on invoice not set"}
            </p>
            {account.billing?.gstin ? (
              <p className="mt-1 text-sm text-muted-foreground">
                GSTIN {account.billing.gstin}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-muted-foreground">
              {account.address
                ? formatAddress(account.address)
                : "No billing address yet. Digital delivery uses this account; add an India address for invoices."}
            </p>
            <Link
              href="/account/profile"
              className="mt-2 inline-block text-sm font-medium underline-offset-4 hover:underline"
            >
              Update address
            </Link>
            {" · "}
            <Link
              href="/account/settings"
              className="mt-2 inline-block text-sm font-medium underline-offset-4 hover:underline"
            >
              Payment details
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              Cards and UPI are entered at Razorpay Checkout. Bommastock does
              not store card numbers.
            </p>
          </div>
          <ul className="flex flex-col gap-6">
            {available.map(({ asset, license }) => (
              <li
                key={`${asset.id}-${license.id}`}
                className="flex gap-4 border-b border-border pb-6"
              >
                <img
                  src={asset.thumbnailPublicUrl}
                  alt=""
                  className="h-20 w-28 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{asset.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {license.name} license · {asset.code}
                  </p>
                  <PriceDisplay
                    paise={license.pricePaise}
                    className="mt-2 text-sm font-medium"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <aside className="h-fit rounded-lg border border-border p-5">
          <h2 className="text-lg font-semibold tracking-tight">
            Order summary
          </h2>
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
                Amounts are GST-inclusive. A split appears when an active tax
                rate is configured in Admin.
              </p>
            )}
            <div className="flex justify-between gap-3 border-t border-border pt-3 font-medium">
              <dt>Total payable</dt>
              <dd>
                <PriceDisplay paise={totals.totalIncludingTaxPaise} />
              </dd>
            </div>
          </dl>
          {canPay ? (
            <Button type="button" className="mt-6 w-full" disabled>
              Pay with Razorpay
            </Button>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              <Button type="button" className="w-full" disabled>
                Pay with Razorpay
              </Button>
              <p className="text-xs text-muted-foreground">
                Razorpay credentials are not configured. The checkout UI is
                ready; payment capture stays in the existing payments package
                and will not invent keys.
              </p>
            </div>
          )}
          <Link
            href="/cart"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mt-3 w-full",
            )}
          >
            Return to cart
          </Link>
        </aside>
      </div>
    </main>
  );
}
