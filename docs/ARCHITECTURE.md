# Bommastock — System Architecture

Version: Phase 0 (locked)

This document is the implementation architecture. It must stay consistent with `AGENTS.md` and `/docs/DATABASE.md`.

Do not place business logic in React components. Do not duplicate domain rules between `apps/storefront` and `apps/admin`.

---

# 1. System Architecture

Two Next.js applications share PostgreSQL, Auth.js, Cloudflare R2, and domain packages.

```text
Customer  →  apps/storefront  →  packages (auth, database, payments, storage, types, ui)
Admin     →  apps/admin       →  packages (auth, database, image-processing, storage, types, ui)

packages/database  →  PostgreSQL
packages/storage   →  Cloudflare R2
packages/payments  →  Razorpay
packages/image-processing + Inngest worker  →  Sharp  →  R2 + PostgreSQL
```

High-level flows:

```text
Browse/Search     →  PostgreSQL catalog (PUBLISHED + READY only)
Upload            →  private R2 master  →  async job  →  derivatives
Checkout          →  server price calc  →  pending Order  →  Razorpay  →  verify  →  PAID
Download          →  auth + entitlement  →  signed master URL (300s)
```

---

# 2. Monorepo Structure

```text
bommastock_v1/
  apps/storefront/              Customer Next.js app
  apps/admin/                   Admin Next.js app
  packages/ui/                  shadcn primitives, tokens, presentational components
  packages/types/               Shared TypeScript types and Zod schemas
  packages/database/            Prisma schema, client, repositories
  packages/auth/                Auth.js config, session helpers, RBAC
  packages/storage/             R2 client, key builders, signed URLs
  packages/image-processing/    Validation, Sharp, watermark, limits
  packages/payments/            Razorpay port, amount calc, verification
  packages/config/              Env schema (server vs public)
  docs/
  AGENTS.md
```

Prisma schema lives in `packages/database`. Root `prisma/` is not used.

Import rule: apps import packages. Packages do not import apps. `packages/ui` does not import storage, payments, or database.

---

# 3. Application Boundaries

## 3.1 `apps/storefront`

Owns:

- Public catalog pages
- Auth pages (customer register/login)
- Cart, checkout, account, purchases
- Calling shared services

Must not:

- Mint master signed URLs except through the download service
- Verify Razorpay signatures in client code
- Run Sharp
- Trust client-submitted prices

## 3.2 `apps/admin`

Owns:

- Admin UI
- Upload UX and processing status
- Catalog, license, order, customer, download, audit screens

Must not:

- Expose working previews or masters to the public internet
- Register admins through a public form
- Bypass server-side ADMIN checks

---

# 4. Package Boundaries

| Package | Responsibility |
|---|---|
| `ui` | Presentational components. Display prices passed in as props. |
| `types` | Shared types and Zod contracts. |
| `database` | Prisma, migrations, repositories. No HTTP. |
| `auth` | Auth.js + Prisma adapter, `getSession`, `requireUser`, `requireAdmin`. |
| `storage` | Bucket mapping, key layout, presigned upload, signed download. |
| `image-processing` | Validate, metadata, Sharp derivatives, watermark config. |
| `payments` | Server amount calculation, Razorpay order create, signature/webhook verify. |
| `config` | Typed env access. |

---

# 5. Request Flow

```text
Browser
  → Next.js Server Component / Server Action / Route Handler
    → requireUser / requireAdmin (packages/auth)
    → Zod parse (packages/types)
    → domain service (checkout, catalog, download, processing)
      → packages/database
      → packages/storage | packages/payments | packages/image-processing
```

Client components may call server actions. They must not contain pricing, entitlement, or payment rules.

---

# 6. Authentication Flow

Provider: Auth.js with Prisma adapter. One `User` table. Roles: `CUSTOMER`, `ADMIN`.

## 6.1 Customer

1. Register or log in on the storefront with email and password (Auth.js Credentials provider).
2. Auth.js creates `User`, `Account`, and `Session`.
3. `role = CUSTOMER`, `status = ACTIVE`.
4. Email verification is not required in MVP.
5. Session required for cart mutations, checkout, purchases, downloads.

OAuth (Google and others) is future scope.

## 6.2 Admin

1. No public admin registration.
2. First admin is created by a secure bootstrap/seed process using server-only env (`ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD` or a one-time hashed password).
3. Additional admins are provisioned by an existing admin or the same secure bootstrap, never a public “Register as Admin” page.
4. Admin app and every admin server action call `requireAdmin()`.
5. Frontend layout hiding is not authorization.

