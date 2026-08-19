# Bommastock — System Architecture

Version: Phase 0.2 (locked)

This document is the implementation architecture. It must stay consistent with `AGENTS.md`, `/docs/DATABASE.md`, and `/docs/DECISIONS.md`.

Do not place business logic in React components. Do not duplicate domain rules between `apps/storefront` and `apps/admin`.

---

# 1. System Architecture

Two Next.js applications share PostgreSQL, Auth.js, Cloudflare R2, and domain packages.

```text
Customer  →  apps/storefront  →  packages (auth, commerce, database, payments, storage, types, ui)
Admin     →  apps/admin       →  packages (auth, commerce, database, image-processing, storage, types, ui)
                              →  POST /api/inngest (Inngest-verified)

packages/database  →  PostgreSQL (Neon)
packages/commerce  →  cart, checkout, entitlement, publish, GST math
packages/storage   →  Cloudflare R2
packages/payments  →  Razorpay HTTP
packages/image-processing + Inngest  →  Sharp  →  R2 + PostgreSQL
```

Domain services live in `packages/commerce` (cart, checkout, entitlement, publish). Razorpay I/O lives in `packages/payments`. They are called from server actions/route handlers, never from React components.

---

# 2. Monorepo Structure

```text
bommastock_v1/
  apps/storefront/
  apps/admin/                   Includes Inngest serve route
  packages/ui/
  packages/types/
  packages/database/            Prisma schema lives here
  packages/auth/
  packages/storage/
  packages/image-processing/
  packages/payments/
  packages/commerce/            Cart, checkout, entitlement, publish, GST
  packages/config/
  docs/
  AGENTS.md
```

Apps import packages. Packages do not import apps. `packages/ui` does not import storage, payments, or database.

---

# 3. Application Boundaries

`apps/storefront`: catalog, guest+auth cart, customer auth, checkout, purchases, download service calls. Must not run Sharp, verify Razorpay in the browser, or return master `storageKey`.

`apps/admin`: upload, processing status, catalog, licenses, orders, customers, downloads, audit. Must not expose working previews as public CDN objects or offer public admin registration.

---

# 4. Package Boundaries

Packages: `ui`, `types`, `database`, `auth`, `storage`, `image-processing`, `payments`, `commerce`, `config`.

`storage` generates `publicUrl` and `signedUrl`. It never returns private `storageKey` to route handlers that serialize JSON to the browser.

---

# 5. Request Flow

```text
Browser
  → Next.js Server Component / Server Action / Route Handler
    → requireUser / requireAdmin when the route is protected
    → Zod parse
    → domain service
      → database | storage | payments | image-processing
```

Guest browse and guest cart mutations do not require `requireUser`. Checkout, purchases, and downloads do.

---

# 6. Authentication Flow

Auth.js + Prisma adapter. Database sessions. One `User` table. Roles: `CUSTOMER`, `ADMIN`. No Supabase Auth.

## 6.1 Customer

Email/password (Credentials). Argon2id hashes. Change-password and forgot-password are MVP (D027). Storefront social login: Google, Microsoft Entra ID (Outlook), and Apple. OAuth creates/links `CUSTOMER` users only. Email verification not required for MVP checkout.

Guest cart cookie (`guestToken`) is allowed before login. On login, merge guest cart into the user cart.

## 6.2 Admin

Same identity system. `requireAdmin()` on every admin mutation. No public admin registration. Existing admins may create additional admins in the admin app (D029).

## 6.3 First-admin bootstrap

CLI/seed after migrations using `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` (plaintext env, hashed Argon2id on insert). Refuse if an admin exists. Never put bootstrap credentials in source code.

## 6.4 Cookie isolation

| App | AUTH_URL | Cookie |
|---|---|---|
| storefront | STOREFRONT_URL | `bommastock.storefront.session` |
| admin | ADMIN_URL | `bommastock.admin.session` |

Database sessions, 14-day max age. `AUTH_SECRET` may be shared.

---

# 7. Admin Flow

```text
Login → requireAdmin → Dashboard
  → Presigned upload to private R2
  → Asset DRAFT + UPLOADED, title Untitled Asset, code from DailySequence
  → ImageProcessingJob attempt 1 QUEUED
  → Inngest (verified HTTP) → Sharp → READY or FAILED
  → Metadata, default AssetLicense
  → Publish only if READY → PUBLISHED
  → Unpublish → DRAFT
  → Archive → ARCHIVED
```

