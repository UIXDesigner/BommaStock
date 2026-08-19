import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bommastock/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "../../../../auth";
import {
  AcceptTermsForm,
  ChangePasswordForm,
  UpdateBillingForm,
} from "../../../../components/account-forms";
import {
  AccountShell,
  PersistenceNotice,
} from "../../../../components/account-shell";
import { SavedPaymentMethods } from "../../../../components/saved-payment-methods";
import { getAccountSnapshot } from "../../../../lib/account/store";

export const metadata: Metadata = {
  title: "Settings",
};

function formatAcceptedAt(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  const account = await getAccountSnapshot({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });

  return (
    <AccountShell
      title="Settings"
      description="Billing contact, how cards are added, terms acceptance, and password."
      notice={<PersistenceNotice persisted={account.persisted} />}
    >
      <Card>
        <CardHeader>
          <CardTitle>Billing contact</CardTitle>
          <CardDescription>
            Name and GSTIN for invoices. These are not card details. Card PAN
            and CVV are never stored in Bommastock.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateBillingForm
            billing={account.billing}
            defaultInvoiceName={account.name ?? ""}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Saved payment methods</CardTitle>
          <CardDescription>
            Cards are entered securely at Razorpay Checkout. This page does not
            collect card numbers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SavedPaymentMethods />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Terms and conditions</CardTitle>
          <CardDescription>
            Required when creating an account. Existing customers can accept
            here if they registered before this requirement.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {account.termsAcceptedAt ? (
            <p className="text-sm text-muted-foreground">
              You accepted the{" "}
              <Link
                href="/terms"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Terms and Conditions
              </Link>{" "}
              on {formatAcceptedAt(account.termsAcceptedAt)}.
            </p>
          ) : (
            <AcceptTermsForm />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Changing your password signs out other sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </AccountShell>
  );
}
