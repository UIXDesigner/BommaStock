# Bommastock — Image Processing Pipeline

## 1. Objective

Automatically transform uploaded high-resolution master images into secure and optimized versions for the marketplace.

The administrator should upload only the master image.

The system automatically generates all required derivatives.

---

# 2. Image Lifecycle

Upload
↓
Validation
↓
Private Master Storage
↓
Metadata Extraction
↓
Image Processing
↓
Thumbnail Generation
↓
Preview Generation
↓
Watermark Generation
↓
Optimization
↓
Storage
↓
Database Update
↓
Admin Review
↓
Publish

---

# 3. Master Image

The master image is the original high-resolution file.

Examples:

- 8K
- 16K
- TIFF
- PNG
- JPEG

Master files must be private.

Example storage:

private/masters/{assetId}/original.{extension}

---

# 4. Validation

Validate:

- MIME type
- Extension
- File size
- Image dimensions
- Image readability
- Corrupted file detection

Reject unsupported files.

---

# 5. Metadata Extraction

Extract:

- Width
- Height
- Aspect ratio
- Orientation
- Format
- File size
- Color space where available
- EXIF data where appropriate

---

# 6. Thumbnail

Generate a small thumbnail.

Recommended maximum dimension:

300–500px

Format:

WebP or AVIF

Purpose:

- Search results
- Category pages
- Admin image lists

---

# 7. Preview

Generate optimized preview.

Recommended maximum dimension:

1500–2500px

Purpose:

- Product page
- Large preview
- Customer browsing

---

# 8. Watermarked Preview

Use the optimized preview as the source.

Apply Bommastock watermark.

Watermark requirements:

- Visible
- Difficult to crop out
- Does not completely destroy visual evaluation
- Repeated/diagonal watermark may be used
- Branding should be consistent

Store:

public/watermarked/{assetId}/preview.webp

---

# 9. Web Optimization

Use Sharp.

Preferred formats:

- WebP
- AVIF where appropriate

Use appropriate quality settings.

Do not aggressively compress images to the point of visible degradation.

---

# 10. Responsive Delivery

The storefront should request the most appropriate image size.

For example:

Mobile:
800px approximately

Tablet:
1200px approximately

Desktop:
2000px approximately

Exact dimensions may be optimized through CDN transformation.

---

# 11. Processing Status

Asset processing states:

UPLOADED
PROCESSING
READY
FAILED

The admin UI must display processing status.

---

# 12. Failure Handling

If processing fails:

- Keep master file safe.
- Record failure.
- Log error.
- Mark asset as FAILED.
- Allow administrator to retry processing.

Do not delete the master automatically because a derivative failed.

---

# 13. Duplicate Detection

Future enhancement:

Calculate a checksum/hash for uploaded files.

Use it to detect duplicate master files.

---

# 14. Image Naming

Do not rely on original filenames.

Use:

asset ID
+
asset code
+
file type

Example:

asset_1025_master.tiff
asset_1025_preview.webp
asset_1025_thumbnail.webp
asset_1025_watermarked.webp

---

# 15. Storage Separation

Recommended:

private/
    masters/

public/
    thumbnails/
    previews/
    watermarked/

---

# 16. Security

Never:

- expose master storage bucket
- put master URL in frontend
- return master storage key to unauthenticated users
- use predictable public master URLs

---

# 17. Future CDN Optimization

The architecture should allow integration with:

- Cloudflare Images
- Cloudflare Transformations
- Cloudinary
- Imgix

without changing the database/business logic significantly.

---

# 18. Processing Architecture

Initial implementation may use synchronous or lightweight background processing.

As scale increases, move processing into a queue-based worker system.

Future:

Upload
↓
Queue
↓
Worker
↓
Sharp
↓
Storage
↓
Database

---

# 19. Large Files

Very large files should use multipart/resumable uploads where necessary.

The UI should display:

- Upload progress
- Processing progress
- Success
- Failure

---

# 20. Original Preservation

Never overwrite the original master file during optimization.

The master is the source of truth.