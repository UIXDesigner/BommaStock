import type { Metadata } from "next";
import Link from "next/link";
import { AuthPage } from "../../../components/auth-page";
import { ResetPasswordForm } from "../../../components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return (
    <AuthPage
      title="Reset password"
      description="Choose a new password. This link can be used once."
      footer={
        <>
          <Link
            href="/login"
            className="font-bold text-[#111827] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-muted-foreground">
          This reset link is missing a token. Request a new one from forgot
          password.
        </p>
      )}
    </AuthPage>
  );
}
