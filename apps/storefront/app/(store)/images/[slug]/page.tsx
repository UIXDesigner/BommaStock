import { Button, LicenseSelector, PriceDisplay } from "@bommastock/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "../../../../auth";
import { CatalogImageGrid } from "../../../../components/catalog-image-card";
import { FavoriteButton } from "../../../../components/favorite-button";
import { addToCartAction, buyNowAction } from "../../../../lib/cart/actions";
import {
  assetMetadata,
  getAssetBySlug,
  listRelatedAssets,
} from "../../../../lib/catalog/catalog";
import { isFavorite } from "../../../../lib/favorites/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const asset = await getAssetBySlug(slug);
  return { title: asset?.title ?? "Image" };
}

export default async function ImagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const asset = await getAssetBySlug(slug);
  if (!asset) {
    notFound();
  }

  const session = await auth();
  const [related, favorited] = await Promise.all([
    listRelatedAssets(asset),
    isFavorite(session?.user?.id ?? null, asset.id),
  ]);
  const defaultLicense =
    asset.licenses.find((license) => license.isDefault) ?? asset.licenses[0];

  return (
    <main id="main-content">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)] md:px-6 md:py-16">
        <div className="overflow-hidden rounded-lg bg-secondary">
          <img
            src={asset.previewPublicUrl}
            alt={asset.title}
            className="w-full object-contain"
          />
        </div>
        <aside className="flex flex-col gap-6">
          <div>
            <Link
              href={`/categories/${asset.categorySlug}`}
              className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase hover:text-foreground"
            >
              {asset.categoryName}
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
              {asset.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {asset.description}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Code</dt>
              <dd className="mt-1 font-medium">{asset.code}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">File</dt>
              <dd className="mt-1 font-medium">{assetMetadata(asset)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Orientation</dt>
              <dd className="mt-1 font-medium">
                {asset.orientation.charAt(0) +
                  asset.orientation.slice(1).toLowerCase()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Price</dt>
              <dd className="mt-1 font-medium">
                <PriceDisplay paise={asset.pricePaise} />
              </dd>
            </div>
          </dl>
          {asset.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Tags">
              {asset.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="inline-flex rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary"
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <form action={addToCartAction} className="flex flex-col gap-4">
            <input type="hidden" name="assetId" value={asset.id} />
            <LicenseSelector
              name="assetLicenseId"
              options={asset.licenses}
              defaultValue={defaultLicense?.id}
            />
            <p className="text-xs text-muted-foreground">
              Prices are GST-inclusive. This page shows a watermarked public
              preview. The master file is delivered only after a verified
              purchase.
            </p>
            <div className="flex flex-col gap-2">
              <Button type="submit">Add to cart</Button>
              <Button type="submit" formAction={buyNowAction} variant="outline">
                Buy now
              </Button>
            </div>
          </form>
          <FavoriteButton assetId={asset.id} favorited={favorited} />
        </aside>
      </div>
      {related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Related images
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            More published images from {asset.categoryName}.
          </p>
          <div className="mt-8">
            <CatalogImageGrid assets={related} />
          </div>
        </section>
      ) : null}
    </main>
  );
}
