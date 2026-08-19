"use client";

import { MIN_PASSWORD_LENGTH } from "@bommastock/auth";
import Link from "next/link";
import { forgotPasswordAction, resetPasswordAction } from "../lib/auth-actions";
import {
  AuthSubmitButton,
  FieldError,
  TextField,
  useActionState,
} from "./auth-fields";

export function AdminForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
      />
      <FieldError message={state?.error} />
      {state?.success ? (
        <p className="text-sm text-foreground" role="status">
          {state.success}
        </p>
      ) : null}
      <AuthSubmitButton pending={pending}>Send reset link</AuthSubmitButton>
      <Link
        href="/login"
        className="text-sm underline-offset-4 hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}

export function AdminResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <TextField
        id="password"
        name="password"
        type="password"
        label="New password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <p className="text-xs text-muted-foreground">
        Use at least {String(MIN_PASSWORD_LENGTH)} characters.
      </p>
      <FieldError message={state?.error} />
      <AuthSubmitButton pending={pending}>Update password</AuthSubmitButton>
    </form>
  );
}
