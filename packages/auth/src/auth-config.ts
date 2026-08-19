import "./next-auth-augmentation";
import { randomUUID } from "node:crypto";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma } from "@bommastock/database";
import type { UserRole, UserStatus } from "@bommastock/types";
import type { NextAuthConfig } from "next-auth";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { encode as encodeJwt } from "next-auth/jwt";
import { SESSION_MAX_AGE_SECONDS } from "./constants";
import { getSocialProviderEnv } from "./social";
import { isAuthConfigured } from "./types";
import { authenticateUser } from "./users";

export type CreateAuthConfigOptions = {
  cookieName: string;
  allowedRole: UserRole;
  signInPage: string;
  enableSocialLogin?: boolean;
  onSignIn?: (user: { id: string }) => Promise<void>;
};

function createSocialProviders(): NextAuthConfig["providers"] {
  const env = getSocialProviderEnv();
  const providers: NextAuthConfig["providers"] = [];

  if (env.google.clientId && env.google.clientSecret) {
    providers.push(
      Google({
        clientId: env.google.clientId,
        clientSecret: env.google.clientSecret,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  if (env.microsoft.clientId && env.microsoft.clientSecret) {
    providers.push(
      MicrosoftEntraID({
        clientId: env.microsoft.clientId,
        clientSecret: env.microsoft.clientSecret,
        ...(env.microsoft.issuer ? { issuer: env.microsoft.issuer } : {}),
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  if (env.apple.clientId && env.apple.clientSecret) {
    providers.push(
      Apple({
        clientId: env.apple.clientId,
        clientSecret: env.apple.clientSecret,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  return providers;
}

const BUILD_PLACEHOLDER_SECRET = "bommastock-build-placeholder-not-for-login";

export function createAuthConfig(
  options: CreateAuthConfigOptions,
): NextAuthConfig {
  const adapter = isAuthConfigured()
    ? PrismaAdapter(getPrisma() as never)
    : undefined;

  return {
    trustHost: true,
    secret: process.env.AUTH_SECRET ?? BUILD_PLACEHOLDER_SECRET,
    adapter,
    session: {
      strategy: adapter ? "database" : "jwt",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
    pages: {
      signIn: options.signInPage,
    },
    cookies: {
      sessionToken: {
        name: options.cookieName,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
        },
      },
    },
    providers: [
      Credentials({
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        authorize: async (credentials, request) => {
          const forwarded = request?.headers.get("x-forwarded-for");
          const ipAddress = forwarded?.split(",")[0]?.trim() ?? null;
          return authenticateUser({
            email: credentials?.email,
            password: credentials?.password,
            allowedRole: options.allowedRole,
            ipAddress,
          });
        },
      }),
      ...(options.enableSocialLogin ? createSocialProviders() : []),
    ],
    jwt: adapter
      ? {
          encode: async (params) => {
            if (params.token?.credentials) {
              const sessionToken = randomUUID();
              if (!params.token.sub) {
                throw new Error("No user ID found in token.");
              }
              const createdSession = await adapter.createSession?.({
                sessionToken,
                userId: params.token.sub,
                expires: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
              });
              if (!createdSession) {
                throw new Error("Failed to create session.");
              }
              return sessionToken;
            }
            return encodeJwt(params);
          },
        }
      : undefined,
    events: {
      async createUser({ user }) {
        if (!options.enableSocialLogin || !user.id || !isAuthConfigured()) {
          return;
        }
        await getPrisma().user.update({
          where: { id: user.id },
          data: {
            role: "CUSTOMER",
            termsAcceptedAt: new Date(),
          },
        });
      },
      async signIn({ user }) {
        if (user.id && options.onSignIn) {
          await options.onSignIn({ id: user.id });
        }
      },
    },
    callbacks: {
      async signIn({ user, account }) {
        if (!account || account.provider === "credentials") {
          return true;
        }
        if (!options.enableSocialLogin || !isAuthConfigured()) {
          return false;
        }
        const email = user.email?.trim().toLowerCase();
        if (!email) {
          return false;
        }
        const existing = await getPrisma().user.findUnique({
          where: { email },
          select: { role: true, status: true },
        });
        if (!existing) {
          return true;
        }
        return existing.status === "ACTIVE" && existing.role === "CUSTOMER";
      },
      jwt({ token, user, account }) {
        if (account?.provider === "credentials") {
          token.credentials = true;
        }
        if (user) {
          token.role = user.role;
          token.status = user.status;
        }
        return token;
      },
      session({ session, user, token }) {
        const role = (user?.role ?? token.role) as UserRole | undefined;
        const status = (user?.status ?? token.status) as UserStatus | undefined;
        session.user.id = user?.id ?? token.sub ?? "";
        session.user.email = user?.email ?? session.user.email;
        session.user.name = user?.name ?? session.user.name;
        session.user.role = role ?? options.allowedRole;
        session.user.status = status ?? "ACTIVE";
        return session;
      },
    },
  };
}
