import { ADMIN_SESSION_COOKIE } from "@bommastock/auth";
import { createAuth } from "@bommastock/auth/next";

export const { handlers, auth, signIn, signOut } = createAuth({
  cookieName: ADMIN_SESSION_COOKIE,
  allowedRole: "ADMIN",
  signInPage: "/login",
});
