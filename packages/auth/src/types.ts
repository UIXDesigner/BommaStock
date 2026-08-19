import type { UserRole, UserStatus } from "@bommastock/types";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
};

export function isAuthConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET);
}

export function clientKey(ip: string | null, email: string): string {
  return `${ip ?? "unknown"}:${email.toLowerCase()}`;
}
