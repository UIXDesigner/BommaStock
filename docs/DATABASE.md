# Bommastock — Database Specification

Version: Phase 0 (locked)
Status: Implementation-ready (documentation only; Prisma schema is not created in this phase)
Database: PostgreSQL
ORM: Prisma
Primary currency: INR
Money: integer minor units (`paise`)
Primary market: India

This document is the field-level source of truth for the MVP schema. Do not add Wishlist, Collection, Coupon, Contributor, or CMS tables in MVP.

---

# 1. Purpose

PostgreSQL stores users, catalog metadata, object keys, carts, orders, payments, licenses, processing jobs, downloads, tax configuration, and audit events.

Cloudflare R2 stores image bytes. PostgreSQL must never store image binaries.

The schema supports a single-business admin marketplace now and must not prevent a future contributor marketplace.

---

# 2. Technology

- PostgreSQL
- Prisma
- All schema changes through Prisma migrations
- Type-safe access only
- Do not modify production databases manually unless absolutely necessary

Identity: `String` primary keys with `@default(cuid())` unless noted.

Timestamps: `DateTime` `@default(now())` / `@updatedAt`. Store UTC.

---

# 3. Design Principles

1. Normalize transactional data.
2. Never store image binaries in PostgreSQL.
3. Store object keys and metadata only.
4. Preserve historical order and payment information.
5. Never overwrite `OrderItem` snapshots.
6. Foreign keys for relational integrity.
7. Unique constraints where specified.
8. Indexes for storefront filters, admin lists, and payment lookups.
9. Soft-disable or archive business-critical records. Do not hard-delete orders, payments, downloads, or entitled assets.
10. Payments are immutable after a terminal success/failure is recorded, except an explicit refund state transition.
11. Completed purchases are immutable.
12. Do not implement contributor tables in MVP.
13. Do not implement wishlist, coupon, collection, or review tables in MVP.

---

# 4. Money and Currency

| Rule | Detail |
|---|---|
| Amounts | `Int` paise. 1 INR = 100 paise. |
| Currency | `String` `@db.Char(3)`, MVP always `INR`. |
| Forbidden | `Float`, `Decimal` for money charged to customers. |
| Display | Convert paise to rupees in the presentation layer only. |
| Tax | `rateBps` is integer basis points. 1800 = 18.00%. Not hard-coded in app code. |

Every money field is named with a `Paise` suffix.

---

# 5. Enums

```text
UserRole                 CUSTOMER | ADMIN
UserStatus               ACTIVE | DISABLED
ProcessingStatus         UPLOADED | PROCESSING | READY | FAILED
ProductStatus            DRAFT | PUBLISHED | ARCHIVED
AssetOrientation         LANDSCAPE | PORTRAIT | SQUARE
AssetFileClass           MASTER | THUMBNAIL | WATERMARKED_PREVIEW | WORKING_PREVIEW
CategoryStatus           ACTIVE | INACTIVE
LicenseStatus            ACTIVE | INACTIVE
OrderStatus              PENDING_PAYMENT | PAID | FAILED | CANCELLED | REFUNDED
PaymentProvider          RAZORPAY
PaymentStatus            CREATED | PENDING | AUTHORIZED | CAPTURED | FAILED | REFUNDED
ImageProcessingJobStatus QUEUED | RUNNING | SUCCEEDED | FAILED
TaxRateStatus            ACTIVE | INACTIVE
```

`PaymentProvider` is an enum so Stripe can be added later as a value without a parallel payments table.

---

# 6. MVP Entity List

Auth.js adapter:

- User
- Account
- Session
- VerificationToken

Catalog and files:

- Category
- Tag
- Asset
- AssetTag
- AssetFile
- License
- AssetLicense

Commerce:

- TaxRate
- Cart
- CartItem
- Order
- OrderItem
- Payment
- Download

Operations:

- ImageProcessingJob
- AuditLog

