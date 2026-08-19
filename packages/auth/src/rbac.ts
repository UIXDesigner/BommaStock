import type { Session } from "next-auth";
import { redirect } from "next/navigation";

export async function requireUser(
  getSession: () => Promise<Session | null>,
  loginPath = "/login",
): Promise<Session> {
  const session = await getSession();
  if (
    !session?.user?.id ||
    session.user.status !== "ACTIVE" ||
    session.user.role !== "CUSTOMER"
  ) {
    redirect(loginPath);
  }
  return session;
}

export async function requireAdmin(
  getSession: () => Promise<Session | null>,
  loginPath = "/login",
): Promise<Session> {
  const session = await getSession();
  if (
    !session?.user?.id ||
    session.user.status !== "ACTIVE" ||
    session.user.role !== "ADMIN"
  ) {
    redirect(loginPath);
  }
  return session;
}
