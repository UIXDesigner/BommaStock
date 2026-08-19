import { isAuthConfigured } from "@bommastock/auth";
import type { Metadata } from "next";
import { AdminAuthPage } from "../../components/admin-auth-page";
import { AdminForgotPasswordForm } from "../../components/admin-reset-forms";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function AdminForgotPasswordPage() {
  return (
    <AdminAuthPage
      title="Forgot password"
      description="If an admin account exists, a reset link is issued. The URL is emailed when Resend is configured, otherwise written to the server log."
      configured={isAuthConfigured()}
    >
      <AdminForgotPasswordForm />
    </AdminAuthPage>
  );
}
