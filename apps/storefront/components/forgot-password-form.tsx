"use client";

import { forgotPasswordAction } from "../lib/auth-actions";
import {
  AuthSubmitButton,
  FieldError,
  TextField,
  useActionState,
} from "./auth-fields";
import { brandFillClass, stadiumClass } from "./social-login";

export function ForgotPasswordForm() {
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
      <AuthSubmitButton
        pending={pending}
        className={`${stadiumClass} ${brandFillClass}`}
      >
        Send reset link
      </AuthSubmitButton>
    </form>
  );
}