Not in MVP schema: Wishlist, WishlistItem, Collection, CollectionItem, Coupon, CouponRedemption, AssetView, ContributorProfile, ContributorAsset, ContributorEarning, ContributorPayout.

---

# 7. Entity Relationship Overview

```text
USER
 ├── ACCOUNT
 ├── SESSION
 ├── CART
 │     └── CART_ITEM ── ASSET
 │                   └── LICENSE
 ├── ORDER
 │     ├── ORDER_ITEM ── ASSET
 │     │              └── LICENSE
 │     └── PAYMENT
 ├── DOWNLOAD ── ORDER_ITEM
 └── AUDIT_LOG

ASSET
 ├── CATEGORY (tree via parentId)
 ├── ASSET_TAG ── TAG
 ├── ASSET_FILE
 ├── ASSET_LICENSE ── LICENSE
 └── IMAGE_PROCESSING_JOB

TAX_RATE (referenced by snapshot fields on Order, not a live FK after checkout)
```

---

# 8. User

Purpose: single identity for customers and admins.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| name | String | yes | — | Display name |
| email | String | no | — | Unique, lowercase |
| emailVerified | DateTime | yes | — | Auth.js |
| image | String | yes | — | Avatar URL, not an asset master |
| passwordHash | String | yes | — | Credentials provider; never log |
| role | UserRole | no | CUSTOMER | CUSTOMER or ADMIN |
| status | UserStatus | no | ACTIVE | DISABLED cannot authenticate |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- Unique: `email`

Indexes:

- `role`
- `status`
- `createdAt`

Relationships:

- Account[] (onDelete Cascade)
- Session[] (onDelete Cascade)
- Cart? (onDelete Cascade)
- Order[] (onDelete Restrict)
- Download[] (onDelete Restrict)
- AuditLog[] as actor (onDelete SetNull)

Deletion: do not hard-delete users who have orders. Set `status = DISABLED`. Auth.js cascade applies only if a user with no orders is removed in development.

---

# 9. Account

Purpose: Auth.js OAuth/credentials account link. Do not use as a second user database.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| userId | String | no | — | FK User.id |
| type | String | no | — | Auth.js |
| provider | String | no | — | |
| providerAccountId | String | no | — | |
| refresh_token | String | yes | — | @db.Text |
| access_token | String | yes | — | @db.Text |
| expires_at | Int | yes | — | |
| token_type | String | yes | — | |
| scope | String | yes | — | |
| id_token | String | yes | — | @db.Text |
| session_state | String | yes | — | |

Constraints:

- PK: `id`
- Unique: `(provider, providerAccountId)`
- FK: `userId` → User.id onDelete Cascade

---

# 10. Session

Purpose: Auth.js database sessions.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| sessionToken | String | no | — | Unique |
| userId | String | no | — | FK User.id |
| expires | DateTime | no | — | |

Constraints:

- PK: `id`
- Unique: `sessionToken`
- FK: `userId` → User.id onDelete Cascade

Index: `userId`

---

# 11. VerificationToken

Purpose: Auth.js email verification / magic-link tokens. Composite unique, no standalone id required by Auth.js.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| identifier | String | no | — | Email or user identifier |
| token | String | no | — | Unique |
| expires | DateTime | no | — | |

Constraints:

- Unique: `token`
- Unique: `(identifier, token)`

Deletion: expired rows may be purged by Auth.js / a maintenance job. Do not log token values.

---

# 12. Category

Purpose: category tree. Root categories have `parentId = null`. Child categories (subcategories) have `parentId` set. There is no separate Subcategory entity.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| name | String | no | — | |
| slug | String | no | — | Unique, URL-safe |
| parentId | String | yes | — | FK Category.id |
| description | String | yes | — | |
| status | CategoryStatus | no | ACTIVE | Inactive hidden from storefront |
| sortOrder | Int | no | 0 | |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- Unique: `slug`
- FK: `parentId` → Category.id onDelete Restrict

Indexes:

- `parentId`
- `status`
- `(parentId, sortOrder)`

Relationships:

