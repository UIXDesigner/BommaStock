import { SearchBar } from "@bommastock/ui";
import Link from "next/link";
import { CatalogImageGrid } from "../../components/catalog-image-card";
import { CatalogFilters } from "../../components/catalog-filters";
import { PopularSearches } from "../../components/popular-searches";
import {
  applyCatalogQuery,
  listPublishedAssets,
  listRootCategories,
  parseCatalogQuery,
} from "../../lib/catalog/catalog";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    orientation?: string;
    sort?: string;
    category?: string;
  }>;
}) {
  const params = await searchParams;
  const query = parseCatalogQuery(params);
  const [categories, published] = await Promise.all([
    listRootCategories(),
    listPublishedAssets(),
  ]);
  const assets = applyCatalogQuery(published, query, categories);
  const featured = published[0];

  return (
    <main id="main-content">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img
            src="/hero-living-room.jpg"
            alt=""
            className="size-full object-cover object-[center_42%]"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/25" />
        </div>
        <div className="relative mx-auto flex min-h-[34rem] max-w-7xl flex-col justify-end gap-8 px-4 py-20 md:min-h-[42rem] md:px-6 lg:py-24">
          <p className="text-xs font-medium tracking-[0.22em] text-white/70 uppercase">
            Bommastock image marketplace
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white text-balance md:text-6xl">
            Find the perfect image for your next idea.
          </h1>
          <p className="max-w-xl text-base leading-7 text-white/80 md:text-lg">
            Search Indian cultural imagery, Hindu devotional artwork, and
            high-resolution printable assets. Licensed masters stay private
            until a verified purchase.
          </p>
          <div className="max-w-2xl rounded-lg bg-background/95 p-3 shadow-lg">
            <SearchBar
              id="hero-search"
              placeholder="Search Ganesha, Krishna, Shiva, Durga…"
              suggestions={
                <PopularSearches className="mt-3 text-muted-foreground" />
              }
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            Browse categories
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A parent category includes every published image in its descendants.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/categories/${category.slug}`}
                className="flex min-h-24 flex-col justify-end rounded-lg border border-border bg-card px-4 py-4 transition-colors hover:border-foreground/20 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-sm font-medium">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {featured ? (
        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:px-6">
            <Link
              href={`/images/${featured.slug}`}
              className="overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src={featured.previewPublicUrl}
                alt={featured.title}
                className="aspect-[4/3] w-full object-cover"
              />
            </Link>
            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Newly published
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-balance">
                {featured.title}
              </h2>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                {featured.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {featured.categoryName} · {featured.code}
              </p>
              <Link
                href={`/images/${featured.slug}`}
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                View image
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section id="gallery" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Discover images
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thumbnails and watermarked previews only. Master files stay
              private until a verified purchase.
            </p>
          </div>
          <Link
            href="/explore"
            className="hidden text-sm font-medium underline-offset-4 hover:underline md:inline"
          >
            Open explore
          </Link>
        </div>
        <CatalogFilters
          action="/"
          query={query}
          categories={categories}
          resultCount={assets.length}
        />
        <div className="mt-8">
          <CatalogImageGrid assets={assets} />
        </div>
      </section>
    </main>
  );
}
