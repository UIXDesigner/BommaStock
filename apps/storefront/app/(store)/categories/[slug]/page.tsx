import { EmptyState } from "@bommastock/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogImageGrid } from "../../../../components/catalog-image-card";
import { CatalogFilters } from "../../../../components/catalog-filters";
import {
  applyCatalogQuery,
  getCategoryBySlug,
  listAssetsForCategory,
  listChildCategories,
  parseCatalogQuery,
} from "../../../../lib/catalog/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category?.name ?? "Category" };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orientation?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const filters = parseCatalogQuery(await searchParams);
  const [children, matches] = await Promise.all([
    listChildCategories(category.id),
    listAssetsForCategory(category.id),
  ]);
  const assets = applyCatalogQuery(matches, filters);

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16"
    >
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        Category
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {category.name}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        {category.description}
      </p>
      {children.length > 0 ? (
        <ul className="mt-8 flex flex-wrap gap-2">
          {children.map((child) => (
            <li key={child.id}>
              <Link
                href={`/categories/${child.slug}`}
                className="inline-flex rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
              >
                {child.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-12">
        <CatalogFilters
          action={`/categories/${category.slug}`}
          query={filters}
          resultCount={assets.length}
        />
        <div className="mt-8">
          {assets.length === 0 ? (
            <EmptyState
              title="No images found"
              description="This category has no published images matching the current filters."
            />
          ) : (
            <CatalogImageGrid assets={assets} />
          )}
        </div>
      </div>
    </main>
  );
}
