# Bommastock — Project Constitution

Version: Phase 0.2 (locked)

This file is the highest-level project constitution. Implementation must follow it. Detailed schemas, flows, and security rules live in `/docs`. Phase 0.2 locks live in `/docs/DECISIONS.md`. If a lower-level document conflicts with this constitution or a LOCKED decision, stop and resolve the conflict before writing code.

---

# 1. Project Overview

Bommastock is a premium digital image marketplace, similar in concept to established stock-image marketplaces, focused initially on Indian cultural and devotional artwork.

The platform allows:

- Administrators to upload high-resolution master images.
- Administrators to manage image metadata, license-based pricing, categories, and licenses.
- Customers to discover and search images.
- Customers to preview optimized and watermarked versions.
- Customers to select a license, add images to a cart, or Buy Now.
- Customers to purchase images with Razorpay.
- Customers to securely download purchased high-resolution files.
- Administrators to manage customers, orders, downloads, and sales.

MVP supports a single business with provisioned admin users.

The architecture must allow a future multi-contributor marketplace. Do not implement contributor accounts, uploads, moderation, revenue share, or payouts in MVP.

---

# 2. Product Vision

Bommastock should become a modern digital asset marketplace focused initially on:

- Indian cultural imagery
- Hindu devotional artwork
- Digital wall art
- Backgrounds
- Decorative assets
- Festival artwork
- Indian traditional artwork
- Digital illustrations
- AI-generated artwork
- High-resolution printable artwork

The platform should eventually support many types of digital images.

---

# 3. Applications

Bommastock consists of two primary applications.

## 3.1 Customer Storefront (`apps/storefront`)

MVP:

- Browse image gallery
- Search images
- Browse categories and subcategories
- Filter images
- View image details
- View thumbnail and watermarked preview only
- Select a license
- Add to cart (guest cart supported; merge on login)
- Buy Now
- Customer authentication (email/password)
- Razorpay checkout
- Purchase history
- Secure download of purchased masters
- Account/profile

Not in MVP: wishlist, reviews, collections, coupons, subscriptions, credits.

## 3.2 Admin Application (`apps/admin`)

MVP:

- Admin authentication
- Dashboard
- Upload high-resolution master image
- Automatic asynchronous image processing
- Thumbnail, working preview, and watermarked preview generation
- Metadata, categories/subcategories, tags
- License management and license-based pricing
- Publish / unpublish (return to draft) / archive
- Processing status and failed-processing retry
- Orders, customers, download records
- Audit log

Not in MVP: collections CMS, contributor tools, coupons, advanced analytics product, full site CMS.

---

# 4. Technology Stack

Locked for MVP:

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Apps | Next.js App Router, React, TypeScript |
| UI | Tailwind CSS, shadcn/ui in `packages/ui` |
| Validation | Zod |
| Database | PostgreSQL (Neon) + Prisma |
| Auth | Auth.js with Prisma adapter |
| Storage | Cloudflare R2 (S3-compatible API) |
| CDN | Cloudflare for public derivatives only |
| Image processing | Sharp in `packages/image-processing` |
| Jobs | Asynchronous worker invoked by Inngest |
| Payments | Razorpay Orders + webhooks |
| Email | Resend (password reset) |
| Password hashing | Argon2id |
| Hosting | Vercel for both apps |

Do not use Supabase Auth. Do not use Stripe in MVP. Do not add Elasticsearch, OpenSearch, or Algolia in MVP.

Storage access uses the S3-compatible API so a future Amazon S3 backend can replace R2 without changing business logic.

---

# 5. Architecture Principles

The system must be modular.

Separate:

- Presentation
- Business logic
- Data access
- Storage
- Image processing
- Authentication
- Payments

Do not place business logic directly inside UI components.

Do not duplicate business logic between Admin and Storefront.

Shared business logic lives in reusable packages (`packages/commerce` for cart/checkout/entitlement/publish).

Apps may import packages. Packages must not import apps.

---

# 6. Image Security Principle

The original high-resolution master image must NEVER be publicly accessible.

Logical storage classes:

| Class | Key | Access |
|---|---|---|
| MASTER | `private/masters/{assetId}/original.{ext}` | Private. Signed URL after verified purchase only. |
| THUMBNAIL | `public/thumbnails/{assetId}/thumbnail.webp` | Public CDN. Gallery cards. |
| WATERMARKED_PREVIEW | `public/previews/{assetId}/preview.webp` | Public CDN. Storefront detail pages. |
| WORKING_PREVIEW | `private/previews/{assetId}/preview.webp` | Private. Admin/processing only. |

Distinguish three URL/key concepts:

