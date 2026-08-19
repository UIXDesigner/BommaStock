import "./next-auth-augmentation";
import NextAuth from "next-auth";
import { createAuthConfig, type CreateAuthConfigOptions } from "./auth-config";

export function createAuth(options: CreateAuthConfigOptions) {
  return NextAuth(createAuthConfig(options));
}

export { createAuthConfig, type CreateAuthConfigOptions } from "./auth-config";
export { clientIpFromHeaders } from "./ip";
export { requireAdmin, requireUser } from "./rbac";
export {
  getSignInErrorMessage,
  INVALID_CREDENTIALS_MESSAGE,
} from "./sign-in-error";
export {
  getCustomerAddress,
  getCustomerBillingProfile,
  upsertCustomerAddress,
  upsertCustomerBillingProfile,
  type CustomerAddressRecord,
  type CustomerBillingRecord,
} from "./account";
export {
  acceptCustomerTerms,
  changePassword,
  getCustomerProfile,
  registerCustomer,
  requestPasswordReset,
  resetPasswordWithToken,
  updateCustomerProfile,
  updateProfileName,
  type CustomerProfileRecord,
} from "./users";
export {
  getAuthCallbackErrorMessage,
  getSocialProviderStatus,
  isSocialProviderId,
  socialProviderLabel,
  type SocialProviderId,
  type SocialProviderStatus,
} from "./social";
export { isAuthConfigured, type AuthUser } from "./types";
