import { EmptyState, SearchBar } from "@bommastock/ui";
import type { Metadata } from "next";
import { CatalogImageGrid } from "../../../components/catalog-image-card";
import { CatalogFilters } from "../../../components/catalog-filters";
import { PopularSearches } from "../../../components/popular-searches";
import {
  applyCatalogQuery,
  listRootCategories,
  parseCatalogQuery,
  searchHeading,
  searchPublishedAssets,
} from "../../../lib/catalog/catalog";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    orientation?: string;
    sort?: string;
    category?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const filters = parseCatalogQuery(params);
  const [categories, matches] = await Promise.all([
    listRootCategories(),
    searchPublishedAssets(query),
  ]);
  const assets = applyCatalogQuery(matches, filters, categories);
  const heading = searchHeading(query);

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16"
    >
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {heading}
      </h1>
      <div className="mt-6 max-w-2xl">
        <SearchBar
          id="search-page"
          defaultValue={query}
          suggestions={
            <PopularSearches className="mt-3 text-muted-foreground" />
          }
        />
      </div>
      <div className="mt-10">
        <CatalogFilters
          action="/search"
          query={filters}
          categories={categories}
          hiddenFields={query ? { q: query } : undefined}
          resultCount={assets.length}
          showRelevance={Boolean(query)}
        />
        <div className="mt-8">
          {assets.length === 0 ? (
            <EmptyState
              title="No images found"
              description="Try another title, category, orientation, or asset code. Published images from Admin appear here once the database is connected."
            />
          ) : (
            <CatalogImageGrid assets={assets} />
          )}
        </div>
      </div>
    </main>
  );
}