| Term | Meaning | Browser |
|---|---|---|
| `storageKey` | Internal R2 object key stored in PostgreSQL | Never sent for MASTER or WORKING_PREVIEW |
| `publicUrl` | Application-generated Cloudflare CDN URL for public derivatives | Allowed for THUMBNAIL and WATERMARKED_PREVIEW |
| `signedUrl` | Short-lived R2 GET URL (TTL 300 seconds) | Returned only after entitlement (customer master download) or admin working-preview review |

Public storefront access is limited to thumbnail and watermarked preview `publicUrl` values.

Never expose:

- master
- working (unwatermarked) preview
- original filename as a storage path
- storage credentials
- MASTER or WORKING_PREVIEW `storageKey` values to the browser

Customers must never receive a permanent URL to the master. Purchased files are delivered through authenticated temporary `signedUrl` values with a 300-second TTL.

---

# 7. Automatic Image Processing

When an administrator uploads a master image, the system must automatically:

1. Validate the file (MIME, extension, magic bytes, size, dimensions, decodability).
2. Store the original privately in R2 without recompressing it.
3. Create the Asset record with `processingStatus = UPLOADED` and `productStatus = DRAFT`.
4. Create an `ImageProcessingJob`.
5. Process asynchronously via Inngest (never inside the upload HTTP request). The Inngest HTTP endpoint is signature-verified, not an unrestricted public worker API.
6. Extract metadata.
7. Generate thumbnail.
8. Generate optimized working preview.
9. Generate watermarked preview from the working preview.
10. Store derivatives in R2.
11. Save file metadata keys to PostgreSQL.
12. Set `processingStatus = READY` or `FAILED`.

Retry creates a **new** `ImageProcessingJob` row. Never overwrite a previous job. Never replace the master during processing.

The administrator must not manually create derivatives.

The administrator may publish only when `processingStatus = READY`.

---

# 8. Supported Image Formats

MVP:

- JPEG
- PNG
- TIFF
- WebP

Future: AVIF, PSD, RAW, SVG where appropriate.

Validation must include MIME type, file extension, file signature, file size, and image dimensions.

Configurable MVP limits (enforced in `packages/image-processing`, not in UI):

- Maximum upload size: 512 MiB
- Maximum longest edge: 20,000 px
- Maximum megapixels: 250

---

# 9. Master Image Rules

Master images must:

- Remain private.
- Preserve original quality.
- Preserve original dimensions.
- Not be unnecessarily recompressed.
- Be associated with an Asset record.
- Be downloadable only after verified purchase.
- Be delivered using temporary signed URLs (TTL 300 seconds).

---

# 10. Preview Rules

Public previews must:

- Be optimized for web (WebP).
- Be significantly smaller than the master.
- Include a Bommastock watermark on the storefront detail preview.
- Prevent direct access to the master and working preview.
- Support responsive display.

Watermark generation lives in `packages/image-processing`. UI components must not apply watermarks.

---

# 11. Database Rules

PostgreSQL is the source of truth for application data.

Do not store image binaries in PostgreSQL.

Store metadata, object keys, users, catalog, orders, payments, licenses, and download records.

Money is stored as integer minor units: `pricePaise Int`. MVP currency is `INR`. Do not use floating point for money.

Historical `OrderItem` price, title, license, tax, and currency snapshots must never change when catalog data changes.

---

# 12. Payment Security

Never trust payment status, price, or order amount received from the client.

If the live `AssetLicense` price differs from the cart quoted price, checkout returns `PRICE_CHANGED` and requires customer confirmation. Do not silently charge the old or the new price.

The server calculates the checkout amount from current `AssetLicense` rows (GST-inclusive catalog prices). It creates the Razorpay order, verifies the payment server-side, and uses the Razorpay webhook as authoritative reconciliation.

Internal **payment** statuses: `PENDING` | `AUTHORIZED` | `CAPTURED` | `FAILED` | `CANCELLED` | `REFUNDED`.

Internal **order** statuses: `PENDING` | `PAID` | `FAILED` | `CANCELLED` | `REFUNDED`.

Do not use `PENDING_PAYMENT` or `CREATED`.

Download entitlement exists only when the order is `PAID` and the payment is `CAPTURED`.

