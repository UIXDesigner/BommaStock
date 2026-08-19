import { z } from "zod";

function blankToUndefined(
  source: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const next: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(source)) {
    next[key] = value === "" ? undefined : value;
  }
  return next;
}

/**
 * Locked environment names from ARCHITECTURE.md §18 and DECISIONS.md.
 * Phase 1 only requires DATABASE_URL for migrate/seed. Other values may be empty.
 */
export const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  AUTH_URL: z.string().optional(),
  ADMIN_BOOTSTRAP_EMAIL: z.string().optional(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().optional(),
  ADMIN_BOOTSTRAP_ALLOW_ADDITIONAL: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  STOREFRONT_URL: z.string().optional(),
  ADMIN_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_PRIVATE_BUCKET: z.string().optional(),
  R2_PUBLIC_BUCKET: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  NEXT_PUBLIC_R2_PUBLIC_BASE_URL: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  TAX_RATE_BPS: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      return Number.parseInt(value, 10);
    })
    .pipe(z.number().int().nonnegative().optional()),
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(
  source: Record<string, string | undefined> = process.env,
): AppEnv {
  return envSchema.parse(blankToUndefined(source));
}