Audit **mutations** listed in `/docs/SECURITY.md`. Do not audit ordinary list/detail views.

MVP has no in-place replace-master. Future replace-master must version a new master object.

---

# 8. Upload Flow

1. Rate-limit upload initiation.
2. Validate declared type/size; issue presigned PUT to the private master key (filename discarded; key is `private/masters/{assetId}/original.{ext}`).
3. After upload, worker/job performs magic-byte + Sharp decode validation. If invalid, `processingStatus = FAILED` with a safe error; keep or delete the invalid object without publishing.
4. Create Asset (`Untitled Asset`, generated `code`/`slug`), MASTER `AssetFile`, `ImageProcessingJob`.
5. Return. Do not process 8K/16K TIFF in this HTTP request.

---

# 9. Image Processing Flow (Inngest)

`apps/admin` exposes `POST /api/inngest`. This is **not** an unrestricted public worker API. Inngest signing-key verification is required. Reject unsigned requests.

```text
Inngest function
  → set job RUNNING, asset PROCESSING
  → get master from private R2 via storageKey (server-side only)
  → Sharp: metadata, thumbnail, working preview, watermarked preview
  → upload derivatives
  → write AssetFile rows
  → copy dimensions onto Asset
  → job SUCCEEDED, asset READY
```

Failure: keep master, job FAILED with error fields, asset FAILED. Retry inserts a **new** job with `attempt = max+1`.

---

# 10. Catalog Publishing Flow

Publish when READY, real title (not `Untitled Asset`), category, ≥1 tag, MASTER, WATERMARKED_PREVIEW, exactly one default active `AssetLicense`.

Storefront: `PUBLISHED` + `READY` and category (and ancestors) `ACTIVE`. Parent category pages include descendant category assets. Inactive category hides those assets from discovery without changing `productStatus`.

Unpublish → `DRAFT`, clear `publishedAt`. Archive → `ARCHIVED`. Purchases remain downloadable.

---

# 11. Cart Flow

Guest or authenticated.

Add to cart:

- If no license selected, use the asset’s default `AssetLicense`.
- Validate `PUBLISHED` + `READY` and active license.
- Upsert `CartItem` `(cartId, assetId, assetLicenseId)`.
- Store `quotedUnitPriceIncludingTaxPaise` from current inclusive catalog price (display only).

Login: merge guest cart into user cart.

---

# 12. Checkout Flow

Checkout requires `requireUser` (CUSTOMER). Guest must log in first (cart already merged).

Buy Now uses the same `CheckoutService` with one in-memory line.

```text
CheckoutService.create({ userId, items, idempotencyKey })
  → return existing Order if (userId, idempotencyKey) already exists
  → load items
  → validate availability (PUBLISHED + READY, license active, category active)
  → load live AssetLicense.pricePaise (GST-inclusive)
  → if live price ≠ quotedUnitPriceIncludingTaxPaise:
       return PRICE_CHANGED with the new inclusive price
       do not create Order or Razorpay order
  → after customer confirms, quotes are updated and checkout is resubmitted
  → compute tax with round-half-up from the single ACTIVE TaxRate
  → create Order PENDING with immutable OrderItem snapshots + idempotencyKey
  → create Payment PENDING
  → if totalPaise === 0: mark Payment CAPTURED and Order PAID (no Razorpay)
  → else: create Razorpay order (payment_capture: 1, receipt = orderNumber)
  → return Razorpay checkout payload or paid confirmation
```

Never trust browser prices.

Storefront payment routes:

- `POST /api/payments/razorpay/verify`
- `POST /api/payments/razorpay/webhook`

---

# 13. Razorpay Verification Flow

```text
1. Server already created Razorpay order for the inclusive total.
2. Customer pays in Checkout.
3. Client sends payment ids (untrusted).
4. Server verifies HMAC with RAZORPAY_KEY_SECRET and amount/currency/order id.
5. Webhook is authoritative reconciliation.
6. Map providerStatus → PaymentStatus (see DATABASE.md).
7. On CAPTURED (idempotent on providerPaymentId):
     Payment CAPTURED, Order PAID, paidAt set
     download entitlement on
8. Duplicate webhook: no-op.
```

Verified callback plus a server-side Razorpay payment fetch confirming `captured` **may** also set CAPTURED so the customer is not blocked if the webhook is delayed. Both paths are idempotent. Client-reported success alone never sets PAID.

