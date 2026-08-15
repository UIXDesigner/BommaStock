# Bommastock — Database Specification

Version: Phase 0.2 (locked)
Status: Implementation-ready (documentation only; Prisma schema is not created in this phase)
Database: PostgreSQL
ORM: Prisma
Primary currency: INR
Money: integer minor units (`paise`)
Primary market: India

This document is the field-level source of truth for the MVP schema. Do not add Wishlist, Collection, Coupon, Contributor, or CMS tables in MVP.

---

# 1. Purpose

PostgreSQL stores users, catalog metadata, object keys, carts (guest and authenticated), orders, payments, licenses, processing jobs, downloads, tax configuration, daily sequences, and audit events.

Cloudflare R2 stores image bytes. PostgreSQL must never store image binaries.

---

# 2. Technology

- PostgreSQL (Neon)
- Prisma
- All schema changes through Prisma migrations
- Type-safe access only
- Identity: `String` `@default(cuid())` unless noted
- Timestamps: UTC `DateTime`

---

# 3. Design Principles

1. Normalize transactional data.
2. Never store image binaries in PostgreSQL.
3. Store `storageKey` values, never bytes. Never persist `signedUrl`.
4. Preserve historical order and payment information.
5. Never overwrite `OrderItem` snapshots.
6. Foreign keys for relational integrity.
7. Unique constraints where specified.
8. Soft-disable or archive business-critical records.
9. Payments are immutable after a terminal state except an explicit refund transition.
10. Completed purchases are immutable.
11. Guest cart is first-class; merge on login.
12. Do not implement contributor, wishlist, coupon, collection, or review tables in MVP.

---

# 4. Money, Currency, and GST

| Rule | Detail |
|---|---|
| Amounts | `Int` paise. 1 INR = 100 paise. |
| Currency | `String` `@db.Char(3)`, MVP always `INR`. |
| Catalog price | `AssetLicense.pricePaise` is **GST-inclusive**. |
| Forbidden | `Float` / `Decimal` for money charged to customers. |

## 4.1 Rounding

All tax math uses integer paise and **round half up** (0.5 rounds away from zero / up for positive amounts).

Let `I` = GST-inclusive unit price in paise.  
Let `R` = `taxRateBps` (1800 = 18.00%).

```text
taxPaise      = round_half_up(I * R / (10000 + R))
beforeTaxPaise = I - taxPaise
```

`round_half_up(x)` = nearest integer; halfway cases round up.

Do not use floating INR. Compute in integer/rational form (e.g. `(I * R + divisor/2) / divisor` with integer division).

## 4.2 Order totals

- Line `lineTotalPaise` = `quantity * unitPriceIncludingTaxPaise` (MVP `quantity` is always 1).
- Order `totalPaise` = sum of line totals (GST-inclusive; this is the Razorpay amount).
- Order `taxPaise` = sum of line `taxPaise`.
- Order `subtotalBeforeTaxPaise` = sum of line `unitPriceBeforeTaxPaise * quantity`.

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
OrderStatus              PENDING | PAID | FAILED | CANCELLED | REFUNDED
PaymentProvider          RAZORPAY
PaymentStatus            PENDING | AUTHORIZED | CAPTURED | FAILED | CANCELLED | REFUNDED
ImageProcessingJobStatus QUEUED | RUNNING | SUCCEEDED | FAILED
TaxRateStatus            ACTIVE | INACTIVE
DailySequenceKind        ASSET_CODE | ORDER_NUMBER
```

Do **not** use `PENDING_PAYMENT` or `CREATED` as database enums.

## 5.1 Status layers

| Layer | What it means |
|---|---|
| Order status | Bommastock commercial state of the order. |
| Payment status | Bommastock internal payment state. |
| Provider status | Raw Razorpay value stored for diagnostics, then **mapped** into `PaymentStatus`. |

Order vs payment:

| OrderStatus | Typical PaymentStatus | Meaning |
|---|---|---|
| PENDING | PENDING or AUTHORIZED | Unpaid; no download entitlement |
| PAID | CAPTURED | Paid; downloads allowed |
| FAILED | FAILED | Payment attempt failed; customer must checkout again |
| CANCELLED | CANCELLED | Unpaid order expired or explicitly cancelled |
| REFUNDED | REFUNDED | Refund completed; download entitlement revoked |

Razorpay mapping (MVP):

| Razorpay payment status | Internal PaymentStatus |
|---|---|
| `created` | PENDING |
| `attempted` | PENDING |
| `authorized` | AUTHORIZED |
| `captured` | CAPTURED |
| `failed` | FAILED |
| `refunded` | REFUNDED |
| cancelled / expired (order) | CANCELLED |

Webhook is authoritative reconciliation for CAPTURED / FAILED / REFUNDED / CANCELLED.

---

# 6. MVP Entity List

User, Account, Session, VerificationToken, Category, Tag, Asset, AssetTag, AssetFile, License, AssetLicense, TaxRate, DailySequence, Cart, CartItem, Order, OrderItem, Payment, Download, ImageProcessingJob, AuditLog.

---

# 7. Entity Relationship Overview

```text
USER
 ├── ACCOUNT, SESSION
 ├── CART (also GUEST carts with guestToken)
 │     └── CART_ITEM ── ASSET
 │                   └── ASSET_LICENSE
 ├── ORDER
 │     ├── ORDER_ITEM ── ASSET, LICENSE, ASSET_LICENSE
 │     └── PAYMENT
 ├── DOWNLOAD ── ORDER_ITEM
 └── AUDIT_LOG