Payment secrets must never be exposed to frontend code. `RAZORPAY_KEY_ID` may be public; `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are server-only.

---

# 13. Download Security

Before providing a master download:

1. Authenticate the customer.
2. Identify the asset from the `OrderItem`.
3. Verify the purchase belongs to the authenticated customer.
4. Verify payment is captured.
5. Verify license entitlement on the order line.
6. Verify the master file exists.
7. Generate a `signedUrl` (TTL 300 seconds).
8. Log the download.
9. Return the temporary `signedUrl` only — never the master `storageKey`.

---

# 14. UX Principles

Bommastock should feel premium, modern, visual, fast, trustworthy, minimal, and professional.

The primary focus is visual discovery. Images receive more visual emphasis than text.

---

# 15. Responsive Design

Storefront: desktop, laptop, tablet, mobile.

Admin: desktop, laptop, tablet. Mobile admin is desirable but not mandatory for MVP.

---

# 16. Accessibility

Follow WCAG 2.2: keyboard navigation, visible focus, semantic HTML, contrast, labels, error messages, alternative text, screen-reader support, reduced motion where appropriate.

---

# 17. Code Quality

Use TypeScript, strong typing, reusable components, modular architecture, clear naming, small functions, consistent error handling.

Avoid `any`, duplicated logic, giant components, hard-coded business rules, hard-coded prices, hard-coded image URLs, and secrets in source code.

Prices displayed in the UI are display values. The server is authoritative.

---

# 18. Environment Variables

Secrets must be stored in environment variables. Do not commit `.env` files containing secrets.

Categories: database, auth, R2, Razorpay, app URLs, job runner. See `/docs/ARCHITECTURE.md` for the inventory.

`RAZORPAY_KEY_ID` may be exposed as a public env var for Checkout. All other secrets are server-only.

---

# 19. Development Method

Do not build the entire application in one step.

Implement incrementally:

1. Understand existing architecture.
2. Review relevant documentation.
3. Identify database requirements.
4. Implement backend.
5. Implement frontend.
6. Connect both.
7. Test.
8. Handle errors.
9. Handle loading states.
10. Handle empty states.
11. Document important changes.

After implementation: typecheck, lint, run tests, fix errors before the next feature.

Never claim a feature is complete without verifying the implementation.

---

# 20. Future Multi-Contributor Architecture

Do not implement in MVP:

- Contributor accounts
- Artist profiles
- Contributor uploads
- Content moderation
- Revenue sharing
- Contributor earnings
- Contributor dashboards
- Contributor payouts

Avoid schema choices that prevent adding a nullable asset owner and later contributor tables.

---

# 21. Asset Status Model

Two independent fields on Asset:

`processingStatus`: `UPLOADED` | `PROCESSING` | `READY` | `FAILED`

`productStatus`: `DRAFT` | `PUBLISHED` | `ARCHIVED`

Rules:

- New assets start as `processingStatus = UPLOADED`, `productStatus = DRAFT`.
- Admin may publish only when `processingStatus = READY`.
- Publish sets `productStatus = PUBLISHED`.
- Unpublish returns `productStatus` to `DRAFT`.
- Archive sets `productStatus = ARCHIVED`.
- Storefront discovery includes only `PUBLISHED` assets with `processingStatus = READY`.
- Existing purchases remain valid after unpublish or archive.

---

# 22. Pricing Model

MVP uses license-based pricing.

An asset may have one or more licenses through `AssetLicense`.

MVP seeds the `STANDARD` license. Additional licenses (Extended, Editorial, Commercial, Enterprise) may be added later as data, not as UI hard-coding.

Every published asset has exactly one default active `AssetLicense`. Add to cart without an explicit license uses that default.

Catalog `pricePaise` is GST-inclusive. `pricePaise = 0` is allowed. The server calculates checkout amounts. `OrderItem` stores an immutable tax-aware price snapshot. Phase 0.2 details: `/docs/DECISIONS.md`.

---

# 23. Authentication Model

Auth.js + Prisma adapter. One `User` model. Roles: `CUSTOMER` | `ADMIN`.

- Customer registration/login is public (email and password via Auth.js Credentials).
- Guest cart is allowed; merge into the customer cart on login.
- OAuth social login is future scope.
- Email verification is not required for MVP checkout.
- There is no public admin registration.
- Admins are provisioned by a secure seed/bootstrap process. Bootstrap credentials are environment/CLI only, never source code.
- Admin authorization is always enforced server-side. Same User table; role is `ADMIN`.

---

# 24. Source of Truth

Authoritative documents:

- `/docs/DECISIONS.md`
- `/docs/PRODUCT_REQUIREMENTS.md`
- `/docs/ARCHITECTURE.md`
- `/docs/DATABASE.md`
- `/docs/DESIGN_SYSTEM.md`
- `/docs/IMAGE_PIPELINE.md`
- `/docs/SECURITY.md`
- `/docs/ADMIN_FLOWS.md`
- `/docs/CUSTOMER_FLOWS.md`

If implementation conflicts with these documents, review the conflict before changing architecture.

---

# 25. Cursor Development Rule

Before implementing a feature:

- Read AGENTS.md.
- Read the relevant documentation.
- Inspect existing code.
- Reuse existing components/services.
- Do not create duplicate implementations.

After implementation:

- Run type checking.
- Run linting.
- Run tests where available.
- Fix errors before moving to the next feature.

Never claim a feature is complete without verifying the implementation.