- parent Category?
- children Category[]
- assets Asset[]

Deletion: do not delete a category that has children or assets. Set `status = INACTIVE` or reassign assets first.

MVP depth: one root level and one child level is sufficient. The model allows deeper trees later.

---

# 13. Tag

Purpose: free-form labels for search and publish requirements.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| name | String | no | — | |
| slug | String | no | — | Unique |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- Unique: `slug`
- Unique: `name` (case-normalized in application)

Deletion: Restrict if `AssetTag` rows exist.

---

# 14. Asset

Purpose: marketplace product. Catalog fields plus denormalized master metadata for filtering.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| code | String | no | — | Unique public image code, server-generated |
| title | String | no | — | Required before publish; may be placeholder at upload |
| slug | String | no | — | Unique |
| description | String | yes | — | @db.Text |
| categoryId | String | yes | — | FK Category; required before publish |
| processingStatus | ProcessingStatus | no | UPLOADED | Independent of productStatus |
| productStatus | ProductStatus | no | DRAFT | |
| width | Int | yes | — | Master pixels; set after processing |
| height | Int | yes | — | |
| orientation | AssetOrientation | yes | — | Derived from width/height |
| format | String | yes | — | Master format, e.g. tiff |
| mimeType | String | yes | — | Master MIME |
| fileSizeBytes | BigInt | yes | — | Master size |
| publishedAt | DateTime | yes | — | Set on publish; cleared on unpublish |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- Unique: `code`
- Unique: `slug`
- FK: `categoryId` → Category.id onDelete Restrict

Indexes:

- `productStatus`
- `processingStatus`
- `(productStatus, processingStatus)`
- `categoryId`
- `createdAt`
- `publishedAt`
- `orientation`
- `code`

Search: PostgreSQL full-text index on title + description, plus tag names and category name via joins. Trigram/btree on `code` for exact/prefix lookup. Keep this behind the catalog repository.

Relationships:

- Category?
- AssetFile[]
- AssetTag[]
- AssetLicense[]
- CartItem[]
- OrderItem[]
- Download[]
- ImageProcessingJob[]

Deletion: never hard-delete an asset that appears on an `OrderItem`. Archive (`productStatus = ARCHIVED`). Storefront hides ARCHIVED and DRAFT.

Publish rule (enforced in service, not only DB): `processingStatus = READY`, category set, title set, ≥1 tag, ≥1 active AssetLicense, MASTER and WATERMARKED_PREVIEW files present.

---

# 15. AssetTag

Purpose: many-to-many Asset–Tag.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| assetId | String | no | — | FK Asset.id |
| tagId | String | no | — | FK Tag.id |
| createdAt | DateTime | no | now() | |

Constraints:

- PK: `(assetId, tagId)`
- FK: `assetId` → Asset.id onDelete Cascade
- FK: `tagId` → Tag.id onDelete Restrict

Index: `tagId`

---

# 16. AssetFile

Purpose: one row per stored object. Bytes live in R2; this row stores the key and metadata.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| assetId | String | no | — | FK Asset.id |
| fileClass | AssetFileClass | no | — | MASTER, THUMBNAIL, WATERMARKED_PREVIEW, WORKING_PREVIEW |
| storageKey | String | no | — | Logical key, e.g. private/masters/{id}/original.tiff |
| bucket | String | no | — | Private or public bucket name |
| mimeType | String | no | — | |
| extension | String | no | — | Without dot |
| width | Int | yes | — | |
| height | Int | yes | — | |
| sizeBytes | BigInt | no | — | |
| isPublic | Boolean | no | false | true only for THUMBNAIL and WATERMARKED_PREVIEW |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- Unique: `(assetId, fileClass)`
- Unique: `storageKey`
- FK: `assetId` → Asset.id onDelete Restrict

Index: `fileClass`

`isPublic` must be true only for THUMBNAIL and WATERMARKED_PREVIEW. MASTER and WORKING_PREVIEW are never public.

Key layout:

