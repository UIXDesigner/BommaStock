import type { Metadata } from "next";
import Link from "next/link";
import { AuthPage } from "../../../components/auth-page";
import { ForgotPasswordForm } from "../../../components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPage
      title="Forgot password"
      description="Enter your email and we will send a reset link if an account exists."
      footer={
        <>
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-bold text-[#111827] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthPage>
  );
}
