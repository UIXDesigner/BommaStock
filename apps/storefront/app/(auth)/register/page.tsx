import {
  getAuthCallbackErrorMessage,
  getSocialProviderStatus,
  isAuthConfigured,
} from "@bommastock/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { AuthPage } from "../../../components/auth-page";
import { RegisterForm } from "../../../components/register-form";

export const metadata: Metadata = {
  title: "Sign up",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; method?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id && session.user.role === "CUSTOMER") {
    redirect("/");
  }

  const params = await searchParams;
  const configured = isAuthConfigured();
  const showEmailForm = params.method === "email";
  const authError =
    params.error === "Configuration"
      ? undefined
      : getAuthCallbackErrorMessage(params.error);

  return (
    <AuthPage
      title="Sign up"
      description={
        showEmailForm
          ? "Enter your details to create your account."
          : "Create your free account 😎"
      }
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-[#111827] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Log In
          </Link>
        </>
      }
    >
      <RegisterForm
        socialProviders={getSocialProviderStatus()}
        authConfigured={configured}
        authError={authError}
        showEmailForm={showEmailForm}
      />
    </AuthPage>
  );
}
