export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
};

export type CatalogLicenseOption = {
  id: string;
  code: string;
  name: string;
  pricePaise: number;
  isDefault: boolean;
};

export type CatalogAsset = {
  id: string;
  code: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  width: number;
  height: number;
  format: string;
  orientation: "LANDSCAPE" | "PORTRAIT" | "SQUARE";
  tags: string[];
  licenses: CatalogLicenseOption[];
  /** Public CDN thumbnail URL. Never a master or working-preview key. */
  thumbnailPublicUrl: string;
  /** Public CDN watermarked preview URL. */
  previewPublicUrl: string;
  defaultLicenseName: string;
  /** GST-inclusive paise for the default AssetLicense. */
  pricePaise: number;
  publishedAt: string;
};
