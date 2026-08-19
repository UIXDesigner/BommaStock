"use client";

import {
  INDIA_COUNTRY_CODE,
  INDIA_STATES,
  MIN_PASSWORD_LENGTH,
} from "@bommastock/auth";
import Link from "next/link";
import {
  acceptTermsAction,
  updateAddressAction,
  updateBillingAction,
  updateProfileAction,
} from "../lib/account/actions";
import { changePasswordAction } from "../lib/auth-actions";
import type { AccountAddress, AccountBilling } from "../lib/account/store";
import {
  AuthSubmitButton,
  CheckboxField,
  FieldError,
  ReadOnlyField,
  SelectField,
  TextField,
  useActionState,
} from "./auth-fields";

export function UpdateProfileForm({
  defaultName,
  defaultPhone,
}: {
  defaultName: string;
  defaultPhone: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        id="name"
        name="name"
        type="text"
        label="Display name"
        autoComplete="name"
        defaultValue={defaultName}
        required
      />
      <TextField
        id="phone"
        name="phone"
        type="tel"
        inputMode="tel"
        label="Mobile number"
        autoComplete="tel"
        defaultValue={defaultPhone}
        hint="Optional. Indian 10-digit mobile, stored as +91."
      />
      <FieldError message={state?.error} />
      {state?.success ? (
        <p className="text-sm text-foreground" role="status">
          {state.success}
        </p>
      ) : null}
      <AuthSubmitButton pending={pending}>Save profile</AuthSubmitButton>
    </form>
  );
}

export function UpdateAddressForm({
  address,
}: {
  address: AccountAddress | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateAddressAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        id="line1"
        name="line1"
        type="text"
        label="Address line 1"
        autoComplete="address-line1"
        defaultValue={address?.line1 ?? ""}
        required
      />
      <TextField
        id="line2"
        name="line2"
        type="text"
        label="Address line 2"
        autoComplete="address-line2"
        defaultValue={address?.line2 ?? ""}
      />
      <TextField
        id="city"
        name="city"
        type="text"
        label="City"
        autoComplete="address-level2"
        defaultValue={address?.city ?? ""}
        required
      />
      <SelectField
        id="state"
        name="state"
        label="State / union territory"
        autoComplete="address-level1"
        defaultValue={address?.state ?? ""}
        required
      >
        <option value="">Select state</option>
        {INDIA_STATES.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </SelectField>
      <TextField
        id="postalCode"
        name="postalCode"
        type="text"
        inputMode="numeric"
        label="PIN code"
        autoComplete="postal-code"
        defaultValue={address?.postalCode ?? ""}
        required
        hint="6-digit Indian PIN code."
      />
      <input type="hidden" name="country" value={INDIA_COUNTRY_CODE} />
      <ReadOnlyField
        id="countryDisplay"
        label="Country"
        value="India"
        hint="MVP billing addresses are India only, matching GST-inclusive INR checkout."
      />
      <FieldError message={state?.error} />
      {state?.success ? (
        <p className="text-sm text-foreground" role="status">
          {state.success}
        </p>
      ) : null}
      <AuthSubmitButton pending={pending}>Save address</AuthSubmitButton>
    </form>
  );
}

export function UpdateBillingForm({
  billing,
  defaultInvoiceName,
}: {
  billing: AccountBilling | null;
  defaultInvoiceName: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateBillingAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        id="invoiceName"
        name="invoiceName"
        type="text"
        label="Name on invoice"
        autoComplete="organization"
        defaultValue={billing?.invoiceName ?? defaultInvoiceName}
        hint="Usually the same as your display name. Used on GST invoices, not for card storage."
      />
      <TextField
        id="gstin"
        name="gstin"
        type="text"
        label="GSTIN"
        autoComplete="off"
        defaultValue={billing?.gstin ?? ""}
        hint="Optional 15-character GSTIN for business invoices."
      />
      <FieldError message={state?.error} />
      {state?.success ? (
        <p className="text-sm text-foreground" role="status">
          {state.success}
        </p>
      ) : null}
      <AuthSubmitButton pending={pending}>
        Save billing details
      </AuthSubmitButton>
    </form>
  );
}

export function AcceptTermsForm() {
  const [state, formAction, pending] = useActionState(acceptTermsAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <CheckboxField
        id="termsAccepted"
        name="termsAccepted"
        required
        label={
          <>
            I have read and accept the{" "}
            <Link
              href="/terms"
              className="font-medium underline-offset-4 hover:underline"
            >
              Terms and Conditions
            </Link>
            .
          </>
        }
      />
      <FieldError message={state?.error} />
      {state?.success ? (
        <p className="text-sm text-foreground" role="status">
          {state.success}
        </p>
      ) : null}
      <AuthSubmitButton pending={pending}>Accept terms</AuthSubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        id="currentPassword"
        name="currentPassword"
        type="password"
        label="Current password"
        autoComplete="current-password"
        required
      />
      <TextField
        id="newPassword"
        name="newPassword"
        type="password"
        label="New password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
      />
      <p className="text-xs text-muted-foreground">
        Use at least {String(MIN_PASSWORD_LENGTH)} characters. Other sessions
        will be signed out.
      </p>
      <FieldError message={state?.error} />
      {state?.success ? (
        <p className="text-sm text-foreground" role="status">
          {state.success}
        </p>
      ) : null}
      <AuthSubmitButton pending={pending}>Change password</AuthSubmitButton>
    </form>
  );
}
