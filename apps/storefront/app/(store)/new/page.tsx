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
  title: "New",
};

export default async function NewPage({
  searchParams,
}: {
  searchParams: Promise<{
    orientation?: string;
    sort?: string;
    category?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = parseCatalogQuery({
    ...params,
    sort: params.sort ?? "newest",
  });
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
        Just published
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
        New images
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        The newest published assets, newest first. Unpublished and processing
        files stay in Admin until they are ready.
      </p>
      <div className="mt-10">
        <CatalogFilters
          action="/new"
          query={filters}
          categories={categories}
          resultCount={assets.length}
        />
        <div className="mt-8">
          {assets.length === 0 ? (
            <EmptyState
              title="No new images yet"
              description="Newly published images will appear here after Admin processing completes."
            />
          ) : (
            <CatalogImageGrid assets={assets} />
          )}
        </div>
      </div>
    </main>
  );
}
