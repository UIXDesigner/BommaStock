import { AuthError } from "next-auth";

/** Generic login copy. Do not distinguish unknown email from bad password. */
export const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

export function getSignInErrorMessage(error: unknown): string | null {
  if (!(error instanceof AuthError)) {
    return null;
  }
  if (error.type === "CredentialsSignin") {
    return INVALID_CREDENTIALS_MESSAGE;
  }
  return "Could not sign in. Try again.";
}
