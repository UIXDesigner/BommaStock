import { isAuthConfigured } from "@bommastock/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { AdminAuthPage } from "../../components/admin-auth-page";
import { AdminLoginForm } from "../../components/admin-login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id && session.user.role === "ADMIN") {
    redirect("/");
  }
  const { reset } = await searchParams;

  return (
    <AdminAuthPage
      title="Admin sign in"
      description="Administrators are provisioned. There is no public registration."
      configured={isAuthConfigured()}
    >
      <AdminLoginForm resetSuccess={reset === "1"} />
    </AdminAuthPage>
  );
}
