# Bommastock — Image Processing Pipeline

Version: Phase 0 (locked)

---

# 1. Objective

Automatically transform an uploaded high-resolution master into secure, optimized derivatives.

The administrator uploads only the master. The system generates all derivatives. The administrator never creates thumbnails, previews, or watermarks by hand.

Processing runs asynchronously. It must not run inside the upload HTTP request.

---

# 2. Image Lifecycle

```text
Admin selects master
→ Validate
→ Store MASTER in private R2 (unmodified)
→ Create Asset (processingStatus=UPLOADED, productStatus=DRAFT)
→ Create ImageProcessingJob (QUEUED)
→ Return to admin UI
→ Worker sets PROCESSING
→ Metadata extraction
→ Thumbnail (public)
→ Working preview (private, unwatermarked)
→ Watermarked preview (public)
→ Update AssetFile rows and Asset dimensions
→ processingStatus=READY (or FAILED)
→ Admin may publish only when READY
```

Publishing is a separate product action. See `productStatus` in `/docs/PRODUCT_REQUIREMENTS.md`.

---

# 3. Storage Classes and Keys

| Class | Key | Access | Format |
|---|---|---|---|
| MASTER | `private/masters/{assetId}/original.{ext}` | Private | Original (jpeg/png/tiff/webp) |
| THUMBNAIL | `public/thumbnails/{assetId}/thumbnail.webp` | Public CDN | WebP |
| WATERMARKED_PREVIEW | `public/previews/{assetId}/preview.webp` | Public CDN | WebP |
| WORKING_PREVIEW | `private/previews/{assetId}/preview.webp` | Private | WebP |

Do not use original filenames in keys. Do not use `assetCode` in keys. Object keys use `assetId` and file class only. `assetCode` is a public catalog field on Asset.

There is no public unwatermarked large preview.

---

# 4. Master Image

The master is the original high-resolution file (including 8K/16K TIFF/PNG/JPEG/WebP).

Rules:

- Private
- Never recompressed or overwritten during optimization
- Source of truth for later retries
- Downloadable only after verified purchase via a 300-second signed URL

---

# 5. Validation

Reject before or immediately after upload if any check fails:

- MIME type allowlist: `image/jpeg`, `image/png`, `image/tiff`, `image/webp`
- Extension allowlist: `jpg`, `jpeg`, `png`, `tif`, `tiff`, `webp`
- File signature / magic bytes (do not trust the client MIME)
- Decodability (Sharp must read the file)
- Maximum upload size: 512 MiB
- Maximum longest edge: 20,000 px
- Maximum megapixels: 250

These limits live in `packages/image-processing` configuration, not in UI components.

Do not execute uploaded files. Do not use the original filename as a path.

---

# 6. Metadata Extraction

From the master, persist on Asset and MASTER AssetFile:

- Width
- Height
- Orientation (`LANDSCAPE` if width > height, `PORTRAIT` if height > width, `SQUARE` otherwise)
- Format and MIME
- File size bytes
- Color space where available

EXIF may be read for admin diagnostics. Strip EXIF (and GPS) from all public derivatives and from the working preview.

---

# 7. Thumbnail

- Longest edge: 480 px
- Format: WebP
- Purpose: gallery cards, category pages, admin lists, cart thumbnails
- Public CDN
- Small enough that an unwatermarked thumbnail is acceptable. It is not a substitute for the master.

---

# 8. Working Preview

- Longest edge: 1600 px
- Format: WebP
- Unwatermarked
- Private R2 only
- Source for the watermarked preview
- Admin review only
- Never sent to the storefront

---

# 9. Watermarked Preview

- Generated from the working preview
- Longest edge: 1600 px
- Format: WebP
- Public CDN
- Used on storefront detail pages

Watermark requirements:

- Visible
- Difficult to crop out
- Must not completely destroy visual evaluation
- Repeated diagonal pattern
- Consistent Bommastock branding

Watermark parameters (text or mark image, opacity, scale, spacing, angle) are configured in `packages/image-processing`. UI components must not draw watermarks.

---

# 10. Web Optimization

Use Sharp.

MVP derivative format: WebP only.

Quality must remain suitable for evaluating the artwork. Do not aggressively crush previews.

CMYK masters: convert derivatives to sRGB. Leave the master unchanged.

AVIF is future, not MVP.

---

# 11. Responsive Delivery

Storefront requests the public thumbnail or watermarked preview. CDN may resize further.

Approximate display widths:

- Mobile gallery: thumbnail
- Tablet/desktop gallery: thumbnail
- Detail page: watermarked preview (1600 px source)

The storefront must never request MASTER or WORKING_PREVIEW.

---

# 12. Processing Status

Asset `processingStatus` (independent of `productStatus`):

| Value | Meaning |
|---|---|
| UPLOADED | Master stored, job not complete |
| PROCESSING | Worker running |
| READY | Derivatives stored; eligible to publish |
| FAILED | Job failed; master retained; retry allowed |

Admin UI must show this status. `productStatus` remains `DRAFT` until an admin publishes.

---

# 13. Failure Handling

If processing fails:

- Keep the master
- Set `processingStatus = FAILED`
- Store safe `errorCode` and `errorMessage` on `ImageProcessingJob`
- Allow admin retry (new job; never overwrite the master)

Do not delete the master because a derivative failed.

---

# 14. Job Architecture

MVP runner: Inngest.

`packages/image-processing` exposes `processAsset(assetId)` and does not import Inngest. The admin app (or a worker entry) enqueues the job. The worker calls the package.

This is required in MVP. Do not process large masters inside the upload serverless request.

---

# 15. Duplicate Detection

Future: checksum/hash of the master. Not in MVP.

---

# 16. Security

Never:

- Expose the private bucket or working-preview prefix on the CDN
- Put a master URL in frontend HTML or JS
- Return master or working-preview storage keys to unauthenticated users or to the storefront
- Use predictable public URLs for masters

Public files are thumbnail and watermarked preview only.

---

# 17. Future CDN Optimization

The storage key + file class model allows later Cloudflare Transformations, Cloudflare Images, Cloudinary, or Imgix without changing checkout or entitlement logic. Do not integrate those in MVP.

---

# 18. Large Files

Use multipart/resumable uploads to private R2 when the file is large.

UI must show:

- Upload progress
- Processing status (UPLOADED / PROCESSING / READY / FAILED)
- Success
- Failure with retry

---

# 19. Original Preservation

Never overwrite the original master during optimization. The master is the source of truth for retries and for customer download.
