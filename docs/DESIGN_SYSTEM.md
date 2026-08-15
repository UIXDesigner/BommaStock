# Bommastock — Design System

Version: Phase 0.1 (locked)

---

# 1. Design Direction

Bommastock should feel premium, modern, elegant, visual, minimal, and trustworthy.

Images remain the primary visual focus. UI chrome stays quiet.

---

# 2. Brand Colors

Primary brand colors will be defined after brand exploration.

Neutral foundation: black, white, gray scale.

Use neutrals extensively so image content stays dominant.

---

# 3. Typography

Modern sans-serif. Initial font: Inter.

Support strong hierarchy, readable metadata, clear INR prices, and accessible text sizing.

---

# 4. Spacing

Base: 4px.

Scale: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96.

---

# 5. Border Radius

Moderate rounding. Avoid excessive rounding.

- Cards: 12–16px
- Buttons: 8–12px
- Inputs: 8–12px

---

# 6. Image Cards

Priority:

1. Public thumbnail
2. Title
3. Metadata
4. Display price (GST-inclusive paise for the default license, passed in from the catalog service)
5. Actions

Hover may include quick preview of the **watermarked** image and Add to cart.

Do not include a favorite/wishlist control in MVP.

Cards must never use master or working-preview URLs.

`PriceDisplay` receives paise from the server and formats INR. It must not contain catalog prices.

---

# 7. Product Detail

- Large watermarked preview
- Title, description
- Resolution, format, category, tags
- `LicenseSelector` populated from active `AssetLicense` rows
- Display price for the selected license
- Add to cart
- Buy Now

Watermarks are baked into the preview file. Components do not overlay a CSS-only watermark as the security control.

---

# 8. Buttons

Primary: Add to Cart, Buy Now, Upload, Publish, Save, Pay

Secondary: Cancel, Edit, Preview, Retry processing, Unpublish

Destructive: Disable customer, Archive

Unpublish is secondary (returns the asset to `DRAFT`), not a separate status badge named Unpublished.

---

# 9. Forms

Every form control: label, input, helper text where needed, validation, error state, success state.

Accessible labels are required.

---

# 10. Loading

Skeleton loaders: image grids, product details, tables.

Progress: file upload and `processingStatus` (UPLOADED / PROCESSING / READY / FAILED).

---

# 11. Empty States

Every major view needs a meaningful empty state and an action where possible.

Examples: No images found. Cart is empty. No purchases yet. No failed jobs.

---

# 12. Accessibility

WCAG 2.2: keyboard, focus indicators, contrast, semantic structure, labels, screen readers, reduced motion where appropriate.

Decorative gallery images still need meaningful `alt` from the asset title.

---

# 13. Responsive Grid

CSS grid by available width, not fixed breakpoints alone.

- Large desktop: 4–6 cards
- Tablet: 3–4
- Mobile: 2

---

# 14. Component Strategy

Reusable presentational components in `packages/ui`. Domain data is passed in as props.

Examples:

- ImageCard
- ImageGrid
- SearchBar
- FilterPanel
- PriceDisplay
- LicenseSelector
- CartItem
- ProductMetadata
- UploadDropzone
- ImageProcessingStatus
- ProductStatusBadge (`DRAFT` | `PUBLISHED` | `ARCHIVED`)
- DataTable
- Modal
- Toast

`LicenseSelector` and `PriceDisplay` must not hard-code license codes, amounts, or GST percentages. Gallery cards receive the **default** `AssetLicense` GST-inclusive price from the catalog service.

Admin tables show `processingStatus` and `productStatus` as two badges, never as one combined list.