```text
MASTER                 private/masters/{assetId}/original.{ext}
THUMBNAIL              public/thumbnails/{assetId}/thumbnail.webp
WATERMARKED_PREVIEW    public/previews/{assetId}/preview.webp
WORKING_PREVIEW        private/previews/{assetId}/preview.webp
```

Never return MASTER or WORKING_PREVIEW keys to the browser. Storefront uses public CDN URLs built from public keys only.

---

# 17. License

Purpose: license catalog. MVP seeds `STANDARD`. Additional licenses are rows, not code changes.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| code | String | no | — | Unique, e.g. STANDARD |
| name | String | no | — | Display name |
| description | String | yes | — | @db.Text, customer-facing summary |
| terms | String | yes | — | @db.Text, legal terms |
| status | LicenseStatus | no | ACTIVE | |
| sortOrder | Int | no | 0 | |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- Unique: `code`

Deletion: Restrict. Deactivate instead (`status = INACTIVE`). Historical `OrderItem.licenseName` remains accurate.

---

# 18. AssetLicense

Purpose: price of one license for one asset. Source of current catalog price. Not used to reconstruct historical orders.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| assetId | String | no | — | FK Asset.id |
| licenseId | String | no | — | FK License.id |
| pricePaise | Int | no | — | ≥ 0 |
| currency | String | no | INR | Char(3) |
| isActive | Boolean | no | true | Inactive licenses hidden at checkout |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- Unique: `(assetId, licenseId)`
- FK: `assetId` → Asset.id onDelete Cascade
- FK: `licenseId` → License.id onDelete Restrict
- Check: `pricePaise >= 0` (enforce in service and, if available, DB check)

Indexes:

- `licenseId`
- `(assetId, isActive)`

Changing `pricePaise` must not update any `OrderItem`.

---

# 19. TaxRate

Purpose: configurable GST representation. Not a full tax engine.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| name | String | no | GST | Label |
| rateBps | Int | no | — | Basis points; 1800 = 18% |
| status | TaxRateStatus | no | ACTIVE | |
| currency | String | no | INR | |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- Check: `rateBps >= 0`

MVP uses the single ACTIVE row at checkout. Snapshot `taxRateBps` onto the Order. Do not keep a live FK from Order to TaxRate after payment — history must survive rate changes.

Production `rateBps` must be confirmed with tax/accounting before launch. Do not hard-code the percentage in application source.

---

# 20. Cart

Purpose: one cart per customer.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| userId | String | no | — | FK User.id, unique |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- Unique: `userId`
- FK: `userId` → User.id onDelete Cascade

Deletion: cascade CartItem when the cart is cleared or the user (without orders) is removed in development.

---

# 21. CartItem

Purpose: user + asset + license line. Quoted price is display-only.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| cartId | String | no | — | FK Cart.id |
| userId | String | no | — | FK User.id (denormalized for the uniqueness rule) |
| assetId | String | no | — | FK Asset.id |
| licenseId | String | no | — | FK License.id |
| quotedPricePaise | Int | no | — | Display snapshot; untrusted for charging |
| currency | String | no | INR | |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- Unique: `(userId, assetId, licenseId)` — same user cannot add the same asset/license twice
- Unique: `(cartId, assetId, licenseId)`
- FK: `cartId` → Cart.id onDelete Cascade
- FK: `userId` → User.id onDelete Cascade
- FK: `assetId` → Asset.id onDelete Cascade
- FK: `licenseId` → License.id onDelete Restrict

Indexes:

- `cartId`
- `assetId`

Checkout re-reads `AssetLicense.pricePaise`. If it differs from `quotedPricePaise`, the service rejects or requires the customer to continue with the live price. Browser-submitted prices are ignored.

Buy Now does not require a CartItem. CheckoutService accepts an in-memory item list.

Deletion: hard-delete on remove-from-cart.

---

# 22. Order

