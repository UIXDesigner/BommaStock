import { isAuthConfigured } from "@bommastock/auth";
import type { Metadata } from "next";
import { AdminAuthPage } from "../../components/admin-auth-page";
import { AdminResetPasswordForm } from "../../components/admin-reset-forms";

export const metadata: Metadata = {
  title: "Reset password",
};

export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return (
    <AdminAuthPage
      title="Reset password"
      description="Choose a new password. This link can be used once."
      configured={isAuthConfigured()}
    >
      {token ? (
        <AdminResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-muted-foreground">
          This reset link is missing a token. Request a new one from forgot
          password.
        </p>
      )}
    </AdminAuthPage>
  );
}