ASSET
 ├── CATEGORY (tree)
 ├── ASSET_TAG ── TAG
 ├── ASSET_FILE
 ├── ASSET_LICENSE ── LICENSE
 └── IMAGE_PROCESSING_JOB

DAILY_SEQUENCE (ASSET_CODE | ORDER_NUMBER)
TAX_RATE (exactly one ACTIVE)
```

---

# 8. User

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| name | String | yes | — | |
| email | String | no | — | Unique, lowercase |
| emailVerified | DateTime | yes | — | Unused for MVP gate |
| image | String | yes | — | Avatar, not a master |
| passwordHash | String | yes | — | Argon2id; never log |
| role | UserRole | no | CUSTOMER | |
| status | UserStatus | no | ACTIVE | DISABLED cannot authenticate |
| createdAt | DateTime | no | now() | |
| updatedAt | DateTime | no | updatedAt | |

Unique: `email`. FK children: Account, Session cascade; Cart set-null/merge; Order restrict.

Deletion: `DISABLED` if orders exist.

---

# 9. Account

Auth.js adapter account. Same fields as Auth.js Prisma schema. Unique `(provider, providerAccountId)`. FK `userId` cascade.

---

# 10. Session

Auth.js database sessions. Unique `sessionToken`. FK `userId` cascade.

Session strategy: **database** (Prisma adapter). Not JWT-only.

---

# 11. VerificationToken

Auth.js token table. Unique `token` and `(identifier, token)`. Email verification is not required for MVP checkout.

---

# 12. Category

Tree. `parentId = null` is a root. Child rows are subcategories. No Subcategory table.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| name | String | no | — | |
| slug | String | no | — | Unique |
| parentId | String | yes | — | FK Category.id Restrict |
| description | String | yes | — | |
| status | CategoryStatus | no | ACTIVE | |
| sortOrder | Int | no | 0 | |
| createdAt / updatedAt | DateTime | no | | |

MVP browse: selecting a parent includes **all descendant** categories’ published assets.

Storefront discovery **excludes** assets whose category or any ancestor is `INACTIVE`. `productStatus` is unchanged. Paid downloads remain valid.

Do not delete a category with children or assets; set `INACTIVE` or reassign.

---

# 13. Tag

Unique `slug`, unique case-normalized `name`. Restrict delete if `AssetTag` exists.

---

# 14. Asset

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| code | String | no | — | Immutable public id `BS-YYYYMMDD-XXXXXX` |
| title | String | no | Untitled Asset | Placeholder until admin edits |
| slug | String | no | — | Unique URL slug from title |
| description | String | yes | — | @db.Text |
| categoryId | String | yes | — | Required to publish |
| processingStatus | ProcessingStatus | no | UPLOADED | |
| productStatus | ProductStatus | no | DRAFT | |
| width, height | Int | yes | — | Master, after processing |
| orientation | AssetOrientation | yes | — | |
| format, mimeType | String | yes | — | Master |
| fileSizeBytes | BigInt | yes | — | Master |
| publishedAt | DateTime | yes | — | Set on publish; cleared on unpublish |
| createdAt / updatedAt | DateTime | no | | |

Constraints: unique `code`, unique `slug`. `code` must never be updated after insert.

`slug`: lowercase NFKD, `[a-z0-9]+` joined by hyphens, max 80 chars; fallback `untitled-asset`; suffix `-2`, `-3` on collision. Admin may change; uniqueness enforced. `code` is immutable and never derived from slug.

`code` uses `DailySequence` kind `ASSET_CODE` (same visual format as order numbers, separate sequence).

Publish requires: `processingStatus = READY`, title (not relying on placeholder quality — admin must have set a real title; reject publish if title is still `Untitled Asset`), category, ≥1 tag, MASTER + WATERMARKED_PREVIEW, exactly one default active `AssetLicense`.

Never hard-delete if `OrderItem` exists; archive.

---

# 15. AssetTag

PK `(assetId, tagId)`. Asset cascade; Tag restrict.

---

# 16. AssetFile

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| assetId | String | no | — | FK Restrict |
| fileClass | AssetFileClass | no | — | |
| storageKey | String | no | — | Internal R2 key only |
| bucket | String | no | — | |
| mimeType, extension | String | no | — | |
| width, height | Int | yes | — | |
| sizeBytes | BigInt | no | — | |
| isPublic | Boolean | no | false | true only THUMBNAIL and WATERMARKED_PREVIEW |
| createdAt / updatedAt | DateTime | no | | |

Unique `(assetId, fileClass)`, unique `storageKey`.

API must not return `storageKey` for MASTER or WORKING_PREVIEW. Storefront receives `publicUrl` generated from the public CDN base + public key. Downloads return `signedUrl` only.

MVP does **not** replace a master in place. A future replace-master feature must add a new versioned file, not overwrite this row’s object silently.

---

# 17. License

Seed `STANDARD`. Unique `code`. Deactivate instead of delete.

---

# 18. AssetLicense

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| assetId | String | no | — | FK Cascade |
| licenseId | String | no | — | FK Restrict |
| pricePaise | Int | no | — | GST-inclusive, ≥ 0 (0 allowed) |
| currency | String | no | INR | |
| isActive | Boolean | no | true | |
| isDefault | Boolean | no | false | |
| createdAt / updatedAt | DateTime | no | | |

Unique `(assetId, licenseId)`.

Exactly one default per asset: **partial unique index** on `assetId` WHERE `isDefault = true`.

Publish requires that default row to be `isActive = true`.

Changing `pricePaise` or `isActive` must not rewrite `OrderItem` snapshots. Historical purchases stay valid.

---

# 19. TaxRate

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| name | String | no | GST | |
| rateBps | Int | no | — | ≥ 0 |
| status | TaxRateStatus | no | INACTIVE | |
| currency | String | no | INR | |
| createdAt / updatedAt | DateTime | no | | |

**Exactly one ACTIVE row:** partial unique index on `(status)` WHERE `status = 'ACTIVE'` (or equivalent unique index on a constant `WHERE status = 'ACTIVE'`).

To change rate: set current row `INACTIVE`, insert a new `ACTIVE` row. Orders snapshot `taxRateBps`; no live FK after checkout.

Production `rateBps` is a business input before launch.

---

# 20. DailySequence

Concurrency-safe counters for `Asset.code` and `Order.orderNumber`.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| dateKey | String | no | — | `YYYYMMDD` UTC |
| kind | DailySequenceKind | no | — | ASSET_CODE or ORDER_NUMBER |
| lastValue | Int | no | 0 | |
| updatedAt | DateTime | no | updatedAt | |

Unique `(dateKey, kind)`.

Increment **inside a transaction**:

```text
UPDATE DailySequence
SET lastValue = lastValue + 1
WHERE dateKey = $date AND kind = $kind
RETURNING lastValue;
```

If no row, insert `{ dateKey, kind, lastValue: 1 }` with unique-conflict retry.

Format: `BS-{dateKey}-{lastValue padded to 6 digits}` e.g. `BS-20260815-000001`.

Never allocate by `COUNT(*)` of orders or assets.

---

# 21. Cart

One cart per authenticated user **or** one cart per guest token.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| userId | String | yes | — | Unique when set; FK User |
| guestToken | String | yes | — | Unique opaque cookie token |
| createdAt / updatedAt | DateTime | no | | |

Check: exactly one of `userId` or `guestToken` is non-null.

On login: merge guest cart items into the user’s cart (same `assetId` + `assetLicenseId` collapses to one line). Then delete the guest cart.

---

# 22. CartItem

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| cartId | String | no | — | FK Cart cascade |
| assetId | String | no | — | FK Asset cascade |
| assetLicenseId | String | no | — | FK AssetLicense restrict |
| quotedUnitPriceIncludingTaxPaise | Int | no | — | Display quote only |
| currency | String | no | INR | |
| createdAt / updatedAt | DateTime | no | | |

Unique `(cartId, assetId, assetLicenseId)`.

`quotedUnitPriceIncludingTaxPaise` is never used to charge.

Checkout: reload `AssetLicense.pricePaise`. If it differs from the quote, return `PRICE_CHANGED` (do not create the Razorpay order). Customer must confirm the new quote (cart quote is updated) and resubmit.

---

# 23. Order

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| orderNumber | String | no | — | Unique `BS-YYYYMMDD-XXXXXX` via DailySequence ORDER_NUMBER |
| idempotencyKey | String | no | — | UUID from client; unique with userId |
| userId | String | no | — | FK User Restrict; checkout requires authenticated user |
| status | OrderStatus | no | PENDING | |
| subtotalBeforeTaxPaise | Int | no | — | Snapshot |
| taxRateBps | Int | no | — | Snapshot of active TaxRate |
| taxPaise | Int | no | — | Sum of line tax |
| totalPaise | Int | no | — | GST-inclusive; Razorpay amount |
| currency | String | no | INR | |
| paidAt | DateTime | yes | — | Set when PAID |
| createdAt / updatedAt | DateTime | no | | |

Constraints:

- PK: `id`
- Unique: `orderNumber`
- Unique: `(userId, idempotencyKey)`
- FK: `userId` → User.id onDelete Restrict

Indexes: `userId`, `status`, `createdAt`.

Never delete. After `PAID`, do not change money fields except a later `REFUNDED` status.

Unpaid expiry: mark `PENDING` orders `CANCELLED` (and payment `CANCELLED`) after 30 minutes without capture (Inngest cron + lazy read).

If `totalPaise === 0`, checkout marks Payment `CAPTURED` and Order `PAID` without Razorpay.

---

# 24. OrderItem

Immutable sold line. Entitlement is this row, not the live catalog license.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| orderId | String | no | — | FK Restrict |
| assetId | String | no | — | FK Restrict; download lookup |
| licenseId | String | no | — | FK Restrict; catalog license row |
| assetLicenseId | String | no | — | FK Restrict; the priced row at purchase |
| assetTitle | String | no | — | Snapshot |
| licenseName | String | no | — | Snapshot |
| unitPriceBeforeTaxPaise | Int | no | — | Snapshot |
| taxRateBps | Int | no | — | Snapshot |
| taxPaise | Int | no | — | Snapshot tax for the line |
| unitPriceIncludingTaxPaise | Int | no | — | Snapshot (catalog GST-inclusive) |
| quantity | Int | no | 1 | MVP always 1 |
| lineTotalPaise | Int | no | — | Inclusive line total |
| currency | String | no | INR | |
| createdAt | DateTime | no | now() | |

Unique `(orderId, assetId, assetLicenseId)`. Never UPDATE snapshot columns.

If live `AssetLicense` is later deactivated or repriced, this row still entitles download for a `PAID` order.

---

# 25. Payment

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| orderId | String | no | — | FK Restrict |
| provider | PaymentProvider | no | RAZORPAY | |
| providerOrderId | String | yes | — | Razorpay order id |
| providerPaymentId | String | yes | — | Unique when set |
| providerStatus | String | yes | — | Raw Razorpay status string |
| status | PaymentStatus | no | PENDING | Internal |
| amountPaise | Int | no | — | Equals Order.totalPaise |
| currency | String | no | INR | |
| createdAt / updatedAt | DateTime | no | | |

Unique `providerPaymentId` (nullable unique). Unique `(provider, providerOrderId)` when set.

Idempotency: webhook and verify paths key on `providerPaymentId`. Duplicate CAPTURED is a no-op.

Refund: status `REFUNDED`; Order `REFUNDED`; download entitlement revoked.

Never store PAN, CVV, or secrets.

---

# 26. Download

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| userId | String | no | — | Must equal Order.userId |
| orderItemId | String | no | — | FK Restrict |
| assetId | String | no | — | From OrderItem, not client |
| licenseId | String | no | — | Snapshot license |
| createdAt | DateTime | no | now() | |

Never store `signedUrl` or `storageKey`. Never delete.

Authorization uses `OrderItem` + `Order.status = PAID` + `Payment.status = CAPTURED`. Changing a URL asset id cannot grant another customer’s file.

---

# 27. ImageProcessingJob

One row per attempt. Retry = **insert a new row**. Never overwrite a previous job.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| assetId | String | no | — | FK Restrict |
| status | ImageProcessingJobStatus | no | QUEUED | |
| attempt | Int | no | — | `max(attempt)+1` for that asset |
| errorCode | String | yes | — | Safe |
| errorMessage | String | yes | — | Safe |
| startedAt / completedAt | DateTime | yes | — | |
| createdAt / updatedAt | DateTime | no | | |

The master `AssetFile` is never replaced by a retry.

---

# 28. AuditLog

Mutations only. Do not audit ordinary catalog/order **views**.

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| id | String | no | cuid() | PK |
| actorUserId | String | yes | — | FK SetNull |
| action | String | no | — | |
| entityType | String | no | — | |
| entityId | String | yes | — | |
| metadata | Json | yes | — | Redacted |
| ipAddress | String | yes | — | Optional; privacy policy |
| userAgent | String | yes | — | Optional; privacy policy |
| createdAt | DateTime | no | now() | |

Required audit actions: asset create/update, publish/unpublish/archive, license create/update, price changes, upload, processing retry, order status changes, refunds, admin role changes, customer disable, login failures as security events.

Never log passwords, secrets, payment secrets, storage credentials, tokens, or `signedUrl` / private `storageKey`.

---

# 29. Index Summary

- Asset `(productStatus, processingStatus, publishedAt DESC)`, `categoryId`, `code`, `slug`, FTS on title/description
- AssetLicense `(assetId, isActive)`, partial unique default
- CartItem `(cartId, assetId, assetLicenseId)` unique
- Payment `providerPaymentId` unique
- Order `orderNumber` unique
- DailySequence `(dateKey, kind)` unique
- TaxRate one ACTIVE

---

# 30. Deletion Behavior Summary

| Entity | Policy |
|---|---|
| User | Disable if orders exist |
| Cart / CartItem | Hard-delete; guest cart deleted after merge |
| Asset | Archive; restrict if OrderItem exists |
| AssetFile MASTER | Never delete because a derivative failed |
| Order / OrderItem / Payment / Download / AuditLog | Never delete |
| ImageProcessingJob | Retain every attempt |
| TaxRate | Deactivate; insert new ACTIVE |
| License / Category / Tag | Restrict if in use; deactivate |

---

# 31. Search

PostgreSQL `to_tsvector` on title and description; join tags and category; exact `code`. Parent category query includes descendant category ids. Repository hides the engine.

---

# 32. Future Schema (do not create now)

Wishlist, Collection, Coupon, AssetView, contributor tables, `Asset.contributorId`, master file versioning for replace-master.
