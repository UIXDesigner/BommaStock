"use client";

import {
  MIN_PASSWORD_LENGTH,
  type SocialProviderStatus,
} from "@bommastock/auth";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import {
  AuthSubmitButton,
  FieldError,
  TextField,
  useActionState,
} from "./auth-fields";
import { loginAction } from "../lib/auth-actions";
import {
  AlternateSocialRow,
  AuthOrDivider,
  EmailAuthLink,
  GoogleAuthButton,
  GuestContinueLink,
  emailFillClass,
  stadiumClass,
} from "./social-login";

const fieldClass = "h-11 rounded-lg";

export function LoginForm({
  callbackUrl,
  resetSuccess,
  socialProviders,
  authConfigured,
  authError,
  showEmailForm = false,
}: {
  callbackUrl: string;
  resetSuccess?: boolean;
  socialProviders: SocialProviderStatus[];
  authConfigured: boolean;
  authError?: string;
  showEmailForm?: boolean;
}) {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const emailHref =
    callbackUrl === "/"
      ? "/login?method=email"
      : `/login?method=email&callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const backHref =
    callbackUrl === "/"
      ? "/login"
      : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  if (!showEmailForm) {
    return (
      <section className="flex flex-col" aria-label="Sign in options">
        {resetSuccess ? (
          <p className="mb-3 text-sm text-foreground" role="status">
            Password updated. Sign in with your new password.
          </p>
        ) : null}
        <FieldError message={authError} />
        <div className="flex flex-col gap-3">
          <GoogleAuthButton
            callbackUrl={callbackUrl}
            providers={socialProviders}
            authConfigured={authConfigured}
            label="Continue with Google"
          />
          <EmailAuthLink href={emailHref}>Sign in with Email</EmailAuthLink>
        </div>
        <div className="mt-4">
          <AuthOrDivider />
        </div>
        <div className="mt-4">
          <GuestContinueLink />
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5" aria-label="Sign in with email">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back
      </Link>
      <form action={formAction} className="flex flex-col gap-4">
        {resetSuccess ? (
          <p className="text-sm text-foreground" role="status">
            Password updated. Log in with your new password.
          </p>
        ) : null}
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <TextField
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          className={fieldClass}
        />
        <TextField
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          className={fieldClass}
        />
        <FieldError message={state?.error ?? authError} />
        <AuthSubmitButton
          pending={pending}
          className={`${stadiumClass} ${emailFillClass}`}
        >
          Sign in
        </AuthSubmitButton>
      </form>
      <Link
        href="/forgot-password"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Forgot password
      </Link>
      <AlternateSocialRow
        callbackUrl={callbackUrl}
        providers={socialProviders}
        authConfigured={authConfigured}
        verb="Continue"
      />
    </section>
  );
}