Purpose: immutable purchase header after payment success. Created as `PENDING_PAYMENT`.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| orderNumber | String | no | — | Unique public number. Format: `BS-YYYYMMDD-XXXXXX` (UTC date + zero-padded daily sequence), server-generated |
| userId | String | no | — | FK User.id |
| status | OrderStatus | no | PENDING_PAYMENT | |
| subtotalPaise | Int | no | — | Sum of item totals before tax |
| taxRateBps | Int | no | — | Snapshot of TaxRate.rateBps |
| taxPaise | Int | no | — | |
| totalPaise | Int | no | — | Amount sent to Razorpay |
| currency | String | no | INR | |
| paidAt | DateTime | yes | — | Set when PAID |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- Unique: `orderNumber`
- FK: `userId` → User.id onDelete Restrict

Indexes:

- `userId`
- `status`
- `createdAt`
- `orderNumber`

Deletion: never delete. Failed checkouts remain `FAILED` or `CANCELLED`.

After `PAID`, do not change money fields or line snapshots. Status may later move to `REFUNDED` with a corresponding Payment transition.

---

# 23. OrderItem

Purpose: immutable sold line. Reconstructs the purchase without reading current catalog prices or titles.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| orderId | String | no | — | FK Order.id |
| assetId | String | no | — | FK Asset.id for download lookup |
| licenseId | String | no | — | FK License.id |
| assetTitle | String | no | — | Snapshot |
| licenseName | String | no | — | Snapshot |
| unitPricePaise | Int | no | — | Snapshot |
| quantity | Int | no | 1 | MVP always 1 |
| taxPaise | Int | no | — | Snapshot portion of order tax |
| currency | String | no | INR | |
| totalPaise | Int | no | — | Line total including allocated tax |
| createdAt | DateTime | no | now() | |

Constraints:

- PK: `id`
- FK: `orderId` → Order.id onDelete Restrict
- FK: `assetId` → Asset.id onDelete Restrict
- FK: `licenseId` → License.id onDelete Restrict
- Unique: `(orderId, assetId, licenseId)`

Index: `assetId`

Immutability: never UPDATE money, title, or license snapshot columns. Catalog changes must not cascade here.

`assetId` / `licenseId` remain so downloads can find the master file. Display of historical orders uses snapshot columns only.

---

# 24. Payment

Purpose: provider transaction record. Extensible via `provider`.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| orderId | String | no | — | FK Order.id |
| provider | PaymentProvider | no | RAZORPAY | |
| providerOrderId | String | yes | — | Razorpay order id |
| providerPaymentId | String | yes | — | Razorpay payment id; unique when set |
| status | PaymentStatus | no | CREATED | |
| amountPaise | Int | no | — | Must match Order.totalPaise |
| currency | String | no | INR | |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- FK: `orderId` → Order.id onDelete Restrict
- Unique: `providerPaymentId` (nullable unique)
- Unique: `(provider, providerOrderId)` when providerOrderId is set

Indexes:

- `orderId`
- `status`
- `providerOrderId`

Deletion: never delete.

Idempotency: webhook upserts by `providerPaymentId`. A second CAPTURED event for the same id is a no-op.

Do not store card PAN, CVV, or raw webhook secrets. Optional provider payload, if stored, must be redacted and server-only.

---

# 25. Download

Purpose: audit of master URL issuance. Supports future quotas; MVP has no numeric cap.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| userId | String | no | — | FK User.id |
| orderItemId | String | no | — | FK OrderItem.id |
| assetId | String | no | — | FK Asset.id |
| licenseId | String | no | — | FK License.id |
| createdAt | DateTime | no | now() | |

Constraints:

- PK: `id`
- FK: `userId` → User.id onDelete Restrict
- FK: `orderItemId` → OrderItem.id onDelete Restrict
- FK: `assetId` → Asset.id onDelete Restrict
- FK: `licenseId` → License.id onDelete Restrict

Indexes:

- `(userId, createdAt)`
- `orderItemId`
- `assetId`

Deletion: never delete.

