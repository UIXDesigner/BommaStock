import type { Metadata } from "next";
import Link from "next/link";
import { listRootCategories } from "../../../lib/catalog/catalog";

export const metadata: Metadata = {
  title: "Categories",
};

export default async function CategoriesPage() {
  const categories = await listRootCategories();

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16"
    >
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        Categories
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Browse the catalog by subject. Categories come from Admin, not from
        hard-coded marketplace lists.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/categories/${category.slug}`}
              className="flex min-h-36 flex-col justify-end rounded-lg border border-border bg-card px-5 py-5 transition-colors hover:border-foreground/20 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-lg font-medium tracking-tight">
                {category.name}
              </span>
              <span className="mt-2 text-sm text-muted-foreground">
                {category.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
