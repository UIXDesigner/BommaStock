"use client";

import { MIN_PASSWORD_LENGTH } from "@bommastock/auth";
import Link from "next/link";
import { loginAction } from "../lib/auth-actions";
import {
  AuthSubmitButton,
  FieldError,
  TextField,
  useActionState,
} from "./auth-fields";

export function AdminLoginForm({ resetSuccess }: { resetSuccess?: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {resetSuccess ? (
        <p className="text-sm text-foreground" role="status">
          Password updated. Sign in with your new password.
        </p>
      ) : null}
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
      />
      <TextField
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <FieldError message={state?.error} />
      <AuthSubmitButton pending={pending}>Sign in</AuthSubmitButton>
      <Link
        href="/forgot-password"
        className="text-sm underline-offset-4 hover:underline"
      >
        Forgot password
      </Link>
    </form>
  );
}
