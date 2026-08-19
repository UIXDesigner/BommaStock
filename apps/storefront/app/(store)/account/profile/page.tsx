import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bommastock/ui";
import type { Metadata } from "next";
import { auth } from "../../../../auth";
import {
  UpdateAddressForm,
  UpdateProfileForm,
} from "../../../../components/account-forms";
import {
  AccountShell,
  PersistenceNotice,
} from "../../../../components/account-shell";
import { getAccountSnapshot } from "../../../../lib/account/store";
import { ReadOnlyField } from "../../../../components/auth-fields";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function AccountProfilePage() {
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
      title="Profile"
      description="Display name and mobile number. Email is your sign-in identity and cannot be changed here."
      notice={<PersistenceNotice persisted={account.persisted} />}
    >
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Email stays read-only. Phone is optional and stored on your customer
            account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ReadOnlyField
            id="email"
            label="Email"
            value={account.email}
            hint="Email change is not available in MVP."
          />
          <UpdateProfileForm
            defaultName={account.name ?? ""}
            defaultPhone={account.phone ?? ""}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Billing address</CardTitle>
          <CardDescription>
            One India address for invoices and GST. Digital licenses are
            delivered to this account, not posted as physical goods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateAddressForm address={account.address} />
        </CardContent>
      </Card>
    </AccountShell>
  );
}