## 6.3 First-admin bootstrap

- Run once against an empty database after migrations.
- Create `User` with `role = ADMIN`.
- Refuse to run if an admin already exists, unless an explicit force flag is used in a controlled environment.
- Never expose bootstrap credentials to the client.

Do not use Supabase Auth. Do not create a second user store.

---

# 7. Admin Flow

```text
Login → requireAdmin → Dashboard
  → Upload master (presigned PUT to private R2)
  → Asset DRAFT + UPLOADED
  → ImageProcessingJob queued (Inngest)
  → Worker: Sharp → derivatives → READY or FAILED
  → Admin edits metadata, tags, AssetLicense prices
  → Publish only if READY → PUBLISHED
  → Unpublish → DRAFT
  → Archive → ARCHIVED
```

All of upload, publish, unpublish, archive, price edit, retry, and user/order views are audited.

---

# 8. Upload Flow

1. Admin selects a master file.
2. Server validates type/size before issuing a presigned PUT (or validates immediately after upload).
3. Client uploads directly to the private R2 master key. Original filename is discarded.
4. Server creates `Asset` (`processingStatus = UPLOADED`, `productStatus = DRAFT`) and `AssetFile` MASTER.
5. Server creates `ImageProcessingJob` (`QUEUED`) and emits a job event.
6. HTTP request returns. Processing is not done in that request.

Large files use multipart/resumable upload where required. UI shows upload progress, then processing status.

---

# 9. Image Processing Flow

```text
Upload HTTP
  → store master
  → enqueue job
  → return

Inngest worker
  → set PROCESSING
  → Sharp metadata
  → thumbnail → public/thumbnails/{assetId}/thumbnail.webp
  → working preview → private/previews/{assetId}/preview.webp
  → watermark → public/previews/{assetId}/preview.webp
  → write AssetFile rows
  → copy width/height/orientation/format/size onto Asset
  → READY + job SUCCEEDED
```

On failure: keep master, `processingStatus = FAILED`, store a safe error code/message, allow retry. Never delete the master because a derivative failed.

Never process 8K/16K TIFF masters inside a short-lived serverless upload request. The worker/job architecture is required in MVP. Inngest is the MVP runner. `packages/image-processing` stays independent of Inngest so the runner can be replaced later.

---

# 10. Catalog Publishing Flow

Publish is allowed only when:

- `processingStatus = READY`
- Title present
- Category assigned
- At least one tag
- Master file present
- Watermarked preview present
- At least one active `AssetLicense` with `pricePaise >= 0`

Publish sets `productStatus = PUBLISHED` and `publishedAt`.

Unpublish sets `productStatus = DRAFT` and clears `publishedAt`. Archive sets `ARCHIVED`. Storefront visibility follows `productStatus`; DRAFT and ARCHIVED are excluded.

Storefront queries: `productStatus = PUBLISHED` AND `processingStatus = READY`.

Purchased `OrderItem` rows continue to entitle download regardless of later product status.

---

# 11. Cart Flow

`CartItem` is (`userId`, `assetId`, `licenseId`) with a unique constraint on that triple.

`quotedPricePaise` is a display snapshot only.

```text
Add to cart (authenticated)
  → validate asset is PUBLISHED + READY
  → validate AssetLicense is active
  → upsert CartItem
  → store quotedPricePaise from current AssetLicense (display)

Checkout
  → load cart items
  → re-read AssetLicense prices from DB
  → reject or require confirmation if the live price differs
  → server calculates subtotal, tax, total
  → never trust browser amounts
```

Remove deletes the `CartItem`. Update may change `licenseId` (still unique per user/asset/license).

---

# 12. Checkout Flow (Cart and Buy Now)

Cart checkout and Buy Now use the same checkout service.

Buy Now passes a single `(assetId, licenseId)` list. It does not require persisting that line on `Cart`.

```text
CheckoutService.create({ userId, items: [{ assetId, licenseId }] })
  → requireUser CUSTOMER
  → for each item: load Asset + AssetLicense
  → validate availability (PUBLISHED + READY, license active)
  → compute unitPricePaise from DB
  → apply active TaxRate (snapshot rateBps)
  → create Order PENDING_PAYMENT with immutable OrderItem snapshots
  → create Payment CREATED
  → create Razorpay order for totalPaise INR
  → store provider order id
  → return Razorpay checkout payload (order id + public key id)
```

---

# 13. Razorpay Verification Flow

