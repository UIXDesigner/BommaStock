import { EmptyState, buttonVariants, cn } from "@bommastock/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "../../../auth";
import { CatalogImageGrid } from "../../../components/catalog-image-card";
import { listFavoriteAssets } from "../../../lib/favorites/store";

export const metadata: Metadata = {
  title: "Favorites",
};

export default async function FavoritesPage() {
  const session = await auth();
  const assets = await listFavoriteAssets(session?.user?.id ?? null);

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16"
    >
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        Favorites
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        {session?.user?.id
          ? "Saved images stay with your account after sign-in."
          : "Saved images are kept in this browser until you sign in."}
      </p>
      <div className="mt-10">
        {assets.length === 0 ? (
          <EmptyState
            title="No favorites yet"
            description="Use the heart on any image card or detail page to save it here."
            action={
              <Link
                href="/explore"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Explore images
              </Link>
            }
          />
        ) : (
          <CatalogImageGrid assets={assets} />
        )}
      </div>
    </main>
  );
}