Failed attempt → Payment FAILED, Order FAILED. No entitlement. Customer starts a new checkout.

Explicit cancel or 30-minute unpaid expiry → Payment CANCELLED, Order CANCELLED.

Refund: admin full refund via Razorpay (MVP). Webhook `refund.processed` → Payment REFUNDED, Order REFUNDED, entitlement revoked. Audit `ORDER_REFUND`. Partial refunds are out of MVP.

---

# 14. Secure Download Flow

TTL 300 seconds. Rate-limited.

```text
requireUser
→ load OrderItem by id (ignore client asset ids as authority)
→ Order.userId === session.userId
→ Order.status === PAID
→ Payment.status === CAPTURED
→ entitlement = this OrderItem license snapshot (not live AssetLicense.isActive)
→ resolve MASTER storageKey server-side
→ signedUrl GET, 300s, Content-Disposition filename `{assetCode}_{licenseCode}.{ext}`
→ insert Download
→ return { url: signedUrl, expiresInSeconds: 300 }
```

Never return `storageKey`, credentials, or a permanent private URL. A customer cannot obtain another customer’s master by swapping an asset id.

Admin working preview: `signedUrl` TTL 300 seconds, `requireAdmin` only.

---

# 15. Storage Architecture

Two R2 buckets. PostgreSQL stores `storageKey`.

| Class | storageKey | Browser |
|---|---|---|
| MASTER | `private/masters/{assetId}/original.{ext}` | `signedUrl` after purchase only |
| WORKING_PREVIEW | `private/previews/{assetId}/preview.webp` | Admin `signedUrl` only, 300s |
| THUMBNAIL | `public/thumbnails/{assetId}/thumbnail.webp` | `publicUrl` via CDN |
| WATERMARKED_PREVIEW | `public/previews/{assetId}/preview.webp` | `publicUrl` via CDN |

`publicUrl` = `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` + public key path. That URL is not a private key leak.

Private-bucket CORS: `ADMIN_URL` only, PUT/GET/HEAD. Public bucket: GET/HEAD from storefront and admin. Multipart when upload size > 100 MiB.

---

# 16. Database Architecture

See `/docs/DATABASE.md`. Money: integer paise, GST-inclusive catalog, round-half-up extraction onto orders. Guest carts. DailySequence for codes and order numbers. One ACTIVE TaxRate. New ImageProcessingJob per retry.

---

# 17. Deployment Topology

```text
Vercel          apps/storefront
Vercel          apps/admin (+ /api/inngest)
Neon            PostgreSQL
Cloudflare R2   private + public buckets
Cloudflare CDN  public derivatives only
Inngest         processing + unpaid-order expiry cron
Razorpay        payments
Resend          password-reset email
```

---

# 18. Environment Variable Categories

| Category | Server-only | Public |
|---|---|---|
| Database | `DATABASE_URL` | — |
| Auth | `AUTH_SECRET`, `AUTH_URL`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_MICROSOFT_ID`, `AUTH_MICROSOFT_SECRET`, `AUTH_MICROSOFT_TENANT_ID`, `AUTH_APPLE_ID`, `AUTH_APPLE_SECRET` | — |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` | — |
| R2 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PRIVATE_BUCKET`, `R2_PUBLIC_BUCKET`, `R2_ENDPOINT` | `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` |
| Payments | `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | `NEXT_PUBLIC_RAZORPAY_KEY_ID` |
| App URLs | `STOREFRONT_URL`, `ADMIN_URL` | — |
| Jobs | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | — |

---

# 19. Security Boundaries

| Boundary | Rule |
|---|---|
| Browser | Untrusted. May receive `publicUrl` and entitled `signedUrl` only. |
| Storefront server | Catalog, cart, checkout, download service. |
| Admin server | ADMIN role. Working-preview `signedUrl`. |
| Inngest route | Signature-verified only. |
| Public CDN | Thumbnails and watermarked previews. |
| Private R2 | Masters and working previews. |
| Razorpay webhook | Signature-verified, idempotent, authoritative reconciliation. |

Rate limits: login, upload initiation, payment creation, download URL minting. See `/docs/SECURITY.md`.

---

# 20. Site Content

No CMS. Static/application configuration plus newest published assets.

---

# 21. Out of MVP

Contributor marketplace, coupons, wishlist, reviews, subscriptions, credits, AI tagging, visual search, mobile apps, public API, Stripe, Elasticsearch, advanced CMS, in-place master replace.
