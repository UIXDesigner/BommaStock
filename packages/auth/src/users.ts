import { randomBytes } from "node:crypto";
import { getPrisma } from "@bommastock/database";
import type { UserRole } from "@bommastock/types";
import {
  AUTH_RATE_LIMIT,
  AUTH_RATE_WINDOW_MS,
  PASSWORD_RESET_TTL_MS,
} from "./constants";
import { hashPassword, verifyPassword } from "./password";
import { rateLimit } from "./rate-limit";
import {
  acceptTermsSchema,
  changePasswordSchema,
  credentialsSchema,
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "./schemas";
import { clientKey, isAuthConfigured, type AuthUser } from "./types";

function toAuthUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: "ACTIVE" | "DISABLED";
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}

async function auditLoginFailure(
  email: string,
  ipAddress: string | null,
): Promise<void> {
  try {
    const prisma = getPrisma();
    await prisma.auditLog.create({
      data: {
        action: "LOGIN_FAILURE",
        entityType: "User",
        metadata: { email },
        ipAddress,
      },
    });
  } catch {
    // Audit must never block or leak auth errors.
  }
}

export async function authenticateUser(input: {
  email: unknown;
  password: unknown;
  allowedRole: UserRole;
  ipAddress: string | null;
}): Promise<AuthUser | null> {
  const parsed = credentialsSchema.safeParse({
    email: input.email,
    password: input.password,
  });
  if (!parsed.success) {
    return null;
  }

  const { email, password } = parsed.data;
  if (
    !rateLimit(
      clientKey(input.ipAddress, email),
      AUTH_RATE_LIMIT,
      AUTH_RATE_WINDOW_MS,
    )
  ) {
    return null;
  }

  if (!isAuthConfigured()) {
    return null;
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (
    !user ||
    !user.passwordHash ||
    user.status !== "ACTIVE" ||
    user.role !== input.allowedRole
  ) {
    await auditLoginFailure(email, input.ipAddress);
    return null;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    await auditLoginFailure(email, input.ipAddress);
    return null;
  }

  return toAuthUser(user);
}

export async function registerCustomer(input: {
  name?: unknown;
  email: unknown;
  password: unknown;
  termsAccepted: unknown;
  ipAddress: string | null;
}): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  }

  if (
    !rateLimit(
      clientKey(input.ipAddress, parsed.data.email),
      AUTH_RATE_LIMIT,
      AUTH_RATE_WINDOW_MS,
    )
  ) {
    return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  }

  if (!isAuthConfigured()) {
    return {
      ok: false,
      error:
        "Authentication is not configured. Set DATABASE_URL and AUTH_SECRET.",
    };
  }

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name || null,
      passwordHash: await hashPassword(parsed.data.password),
      role: "CUSTOMER",
      status: "ACTIVE",
      termsAcceptedAt: new Date(),
    },
  });

  return { ok: true, user: toAuthUser(user) };
}

export async function requestPasswordReset(input: {
  email: unknown;
  ipAddress: string | null;
  resetBaseUrl: string;
}): Promise<{ ok: true }> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: true };
  }

  if (
    !rateLimit(
      clientKey(input.ipAddress, parsed.data.email),
      AUTH_RATE_LIMIT,
      AUTH_RATE_WINDOW_MS,
    )
  ) {
    return { ok: true };
  }

  if (!isAuthConfigured()) {
    return { ok: true };
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user || user.status !== "ACTIVE") {
    return { ok: true };
  }

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.deleteMany({
    where: { identifier: parsed.data.email },
  });
  await prisma.verificationToken.create({
    data: {
      identifier: parsed.data.email,
      token,
      expires: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });

  const resetUrl = `${input.resetBaseUrl.replace(/\/+$/, "")}/reset-password?token=${token}`;
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    console.info(
      "Password reset email skipped: Resend is not wired in this slice.",
    );
  }
  console.info(`Password reset URL (server log only): ${resetUrl}`);
  return { ok: true };
}

export async function resetPasswordWithToken(input: {
  token: unknown;
  password: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  }

  if (!isAuthConfigured()) {
    return {
      ok: false,
      error:
        "Authentication is not configured. Set DATABASE_URL and AUTH_SECRET.",
    };
  }

  const prisma = getPrisma();
  const record = await prisma.verificationToken.findUnique({
    where: { token: parsed.data.token },
  });
  if (!record || record.expires < new Date()) {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }

  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
  });
  if (!user || user.status !== "ACTIVE") {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    prisma.verificationToken.delete({ where: { token: record.token } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);

  return { ok: true };
}

export async function changePassword(input: {
  userId: string;
  currentPassword: unknown;
  newPassword: unknown;
  currentSessionToken?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: input.currentPassword,
    newPassword: input.newPassword,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  }

  if (!isAuthConfigured()) {
    return {
      ok: false,
      error:
        "Authentication is not configured. Set DATABASE_URL and AUTH_SECRET.",
    };
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user?.passwordHash || user.status !== "ACTIVE") {
    return { ok: false, error: "Unable to change password." };
  }

  const valid = await verifyPassword(
    user.passwordHash,
    parsed.data.currentPassword,
  );
  if (!valid) {
    return { ok: false, error: "Current password is incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  await prisma.session.deleteMany({
    where: {
      userId: user.id,
      ...(input.currentSessionToken
        ? { sessionToken: { not: input.currentSessionToken } }
        : {}),
    },
  });

  return { ok: true };
}

export async function updateCustomerProfile(input: {
  userId: string;
  name: unknown;
  phone: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = updateProfileSchema.safeParse({
    name: input.name,
    phone: input.phone,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  }
  if (!isAuthConfigured()) {
    return {
      ok: false,
      error:
        "Authentication is not configured. Set DATABASE_URL and AUTH_SECRET.",
    };
  }

  const prisma = getPrisma();
  await prisma.user.update({
    where: { id: input.userId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
    },
  });
  return { ok: true };
}

export async function updateProfileName(input: {
  userId: string;
  name: unknown;
  phone?: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return updateCustomerProfile({
    userId: input.userId,
    name: input.name,
    phone: input.phone ?? "",
  });
}

export async function acceptCustomerTerms(input: {
  userId: string;
  termsAccepted: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = acceptTermsSchema.safeParse({
    termsAccepted: input.termsAccepted,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  }
  if (!isAuthConfigured()) {
    return {
      ok: false,
      error:
        "Authentication is not configured. Set DATABASE_URL and AUTH_SECRET.",
    };
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { termsAcceptedAt: true },
  });
  if (!user) {
    return { ok: false, error: "Unable to save terms acceptance." };
  }
  if (user.termsAcceptedAt) {
    return { ok: true };
  }
  await prisma.user.update({
    where: { id: input.userId },
    data: { termsAcceptedAt: new Date() },
  });
  return { ok: true };
}

export type CustomerProfileRecord = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  termsAcceptedAt: Date | null;
};

export async function getCustomerProfile(
  userId: string,
): Promise<CustomerProfileRecord | null> {
  if (!isAuthConfigured()) {
    return null;
  }
  const prisma = getPrisma();
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      termsAcceptedAt: true,
    },
  });
}
