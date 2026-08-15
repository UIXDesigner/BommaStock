# Bommastock — Image Processing Pipeline

Version: Phase 0.2 (locked)

---

# 1. Objective

Automatically transform an uploaded master into secure derivatives. Admin uploads only the master. Processing is asynchronous via Inngest. It must not run inside the upload HTTP request.

---

# 2. Image Lifecycle

```text
Validate (type/size) → presigned PUT to private master
→ Asset UPLOADED + DRAFT (title Untitled Asset, code from DailySequence)
→ ImageProcessingJob QUEUED (new row)
→ Inngest (signature-verified HTTP)
→ PROCESSING
→ Magic bytes + Sharp decode
→ Metadata
→ Thumbnail (public)
→ Working preview (private)
→ Watermarked preview (public)
→ AssetFile rows (storageKey server-side)
→ READY or FAILED
→ Publish is a separate product action
```

---

# 3. storageKey, publicUrl, signedUrl

| Term | Use |
|---|---|
| `storageKey` | PostgreSQL / R2 internal key. Never sent to the browser for MASTER or WORKING_PREVIEW. |
| `publicUrl` | CDN URL for THUMBNAIL and WATERMARKED_PREVIEW. |
| `signedUrl` | 300s GET for entitled master download or admin working preview. |

| Class | storageKey | Browser |
|---|---|---|
| MASTER | `private/masters/{assetId}/original.{ext}` | `signedUrl` after purchase |
| THUMBNAIL | `public/thumbnails/{assetId}/thumbnail.webp` | `publicUrl` |
| WATERMARKED_PREVIEW | `public/previews/{assetId}/preview.webp` | `publicUrl` |
| WORKING_PREVIEW | `private/previews/{assetId}/preview.webp` | Admin `signedUrl` 300s |

Do not use original filenames or `assetCode` in keys.

---

# 4. Master Image

Private, never recompressed during optimization, never overwritten by a retry. Source of truth for retries and customer download (`signedUrl` 300s).

MVP has no in-place replace-master. Future replace-master must add a new versioned object.

---

# 5. Validation

Two stages (D007):

1. **Before presigned PUT:** MIME allowlist, extension, declared size ≤ 512 MiB. No PUT URL if rejected.
2. **In Inngest job:** magic bytes, Sharp decode, actual dimensions, megapixels, CMYK convertibility.

Allowlist MIME: `image/jpeg`, `image/png`, `image/tiff`, `image/webp`.  
Extensions: `jpg`, `jpeg`, `png`, `tif`, `tiff`, `webp`.  
Max longest edge: 20,000 px. Max megapixels: 250.  
Filename sanitization: original name is discarded; it is never a storage path.

Single PUT if size ≤ 100 MiB; multipart if 100 MiB < size ≤ 512 MiB.

CMYK: accept only if Sharp can decode and convert derivatives to sRGB. If not, fail the job with a clear processing error. Leave the master unchanged.

Limits live in `packages/image-processing`.

---

# 6. Metadata Extraction

Width, height, orientation (`LANDSCAPE` / `PORTRAIT` / `SQUARE`), format, MIME, size. Strip EXIF/GPS from derivatives and working preview.

---

# 7. Derivatives

- Thumbnail: longest edge 480 px, WebP **quality 75**
- Working preview: 1600 px, WebP **quality 82**, private, unwatermarked
- Watermarked preview: from working preview, 1600 px, WebP **quality 82**, public

Watermark defaults (D034): repeated diagonal text `BOMMASTOCK`, −35°, opacity 0.16, font 5% of min(width,height) clamped 18–72 px, tile gap 1.6× font, white fill + 1 px dark stroke. Constants in `packages/image-processing`. No admin UI in MVP.

CMYK masters: convert **derivatives** to sRGB; do not recompress the master.

MVP derivative format: WebP only.

---

# 8. Processing Status

`UPLOADED` | `PROCESSING` | `READY` | `FAILED` — independent of `productStatus`.

---

# 9. Failure and Retry

Keep the master. Set asset `FAILED`. Store safe error on **that** job row.

Retry: insert a **new** `ImageProcessingJob` with `attempt = max(attempt)+1`. Do not overwrite the previous job. Do not replace the master.

---

# 10. Inngest

MVP orchestrator: Inngest.

`apps/admin` `POST /api/inngest` is protected by Inngest’s signing verification. It is not an unrestricted public worker API.

Function steps: receive job → load master from R2 by `storageKey` (server) → Sharp thumbnail, preview, watermark → upload derivatives → update job → update asset `processingStatus` → record errors on failure.

`packages/image-processing` does not import Inngest.

---

# 11. Duplicate Detection

Future checksum. Not MVP.

---

# 12. Security

Never put master `storageKey` in frontend HTML/JS. Never bind the private bucket to the public CDN. Public files: thumbnail and watermarked preview only.

---

# 13. Future CDN

Key + file-class model allows later transformation CDNs without changing entitlement. Not MVP.

---

# 14. Large Files

Multipart/resumable to private R2 when needed. UI: upload progress and `processingStatus`.

---

# 15. Original Preservation

Never overwrite the original master during optimization or retry.
