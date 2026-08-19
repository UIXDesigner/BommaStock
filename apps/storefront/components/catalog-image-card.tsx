import { ImageCard, ImageGrid, ImageMasonry } from "@bommastock/ui";
import { auth } from "../auth";
import { assetMetadata } from "../lib/catalog/catalog";
import type { CatalogAsset } from "../lib/catalog/types";
import { getFavoriteIds } from "../lib/favorites/store";
import { AddToCartButton } from "./add-to-cart-button";
import { FavoriteButton } from "./favorite-button";

export function CatalogImageCard({
  asset,
  favorited = false,
  layout = "natural",
}: {
  asset: CatalogAsset;
  favorited?: boolean;
  layout?: "framed" | "natural";
}) {
  const defaultLicense =
    asset.licenses.find((license) => license.isDefault) ?? asset.licenses[0];

  return (
    <ImageCard
      href={`/images/${asset.slug}`}
      title={asset.title}
      thumbnailUrl={asset.thumbnailPublicUrl}
      previewUrl={asset.previewPublicUrl}
      categoryName={asset.categoryName}
      metadata={assetMetadata(asset)}
      pricePaise={asset.pricePaise}
      orientation={asset.orientation}
      width={asset.width}
      height={asset.height}
      layout={layout}
      overlay={
        <FavoriteButton assetId={asset.id} favorited={favorited} compact />
      }
      action={
        <AddToCartButton
          assetId={asset.id}
          assetLicenseId={defaultLicense?.id}
        />
      }
    />
  );
}

export async function CatalogImageGrid({
  assets,
  layout = "masonry",
}: {
  assets: CatalogAsset[];
  layout?: "masonry" | "grid";
}) {
  const session = await auth();
  const favoriteIds = new Set(await getFavoriteIds(session?.user?.id ?? null));
  const cards = assets.map((asset) => (
    <CatalogImageCard
      key={asset.id}
      asset={asset}
      favorited={favoriteIds.has(asset.id)}
      layout={layout === "masonry" ? "natural" : "framed"}
    />
  ));

  if (layout === "grid") {
    return <ImageGrid>{cards}</ImageGrid>;
  }

  return <ImageMasonry>{cards}</ImageMasonry>;
}
