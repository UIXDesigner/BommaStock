"use client";

import {
  MIN_PASSWORD_LENGTH,
  type SocialProviderStatus,
} from "@bommastock/auth";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { registerAction } from "../lib/auth-actions";
import {
  AuthLegalLink,
  AuthSubmitButton,
  CheckboxField,
  FieldError,
  TextField,
  useActionState,
} from "./auth-fields";
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

export function RegisterForm({
  socialProviders,
  authConfigured,
  authError,
  showEmailForm = false,
}: {
  socialProviders: SocialProviderStatus[];
  authConfigured: boolean;
  authError?: string;
  showEmailForm?: boolean;
}) {
  const [state, formAction, pending] = useActionState(registerAction, null);

  if (!showEmailForm) {
    return (
      <section className="flex flex-col" aria-label="Sign up options">
        <FieldError message={authError} />
        <div className="flex flex-col gap-3">
          <GoogleAuthButton
            callbackUrl="/"
            providers={socialProviders}
            authConfigured={authConfigured}
            label="Sign up with Google"
          />
          <EmailAuthLink href="/register?method=email">
            Sign up with Email
          </EmailAuthLink>
        </div>
        <p className="mt-4 text-center text-[11px] leading-5 text-[#9CA3AF]">
          By signing up you agree to our{" "}
          <Link
            href="/terms"
            className="text-[#6B7280] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Terms of Service
          </Link>
          .
        </p>
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
    <section className="flex flex-col gap-5" aria-label="Sign up with email">
      <Link
        href="/register"
        className="inline-flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back
      </Link>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField
          id="name"
          name="name"
          type="text"
          label="Display name"
          autoComplete="name"
          className={fieldClass}
        />
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
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          className={fieldClass}
          hint={`Use at least ${String(MIN_PASSWORD_LENGTH)} characters.`}
        />
        <CheckboxField
          id="termsAccepted"
          name="termsAccepted"
          required
          label={
            <>
              I agree to the{" "}
              <AuthLegalLink href="/terms">Terms and Conditions</AuthLegalLink>{" "}
              and <AuthLegalLink href="/license">License terms</AuthLegalLink>.
            </>
          }
        />
        <FieldError message={state?.error ?? authError} />
        <AuthSubmitButton
          pending={pending}
          className={`${stadiumClass} ${emailFillClass}`}
        >
          Sign up
        </AuthSubmitButton>
      </form>
      <AlternateSocialRow
        callbackUrl="/"
        providers={socialProviders}
        authConfigured={authConfigured}
        verb="Sign up"
      />
    </section>
  );
}
