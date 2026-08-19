"use server";

import { ADMIN_SESSION_COOKIE } from "@bommastock/auth";
import {
  changePassword,
  clientIpFromHeaders,
  getSignInErrorMessage,
  requestPasswordReset,
  resetPasswordWithToken,
} from "@bommastock/auth/next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "../auth";

async function ipAddress(): Promise<string | null> {
  return clientIpFromHeaders(await headers());
}

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
    return null;
  } catch (error) {
    const message = getSignInErrorMessage(error);
    if (message) {
      return { error: message };
    }
    throw error;
  }
}

export async function forgotPasswordAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  await requestPasswordReset({
    email: formData.get("email"),
    ipAddress: await ipAddress(),
    resetBaseUrl: process.env.ADMIN_URL ?? "http://localhost:3001",
  });
  return {
    success: "If an account exists for that email, a reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const result = await resetPasswordWithToken({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!result.ok) {
    return { error: result.error };
  }
  redirect("/login?reset=1");
}

export async function changePasswordAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in to change your password." };
  }
  const cookieStore = await cookies();
  const result = await changePassword({
    userId: session.user.id,
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    currentSessionToken: cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  });
  if (!result.ok) {
    return { error: result.error };
  }
  return { success: "Password updated. Other sessions were signed out." };
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
