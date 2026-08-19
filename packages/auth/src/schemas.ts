import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "./constants";
import {
  INDIA_COUNTRY_CODE,
  INDIA_STATES,
  isIndiaState,
  normalizeIndianMobile,
} from "./india";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `Password must be at least ${String(MIN_PASSWORD_LENGTH)} characters.`,
  );

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const acceptedCheckboxSchema = z
  .unknown()
  .transform((value) => {
    return (
      value === true || value === "on" || value === "true" || value === "1"
    );
  })
  .refine((accepted) => accepted, {
    message: "Accept the terms and conditions to continue.",
  });

export const registerSchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: emailSchema,
  password: passwordSchema,
  termsAccepted: acceptedCheckboxSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: passwordSchema,
});

function formString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export const optionalPhoneSchema = z
  .preprocess(formString, z.string().trim())
  .pipe(
    z.string().transform((value, ctx) => {
      if (value === "") {
        return null;
      }
      const normalized = normalizeIndianMobile(value);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid 10-digit Indian mobile number.",
        });
        return z.NEVER;
      }
      return normalized;
    }),
  );

export const updateProfileSchema = z.object({
  name: z
    .preprocess(formString, z.string())
    .pipe(z.string().trim().min(1, "Display name is required.").max(120)),
  phone: optionalPhoneSchema,
});

export const acceptTermsSchema = z.object({
  termsAccepted: acceptedCheckboxSchema,
});

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const optionalGstinSchema = z
  .preprocess(formString, z.string().trim())
  .pipe(
    z.string().transform((value, ctx) => {
      if (value === "") {
        return null;
      }
      const normalized = value.toUpperCase();
      if (!GSTIN_PATTERN.test(normalized)) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid 15-character GSTIN.",
        });
        return z.NEVER;
      }
      return normalized;
    }),
  );

export const updateAddressSchema = z.object({
  line1: z
    .preprocess(formString, z.string())
    .pipe(
      z
        .string()
        .trim()
        .min(3, "Address line 1 is required.")
        .max(120, "Address line 1 is too long."),
    ),
  line2: z.preprocess(formString, z.string().trim()).pipe(
    z
      .string()
      .max(120, "Address line 2 is too long.")
      .transform((value) => (value === "" ? null : value)),
  ),
  city: z
    .preprocess(formString, z.string())
    .pipe(
      z
        .string()
        .trim()
        .min(2, "City is required.")
        .max(80, "City is too long."),
    ),
  state: z
    .preprocess(formString, z.string())
    .pipe(
      z
        .string()
        .trim()
        .refine(isIndiaState, "Select an Indian state or union territory."),
    ),
  postalCode: z.preprocess(formString, z.string()).pipe(
    z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter a 6-digit PIN code."),
  ),
  country: z.preprocess(
    (value) => {
      const next = formString(value).trim().toUpperCase();
      return next === "" ? INDIA_COUNTRY_CODE : next;
    },
    z.literal(INDIA_COUNTRY_CODE, {
      error: "Billing address must be in India for MVP checkout.",
    }),
  ),
});

export const updateBillingProfileSchema = z.object({
  invoiceName: z.preprocess(formString, z.string().trim()).pipe(
    z
      .string()
      .max(120, "Name on invoice is too long.")
      .transform((value) => (value === "" ? null : value)),
  ),
  gstin: optionalGstinSchema,
});

export const indiaStates = INDIA_STATES;
export { INDIA_COUNTRY_CODE };
