import { Button, FilterChip } from "@bommastock/ui";
import {
  CATALOG_SORTS,
  ORIENTATIONS,
  type CatalogQuery,
  type CatalogSort,
} from "../lib/catalog/catalog";
import type { CatalogCategory } from "../lib/catalog/types";

function orientationLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function sortLabel(value: CatalogSort): string {
  if (value === "price-asc") {
    return "Price: low to high";
  }
  if (value === "price-desc") {
    return "Price: high to low";
  }
  if (value === "relevance") {
    return "Relevance";
  }
  return "Newest";
}

function hrefWithout(
  action: string,
  current: Record<string, string>,
  keys: string[],
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value && !keys.includes(key)) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${action}?${query}` : action;
}

export function CatalogFilters({
  action,
  query,
  categories,
  hiddenFields,
  resultCount,
  showRelevance = false,
}: {
  action: string;
  query: CatalogQuery;
  categories?: CatalogCategory[];
  hiddenFields?: Record<string, string>;
  resultCount?: number;
  showRelevance?: boolean;
}) {
  const sort = query.sort ?? "newest";
  const current: Record<string, string> = {
    ...(hiddenFields ?? {}),
    ...(query.categorySlug ? { category: query.categorySlug } : {}),
    ...(query.orientation ? { orientation: query.orientation } : {}),
    ...(sort && sort !== "newest" ? { sort } : {}),
  };

  const chips: { key: string; label: string; href: string }[] = [];
  if (query.categorySlug && categories) {
    const category = categories.find(
      (item) => item.slug === query.categorySlug,
    );
    chips.push({
      key: "category",
      label: category?.name ?? query.categorySlug,
      href: hrefWithout(action, current, ["category"]),
    });
  }
  if (query.orientation) {
    chips.push({
      key: "orientation",
      label: orientationLabel(query.orientation),
      href: hrefWithout(action, current, ["orientation"]),
    });
  }
  if (sort && sort !== "newest") {
    chips.push({
      key: "sort",
      label: sortLabel(sort),
      href: hrefWithout(action, current, ["sort"]),
    });
  }

  const sorts = showRelevance
    ? CATALOG_SORTS
    : CATALOG_SORTS.filter((value) => value !== "relevance");

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {resultCount !== undefined ? (
          <p className="text-sm text-muted-foreground">
            {String(resultCount)} image{resultCount === 1 ? "" : "s"}
          </p>
        ) : (
          <span />
        )}
        {chips.length > 0 ? (
          <a
            href={hrefWithout(action, current, [
              "category",
              "orientation",
              "sort",
            ])}
            className="text-sm underline-offset-4 hover:underline"
          >
            Clear all
          </a>
        ) : null}
      </div>
      {chips.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.key}>
              <FilterChip href={chip.href}>
                <span className="sr-only">Remove </span>
                {chip.label}
              </FilterChip>
            </li>
          ))}
        </ul>
      ) : null}
      <details className="md:hidden">
        <summary className="cursor-pointer text-sm font-medium">
          Filters
          {chips.length > 0 ? ` (${String(chips.length)})` : ""}
        </summary>
        <div className="mt-4">
          <FilterForm
            idPrefix="mobile"
            action={action}
            query={query}
            categories={categories}
            hiddenFields={hiddenFields}
            sorts={sorts}
          />
        </div>
      </details>
      <div className="hidden md:block">
        <FilterForm
          idPrefix="desktop"
          action={action}
          query={query}
          categories={categories}
          hiddenFields={hiddenFields}
          sorts={sorts}
        />
      </div>
    </div>
  );
}

function FilterForm({
  idPrefix,
  action,
  query,
  categories,
  hiddenFields,
  sorts,
}: {
  idPrefix: string;
  action: string;
  query: CatalogQuery;
  categories?: CatalogCategory[];
  hiddenFields?: Record<string, string>;
  sorts: readonly CatalogSort[];
}) {
  const categoryId = `${idPrefix}-category`;
  const orientationId = `${idPrefix}-orientation`;
  const sortId = `${idPrefix}-sort`;
  return (
    <form
      method="get"
      action={action}
      className="flex flex-wrap items-end gap-3"
    >
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      {categories && categories.length > 0 ? (
        <div className="flex min-w-40 flex-col gap-1.5">
          <label htmlFor={categoryId} className="text-xs font-medium">
            Category
          </label>
          <select
            id={categoryId}
            name="category"
            defaultValue={query.categorySlug ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="flex min-w-40 flex-col gap-1.5">
        <label htmlFor={orientationId} className="text-xs font-medium">
          Orientation
        </label>
        <select
          id={orientationId}
          name="orientation"
          defaultValue={query.orientation ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All</option>
          {ORIENTATIONS.map((orientation) => (
            <option key={orientation} value={orientation}>
              {orientationLabel(orientation)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-w-40 flex-col gap-1.5">
        <label htmlFor={sortId} className="text-xs font-medium">
          Sort
        </label>
        <select
          id={sortId}
          name="sort"
          defaultValue={query.sort ?? "newest"}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {sorts.map((sort) => (
            <option key={sort} value={sort}>
              {sortLabel(sort)}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="outline">
        Apply
      </Button>
    </form>
  );
}
