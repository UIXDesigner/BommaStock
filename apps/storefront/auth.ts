import { mergeGuestCart } from "./lib/cart/store";
import { mergeGuestFavorites } from "./lib/favorites/store";
import { STOREFRONT_SESSION_COOKIE } from "@bommastock/auth";
import { createAuth } from "@bommastock/auth/next";

export const { handlers, auth, signIn, signOut } = createAuth({
  cookieName: STOREFRONT_SESSION_COOKIE,
  allowedRole: "CUSTOMER",
  signInPage: "/login",
  enableSocialLogin: true,
  onSignIn: async ({ id }) => {
    await mergeGuestCart(id);
    await mergeGuestFavorites(id);
  },
});
