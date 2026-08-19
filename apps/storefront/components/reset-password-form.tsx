"use client";

import { MIN_PASSWORD_LENGTH } from "@bommastock/auth";
import { resetPasswordAction } from "../lib/auth-actions";
import {
  AuthSubmitButton,
  FieldError,
  TextField,
  useActionState,
} from "./auth-fields";
import { brandFillClass, stadiumClass } from "./social-login";

export function ResetPasswordForm({ token }: { token: string }) {
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
      <AuthSubmitButton
        pending={pending}
        className={`${stadiumClass} ${brandFillClass}`}
      >
        Update password
      </AuthSubmitButton>
    </form>
  );
}