Do not store the signed URL. Do not store storage keys. IP and user-agent are omitted in MVP to reduce PII; they may be added later under a retention policy.

---

# 26. ImageProcessingJob

Purpose: async processing record and retry history.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| assetId | String | no | — | FK Asset.id |
| status | ImageProcessingJobStatus | no | QUEUED | |
| attempt | Int | no | 1 | Increment on retry |
| errorCode | String | yes | — | Safe machine code |
| errorMessage | String | yes | — | Safe, no secrets, no keys |
| startedAt | DateTime | yes | — | |
| completedAt | DateTime | yes | — | |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Constraints:

- PK: `id`
- FK: `assetId` → Asset.id onDelete Restrict

Indexes:

- `(assetId, createdAt)`
- `status`

Deletion: retain. Retry creates a new job row (or increments attempt on a new row). Keep the master regardless of FAILED.

---

# 27. AuditLog

Purpose: security and admin action trail.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| actorUserId | String | yes | — | FK User.id; null for system/worker |
| action | String | no | — | e.g. ASSET_PUBLISH, PAYMENT_CAPTURED |
| entityType | String | no | — | e.g. Asset, Order |
| entityId | String | yes | — | |
| metadata | Json | yes | — | Redacted; no secrets, passwords, signed URLs |
| createdAt | DateTime | no | now() | |

Constraints:

- PK: `id`
- FK: `actorUserId` → User.id onDelete SetNull

Indexes:

- `(entityType, entityId)`
- `actorUserId`
- `createdAt`
- `action`

Deletion: never delete in MVP. Retention policy is a future operations decision.

PII: store user ids, not passwords. Do not put emails in metadata unless required; prefer user id. Do not log IP in MVP unless a later policy requires it with retention.

---

# 28. Index Summary (storefront and payments)

Required beyond per-table uniques:

- Asset `(productStatus, processingStatus, publishedAt DESC)` for gallery
- Asset `categoryId` for category pages
- Asset full-text / GIN on search document (title, description)
- Tag.slug, Category.slug
- Payment `providerPaymentId` unique
- Order `orderNumber` unique
- CartItem `(userId, assetId, licenseId)` unique

---

# 29. Deletion Behavior Summary

| Entity | Policy |
|---|---|
| User | Disable (`DISABLED`). Restrict if orders exist. |
| Account / Session | Cascade with User (Auth.js). |
| Category / Tag / License | Restrict if in use; deactivate. |
| Asset | Archive. Restrict hard delete if OrderItem exists. |
| AssetFile | Restrict. Never delete MASTER because derivatives failed. |
| Cart / CartItem | Hard-delete items; cascade with cart. |
| Order / OrderItem / Payment / Download / AuditLog | Never delete. |
| ImageProcessingJob | Retain history. |
| TaxRate | Deactivate; insert a new active row to change rate. |

---

# 30. Immutability Rules

When `Order.status` becomes `PAID`:

- Do not update Order money fields except a later `REFUNDED` status change.
- Do not update OrderItem snapshot columns.
- Do not rewrite Payment amount. Status may move CREATED → PENDING → AUTHORIZED → CAPTURED, or to FAILED / REFUNDED.

Catalog `Asset.title` and `AssetLicense.pricePaise` may change freely afterward.

---

# 31. Search Implementation Notes

MVP: PostgreSQL.

- `to_tsvector` on title and description
- Join tags and category name into the search document or query
- Exact match on `Asset.code`
- Catalog repository method `searchAssets(query, filters)` hides SQL so a search engine can replace it later

Do not add Elasticsearch, OpenSearch, or Algolia in MVP.

---

# 32. Future Schema (do not create now)

- Wishlist, WishlistItem
- Collection, CollectionItem
- Coupon, CouponRedemption
- AssetView
- ContributorProfile, ContributorAsset, ContributorEarning, ContributorPayout
- `Asset.contributorId` may be added later as a nullable FK

Avoid unique constraints or hardcoded “platform owns every asset” checks that would make `contributorId` impossible later.
