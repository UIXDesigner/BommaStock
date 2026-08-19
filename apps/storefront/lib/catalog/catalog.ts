import { mockAssets, mockCategories } from "./mock-catalog";
import { loadPrismaCatalog } from "./prisma-catalog";
import type { CatalogAsset, CatalogCategory } from "./types";

export const ORIENTATIONS = ["LANDSCAPE", "PORTRAIT", "SQUARE"] as const;
export type CatalogOrientation = (typeof ORIENTATIONS)[number];

export const CATALOG_SORTS = [
  "newest",
  "relevance",
  "price-asc",
  "price-desc",
] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export type CatalogQuery = {
  orientation?: CatalogOrientation;
  categorySlug?: string;
  sort?: CatalogSort;
};

type CatalogSnapshot = {
  categories: CatalogCategory[];
  assets: CatalogAsset[];
};

async function catalog(): Promise<CatalogSnapshot> {
  try {
    const live = await loadPrismaCatalog();
    if (live) {
      return live;
    }
  } catch {
    // Fall back to the mock catalog when the database is unreachable.
  }
  return { categories: mockCategories, assets: mockAssets };
}

function descendantIds(
  categories: CatalogCategory[],
  rootId: string,
): Set<string> {
  const ids = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const category of categories) {
      if (
        category.parentId &&
        ids.has(category.parentId) &&
        !ids.has(category.id)
      ) {
        ids.add(category.id);
        added = true;
      }
    }
  }
  return ids;
}

function byNewest(a: CatalogAsset, b: CatalogAsset): number {
  return b.publishedAt.localeCompare(a.publishedAt);
}

function sortAssets(
  assets: CatalogAsset[],
  sort: CatalogSort = "newest",
): CatalogAsset[] {
  const next = [...assets];
  if (sort === "price-asc") {
    return next.sort((a, b) => a.pricePaise - b.pricePaise || byNewest(a, b));
  }
  if (sort === "price-desc") {
    return next.sort((a, b) => b.pricePaise - a.pricePaise || byNewest(a, b));
  }
  return next.sort(byNewest);
}

export async function getCatalogSource(): Promise<"live" | "mock"> {
  try {
    const live = await loadPrismaCatalog();
    if (live) {
      return "live";
    }
  } catch {
    // Fall back to the mock catalog when the database is unreachable.
  }
  return "mock";
}

export function parseCatalogQuery(searchParams: {
  orientation?: string;
  sort?: string;
  category?: string;
}): CatalogQuery {
  const orientation = ORIENTATIONS.find(
    (value) => value === searchParams.orientation,
  );
  const categorySlug = searchParams.category?.trim() || undefined;
  const sort =
    CATALOG_SORTS.find((value) => value === searchParams.sort) ?? "newest";
  return {
    orientation,
    categorySlug,
    sort,
  };
}

export function applyCatalogQuery(
  assets: CatalogAsset[],
  query: CatalogQuery,
  categories: CatalogCategory[] = [],
): CatalogAsset[] {
  let filtered = assets;
  if (query.categorySlug) {
    const category = categories.find(
      (item) => item.slug === query.categorySlug,
    );
    if (category) {
      const ids = descendantIds(categories, category.id);
      filtered = filtered.filter((asset) => ids.has(asset.categoryId));
    } else {
      filtered = [];
    }
  }
  if (query.orientation) {
    filtered = filtered.filter(
      (asset) => asset.orientation === query.orientation,
    );
  }
  return sortAssets(filtered, query.sort);
}

export async function listRootCategories(): Promise<CatalogCategory[]> {
  const { categories } = await catalog();
  return categories.filter((category) => category.parentId === null);
}

export async function listCategories(): Promise<CatalogCategory[]> {
  const { categories } = await catalog();
  return categories;
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CatalogCategory | undefined> {
  const { categories } = await catalog();
  return categories.find((category) => category.slug === slug);
}

export async function listChildCategories(
  parentId: string,
): Promise<CatalogCategory[]> {
  const { categories } = await catalog();
  return categories.filter((category) => category.parentId === parentId);
}

export async function listPublishedAssets(): Promise<CatalogAsset[]> {
  const { assets } = await catalog();
  return [...assets].sort(byNewest);
}

export async function listAssetsForCategory(
  categoryId: string,
): Promise<CatalogAsset[]> {
  const { categories, assets } = await catalog();
  const ids = descendantIds(categories, categoryId);
  return assets.filter((asset) => ids.has(asset.categoryId)).sort(byNewest);
}

export async function searchPublishedAssets(
  query: string,
): Promise<CatalogAsset[]> {
  const { assets } = await catalog();
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...assets].sort(byNewest);
  }

  return assets
    .filter((asset) => {
      const haystack = [
        asset.title,
        asset.description,
        asset.code,
        asset.categoryName,
        asset.defaultLicenseName,
        ...asset.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    })
    .sort(byNewest);
}

export async function getAssetBySlug(
  slug: string,
): Promise<CatalogAsset | undefined> {
  const { assets } = await catalog();
  return assets.find((asset) => asset.slug === slug);
}

export async function getAssetById(
  id: string,
): Promise<CatalogAsset | undefined> {
  const { assets } = await catalog();
  return assets.find((asset) => asset.id === id);
}

export async function listAssetsByIds(ids: string[]): Promise<CatalogAsset[]> {
  const { assets } = await catalog();
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  return ids
    .map((id) => byId.get(id))
    .filter((asset): asset is CatalogAsset => Boolean(asset));
}

export async function listRelatedAssets(
  asset: CatalogAsset,
  limit = 8,
): Promise<CatalogAsset[]> {
  const related = await listAssetsForCategory(asset.categoryId);
  return related.filter((item) => item.id !== asset.id).slice(0, limit);
}

export function assetMetadata(asset: CatalogAsset): string {
  return `${asset.width.toLocaleString("en-IN")} × ${asset.height.toLocaleString("en-IN")} · ${asset.format}`;
}

export function searchHeading(query: string): string {
  if (!query) {
    return "All images";
  }
  return query
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
