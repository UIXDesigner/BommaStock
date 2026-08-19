import { z } from "zod";

/** Integer paise. 1 INR = 100 paise. Never use Float for charged amounts. */
export const paiseSchema = z.number().int().nonnegative();
export type Paise = z.infer<typeof paiseSchema>;

export const inrCurrencySchema = z.literal("INR");
export type InrCurrency = z.infer<typeof inrCurrencySchema>;

export const priceChangedItemSchema = z.object({
  assetId: z.string(),
  assetLicenseId: z.string(),
  previousPaise: paiseSchema,
  currentPaise: paiseSchema,
});

export const priceChangedErrorSchema = z.object({
  code: z.literal("PRICE_CHANGED"),
  items: z.array(priceChangedItemSchema),
});

export type PriceChangedItem = z.infer<typeof priceChangedItemSchema>;
export type PriceChangedError = z.infer<typeof priceChangedErrorSchema>;

export const taxNotConfiguredErrorSchema = z.object({
  code: z.literal("TAX_NOT_CONFIGURED"),
});

export type TaxNotConfiguredError = z.infer<typeof taxNotConfiguredErrorSchema>;
