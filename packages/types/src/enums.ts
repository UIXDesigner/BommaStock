import { z } from "zod";

export const userRoleSchema = z.enum(["CUSTOMER", "ADMIN"]);
export const userStatusSchema = z.enum(["ACTIVE", "DISABLED"]);
export const processingStatusSchema = z.enum([
  "UPLOADED",
  "PROCESSING",
  "READY",
  "FAILED",
]);
export const productStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const assetOrientationSchema = z.enum([
  "LANDSCAPE",
  "PORTRAIT",
  "SQUARE",
]);
export const assetFileClassSchema = z.enum([
  "MASTER",
  "THUMBNAIL",
  "WATERMARKED_PREVIEW",
  "WORKING_PREVIEW",
]);
export const categoryStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const licenseStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const orderStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
]);
export const paymentProviderSchema = z.enum(["RAZORPAY"]);
export const paymentStatusSchema = z.enum([
  "PENDING",
  "AUTHORIZED",
  "CAPTURED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
]);
export const imageProcessingJobStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
]);
export const taxRateStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const dailySequenceKindSchema = z.enum(["ASSET_CODE", "ORDER_NUMBER"]);

export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type ProcessingStatus = z.infer<typeof processingStatusSchema>;
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type AssetOrientation = z.infer<typeof assetOrientationSchema>;
export type AssetFileClass = z.infer<typeof assetFileClassSchema>;
export type CategoryStatus = z.infer<typeof categoryStatusSchema>;
export type LicenseStatus = z.infer<typeof licenseStatusSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentProvider = z.infer<typeof paymentProviderSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type ImageProcessingJobStatus = z.infer<
  typeof imageProcessingJobStatusSchema
>;
export type TaxRateStatus = z.infer<typeof taxRateStatusSchema>;
export type DailySequenceKind = z.infer<typeof dailySequenceKindSchema>;
