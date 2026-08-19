import {
  getAuthCallbackErrorMessage,
  getSocialProviderStatus,
  isAuthConfigured,
} from "@bommastock/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPage } from "../../../components/auth-page";
import { LoginForm } from "../../../components/login-form";
import { auth } from "../../../auth";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    reset?: string;
    error?: string;
    method?: string;
  }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl?.startsWith("/") && !params.callbackUrl.startsWith("//")
      ? params.callbackUrl
      : "/";

  if (session?.user?.id && session.user.role === "CUSTOMER") {
    redirect(callbackUrl);
  }

  const configured = isAuthConfigured();
  const showEmailForm = params.method === "email";
  const authError =
    params.error === "Configuration"
      ? undefined
      : getAuthCallbackErrorMessage(params.error);

  return (
    <AuthPage
      title="Sign in"
      description={
        showEmailForm ? "Use your email and password." : "Welcome back"
      }
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-bold text-[#111827] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign up
          </Link>
        </>
      }
    >
      <LoginForm
        callbackUrl={callbackUrl}
        resetSuccess={params.reset === "1"}
        socialProviders={getSocialProviderStatus()}
        authConfigured={configured}
        authError={authError}
        showEmailForm={showEmailForm}
      />
    </AuthPage>
  );
}
