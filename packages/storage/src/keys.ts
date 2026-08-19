/** D016: customer master download and admin working-preview TTL. */
export const SIGNED_URL_TTL_SECONDS = 300;

export function masterStorageKey(assetId: string, extension: string): string {
  return `private/masters/${assetId}/original.${extension}`;
}

export function workingPreviewStorageKey(assetId: string): string {
  return `private/previews/${assetId}/preview.webp`;
}

export function thumbnailStorageKey(assetId: string): string {
  return `public/thumbnails/${assetId}/thumbnail.webp`;
}

export function watermarkedPreviewStorageKey(assetId: string): string {
  return `public/previews/${assetId}/preview.webp`;
}

export function publicUrl(publicBaseUrl: string, storageKey: string): string {
  const base = publicBaseUrl.replace(/\/+$/, "");
  const path = storageKey.replace(/^\/+/, "");
  return `${base}/${path}`;
}
