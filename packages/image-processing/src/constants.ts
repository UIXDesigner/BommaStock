export const MAX_MASTER_BYTES = 512 * 1024 * 1024;
export const MULTIPART_THRESHOLD_BYTES = 100 * 1024 * 1024;
export const MAX_LONG_EDGE_PX = 20_000;
export const MAX_MEGAPIXELS = 250;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/webp",
] as const;

export const ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "tif",
  "tiff",
  "webp",
] as const;

export const THUMBNAIL_MAX_EDGE_PX = 480;
export const PREVIEW_MAX_EDGE_PX = 1600;
export const WEBP_THUMBNAIL_QUALITY = 75;
export const WEBP_PREVIEW_QUALITY = 82;
export const WEBP_EFFORT = 4;

export const WATERMARK_TEXT = "BOMMASTOCK";
export const WATERMARK_ANGLE_DEGREES = -35;
export const WATERMARK_OPACITY = 0.16;
export const WATERMARK_FONT_SIZE_RATIO = 0.05;
export const WATERMARK_FONT_SIZE_MIN_PX = 18;
export const WATERMARK_FONT_SIZE_MAX_PX = 72;
export const WATERMARK_TILE_GAP_RATIO = 1.6;