```text
Customer pays in Razorpay Checkout
  → client reports payment ids to the server (untrusted)
  → server verifies HMAC signature with RAZORPAY_KEY_SECRET
  → server fetches/validates amount, currency, order id
  → webhook also arrives (source of reconciliation)
  → unique providerPaymentId prevents duplicate capture
  → on success: Payment CAPTURED, Order PAID, paidAt set
  → customer may download
```

Never mark an order paid from client-reported success alone.

Webhook handler is idempotent: if `providerPaymentId` already captured, return success without mutating again.

Payment states: `CREATED`, `PENDING`, `AUTHORIZED`, `CAPTURED`, `FAILED`, `REFUNDED`.

Provider enum is `RAZORPAY` in MVP. Stripe is future; keep `Payment.provider` extensible.

---

# 14. Secure Download Flow

```text
Customer clicks Download
  → requireUser
  → load OrderItem by id (not by client storage key)
  → Order.userId === session.userId
  → Order.status === PAID
  → Payment.status === CAPTURED
  → license on the OrderItem entitles download
  → master AssetFile exists
  → signed GET URL, TTL 300 seconds
  → insert Download row
  → return { url, expiresInSeconds: 300 }
```

Never return R2 credentials, permanent master URLs, or storage keys.

Download rows support future quotas. MVP does not enforce a numeric cap.

Unpublished or archived assets remain downloadable for entitled purchases.

---

# 15. Storage Architecture

Cloudflare R2. PostgreSQL stores keys, never bytes.

Two buckets:

- Private bucket: MASTER, WORKING_PREVIEW
- Public bucket: THUMBNAIL, WATERMARKED_PREVIEW (Cloudflare CDN)

Logical keys:

```text
private/masters/{assetId}/original.{ext}
private/previews/{assetId}/preview.webp
public/thumbnails/{assetId}/thumbnail.webp
public/previews/{assetId}/preview.webp
```

Public CDN must not be bound to the private bucket.

---

# 16. Database Architecture

PostgreSQL + Prisma. See `/docs/DATABASE.md` for the field-level schema.

Money: integer paise. Currency: `INR`.

Orders and payments are append-only after completion. Catalog prices may change without rewriting history.

Search: PostgreSQL full-text search over title, description, tags, category, plus exact/trgm match on asset code. Catalog repository hides the engine so it can be replaced later.

---

# 17. Deployment Topology

```text
Vercel                    apps/storefront
Vercel                    apps/admin
Neon (managed PostgreSQL)   packages/database
Cloudflare R2             masters + derivatives
Cloudflare CDN            public thumbnails + watermarked previews only
Inngest                   image processing jobs
Razorpay                  payments
```

Both apps are separate Vercel projects from the same monorepo.

---

# 18. Environment Variable Categories

Do not commit secret values.

| Category | Server-only examples | Public examples |
|---|---|---|
| Database | `DATABASE_URL` (Neon) | — |
| Auth | `AUTH_SECRET`, `AUTH_URL`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD` | — |
| R2 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PRIVATE_BUCKET`, `R2_PUBLIC_BUCKET`, `R2_ENDPOINT` | `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` (CDN origin for thumbnails/previews only) |
| Payments | `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | `NEXT_PUBLIC_RAZORPAY_KEY_ID` |
| App URLs | `STOREFRONT_URL`, `ADMIN_URL` | `NEXT_PUBLIC_STOREFRONT_URL` if required |
| Jobs | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | — |

Image size limits live in `packages/image-processing` configuration, not in public env.

---

# 19. Security Boundaries

| Boundary | Rule |
|---|---|
| Browser | Untrusted. No secrets, no master keys, no prices used for charging. |
| Storefront server | May read public catalog and create customer orders. May mint master URLs only via download service after entitlement. |
| Admin server | ADMIN role required. May request private working-preview URLs for review. |
| Worker | Trusted. Reads master, writes derivatives. No public HTTP. |
| Public CDN | Thumbnails and watermarked previews only. |
| Private R2 | Masters and working previews. Signed access only. |
| Razorpay webhook | Verified signature. Idempotent. |

Rate limiting is required on authentication, upload, payment, and download endpoints.

---

# 20. Site Content

No CMS. Storefront homepage uses static/application configuration (hero copy, category highlights, newest assets query).

---

# 21. Out of MVP

Contributor marketplace, coupons, wishlist, reviews, subscriptions, credits, AI tagging, visual search, mobile apps, public API, Stripe, Elasticsearch, advanced CMS.
