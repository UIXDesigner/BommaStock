import type { ReactNode } from "react";
import { auth } from "../../auth";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { getCartCount } from "../../lib/cart/store";
import { listRootCategories } from "../../lib/catalog/catalog";
import { getFavoriteIds } from "../../lib/favorites/store";

export default async function StoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [session, categories] = await Promise.all([
    auth(),
    listRootCategories(),
  ]);
  const userId = session?.user?.id ?? null;
  const [cartCount, favoriteIds] = await Promise.all([
    getCartCount(userId),
    getFavoriteIds(userId),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader
        categories={categories}
        cartCount={cartCount}
        favoriteCount={favoriteIds.length}
        user={
          session?.user?.id
            ? { email: session.user.email, name: session.user.name }
            : null
        }
      />
      {children}
      <SiteFooter />
    </div>
  );
}
