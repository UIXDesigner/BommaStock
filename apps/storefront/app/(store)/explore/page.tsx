import { EmptyState } from "@bommastock/ui";
import type { Metadata } from "next";
import { CatalogImageGrid } from "../../../components/catalog-image-card";
import { CatalogFilters } from "../../../components/catalog-filters";
import {
  applyCatalogQuery,
  listPublishedAssets,
  listRootCategories,
  parseCatalogQuery,
} from "../../../lib/catalog/catalog";

export const metadata: Metadata = {
  title: "Explore",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    orientation?: string;
    sort?: string;
    category?: string;
  }>;
}) {
  const filters = parseCatalogQuery(await searchParams);
  const [categories, published] = await Promise.all([
    listRootCategories(),
    listPublishedAssets(),
  ]);
  const assets = applyCatalogQuery(published, filters, categories);

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16"
    >
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        Library
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
        Explore images
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Browse published, ready-to-license artwork. Cards keep each image’s
        natural proportions. Hover to see the watermarked preview.
      </p>
      <div className="mt-10">
        <CatalogFilters
          action="/explore"
          query={filters}
          categories={categories}
          resultCount={assets.length}
        />
        <div className="mt-8">
          {assets.length === 0 ? (
            <EmptyState
              title="No images found"
              description="Try another category or orientation. Only published, ready assets appear here."
            />
          ) : (
            <CatalogImageGrid assets={assets} />
          )}
        </div>
      </div>
    </main>
  );
}
