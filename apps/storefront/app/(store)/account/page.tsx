import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bommastock/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "../../../auth";
import { AcceptTermsForm } from "../../../components/account-forms";
import {
  AccountShell,
  PersistenceNotice,
} from "../../../components/account-shell";
import { signOutAction } from "../../../lib/auth-actions";
import { getAccountSnapshot } from "../../../lib/account/store";
import { getCartCount } from "../../../lib/cart/store";
import { getFavoriteIds } from "../../../lib/favorites/store";

export const metadata: Metadata = {
  title: "Account",
};

function formatAcceptedAt(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  const [account, cartCount, favoriteIds] = await Promise.all([
    getAccountSnapshot({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
    }),
    getCartCount(session.user.id),
    getFavoriteIds(session.user.id),
  ]);

  return (
    <AccountShell
      title="Account"
      description="Manage profile, address, billing contact, and terms. Email cannot be changed. Orders and downloads appear after a captured payment."
      notice={<PersistenceNotice persisted={account.persisted} />}
    >
      {account.termsAcceptedAt ? null : (
        <Card>
          <CardHeader>
            <CardTitle>Accept terms and conditions</CardTitle>
            <CardDescription>
              Existing accounts need to accept the current Bommastock terms
              before we treat the account as complete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AcceptTermsForm />
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              <span className="text-foreground">
                {account.name || "Add a display name"}
              </span>
            </p>
            <p className="mt-1">{account.email}</p>
            <p className="mt-1">{account.phone || "No mobile number yet"}</p>
            <Link
              href="/account/profile"
              className="mt-3 block font-medium text-foreground"
            >
              Edit profile and address
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment details</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Invoice:{" "}
              <span className="text-foreground">
                {account.billing?.invoiceName || account.name || "Not set"}
              </span>
            </p>
            <p className="mt-1">
              GSTIN: {account.billing?.gstin || "Not added"}
            </p>
            <Link
              href="/account/settings"
              className="mt-3 block font-medium text-foreground"
            >
              Billing contact and cards
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {cartCount} item{cartCount === 1 ? "" : "s"} ready for checkout.
            <Link
              href="/cart"
              className="mt-2 block font-medium text-foreground"
            >
              Open cart
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Favorites</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {favoriteIds.length} saved image
            {favoriteIds.length === 1 ? "" : "s"}.
            <Link
              href="/favorites"
              className="mt-2 block font-medium text-foreground"
            >
              View favorites
            </Link>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Terms</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {account.termsAcceptedAt ? (
            <p>
              Accepted {formatAcceptedAt(account.termsAcceptedAt)}. Review the{" "}
              <Link
                href="/terms"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Terms and Conditions
              </Link>
              .
            </p>
          ) : (
            <p>
              Not accepted yet. Use the prompt above or open{" "}
              <Link
                href="/account/settings"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                settings
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>
      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </AccountShell>
  );
}
