# Bommastock — Phase 0.2 Decisions

Version: Phase 0.2 (locked)

This file is the decision record for remaining conflicts, ambiguities, and missing implementation requirements after Phase 0.1.

`PAYMENT.md` and `INGEST.md` do not exist in this repository. Payment rules live in `ARCHITECTURE.md`, `SECURITY.md`, `DATABASE.md`, `CUSTOMER_FLOWS.md`, and this file. Ingest/processing rules live in `IMAGE_PIPELINE.md`, `ARCHITECTURE.md`, and this file.

If a later implementation note disagrees with a LOCKED decision here, stop and update this file first.

---

## Decision D001 — Checkout price change

### Problem
Earlier drafts mixed “reject”, “auto-use the new price”, and “confirm”.

### Decision
The server loads live `AssetLicense.pricePaise`. If it differs from `CartItem.quotedUnitPriceIncludingTaxPaise`, return `PRICE_CHANGED` with the new GST-inclusive price. Do not create an Order or Razorpay order. Do not charge the old or new price silently. After the customer confirms, update the cart quote and require a new checkout submit. Never trust a browser price. `OrderItem` stores the confirmed live price snapshot.

### Rationale
Silent charging is a trust failure. Blocking without showing the new price is a dead end. Explicit confirm is the stock-marketplace pattern.

### Database impact
No extra table. Cart quote is display-only. OrderItem snapshots are written only after confirm + successful checkout create.

### API/application impact
Checkout API: `200` with body `{ code: "PRICE_CHANGED", items: [{ assetId, assetLicenseId, previousPaise, currentPaise }] }` or equivalent typed error. Storefront shows confirm UI.

### Security impact
Client-submitted prices are ignored.

### Status: LOCKED

---

## Decision D002 — Failed vs abandoned payment status

### Problem
`FAILED`, `CANCELLED`, and leftover `PENDING_PAYMENT` were used interchangeably.

### Decision
**OrderStatus:** `PENDING | PAID | FAILED | CANCELLED | REFUNDED`  
**PaymentStatus:** `PENDING | AUTHORIZED | CAPTURED | FAILED | CANCELLED | REFUNDED`  
Do not use `PENDING_PAYMENT` or `CREATED`.

- `FAILED`: a payment attempt was made and Razorpay (or verify) reports failure.
- `CANCELLED`: unpaid `PENDING` expired (30 minutes) or the customer/admin cancelled before capture.
- `PAID` / `CAPTURED`: successful capture only.

Provider raw status is stored in `Payment.providerStatus` and mapped (see `DATABASE.md`).

### Rationale
One vocabulary across UI, DB, and Razorpay mapping. Failed attempt ≠ abandoned cart.

### Database impact
Enums as above. No `PENDING_PAYMENT`.

### API/application impact
Map Razorpay webhooks through one mapper. Customer retries checkout by creating a new Order after FAILED/CANCELLED.

### Security impact
Entitlement only when Order `PAID` and Payment `CAPTURED`.

### Status: LOCKED

---

## Decision D003 — Audit requirements for views

### Problem
Architecture once required auditing order/user views; admin flows said views were optional.

### Decision
Audit **mutations** and security events only. Do not audit ordinary list/detail reads in MVP.

Must audit: asset create/update, upload, processing retry, publish/unpublish/archive, license/price changes, order status changes, refunds, admin user create/role change, customer disable, login failures.

### Rationale
View audit is high volume and low value for MVP. Mutations are the incident trail.

### Database impact
`AuditLog` as specified. Optional `ipAddress` / `userAgent`.

### API/application impact
Write AuditLog in domain services after successful mutations.

### Security impact
Never log secrets, passwords, `signedUrl`, private `storageKey`.

### Status: LOCKED

---

## Decision D004 — Browser exposure of storage keys

### Problem
AGENTS forbade “storage keys in the browser” while the storefront must show public CDN paths.

### Decision
Three terms:

- `storageKey` — internal R2 key in PostgreSQL. Never sent for MASTER or WORKING_PREVIEW.
- `publicUrl` — app-generated CDN URL for THUMBNAIL and WATERMARKED_PREVIEW. Allowed in the browser.
- `signedUrl` — 300s GET. Customer master after entitlement; admin working preview after `requireAdmin`. Never persisted.

JSON APIs return `publicUrl` or `signedUrl`, never a `storageKey` field for private objects.

### Rationale
Public derivatives must be cacheable. Private masters must not leak keys.

### Database impact
Store `storageKey` + `bucket` only.

### API/application impact
`packages/storage` builds URLs. Route handlers serialize URLs, not keys.

### Security impact
Key enumeration of masters is not possible from client payloads.

### Status: LOCKED

---

## Decision D005 — Image processing job retry

### Problem
Docs mixed “new job row” with “increment attempt on the same row”.

### Decision
Every retry **inserts** a new `ImageProcessingJob`. `attempt = max(attempt for asset) + 1`. Previous rows are immutable history. Retry never replaces the master object.

### Rationale
Preserves failure history for support. Avoids lost error messages.

### Database impact
No unique “one job per asset”. Index `(assetId, createdAt)`.

### API/application impact
Retry endpoint enqueues Inngest with the new job id.

### Security impact
Safe error strings only.

### Status: LOCKED

---

## Decision D006 — Worker HTTP exposure (Inngest)

### Problem
“No public HTTP worker” conflicted with Inngest needing an HTTP serve route.

### Decision
Inngest is the MVP orchestrator. `POST /api/inngest` lives on **`apps/admin`**. Requests must pass Inngest signature verification (`INNGEST_SIGNING_KEY`). Unsigned requests are rejected. This is not a public processing API.

Processing of 8K/16K TIFF must not run in the upload request.

### Rationale
Inngest on Vercel is the supported pattern. Signing is the access control.

### Database impact
None beyond job rows.

### API/application impact
Only the admin app serves Inngest. Storefront does not.

### Security impact
Treat the route as a verified webhook, not an open worker.

### Status: LOCKED

---

## Decision D007 — Presigned PUT validation timing

### Problem
“Validate before PUT **or** after upload” was left open.

### Decision
**Two stages (both required):**

1. **Before presigned PUT (upload HTTP):** allowlist MIME, extension, declared size ≤ 512 MiB. Reject otherwise. Do not issue a PUT URL for disallowed types.
2. **In the Inngest job:** magic bytes, Sharp decode, actual dimensions, megapixels, CMYK convertibility. On failure: `processingStatus = FAILED`, keep the uploaded object for admin diagnosis, do not publish.

### Rationale
Stage 1 stops obvious abuse cheaply. Stage 2 is the real file check; clients can lie about MIME.

### Database impact
FAILED jobs with safe `errorCode`.

### API/application impact
Upload initiate vs processAsset are separate.

### Security impact
Do not trust client MIME as the only check.

### Status: LOCKED

---

## Decision D008 — Razorpay signature verification and PAID

### Problem
Unclear whether client callback or webhook sets `PAID`.

### Decision
Client-reported success is never enough.

1. Callback: verify HMAC, amount, currency, Razorpay order id. Optionally fetch payment from Razorpay API.
2. **Webhook is authoritative reconciliation.**
3. Either verified callback+fetch (`captured`) **or** webhook `captured` may set Payment `CAPTURED` and Order `PAID`, **idempotent** on `providerPaymentId`.
4. Download entitlement only after `CAPTURED` / `PAID`.
5. If webhook arrives second, no-op.

### Rationale
Webhook can lag; blocking the buyer is worse than dual idempotent paths. Dual paths must not double-capture internally.

### Database impact
Unique `providerPaymentId`. Store `providerStatus`.

### API/application impact
Storefront: `POST /api/payments/razorpay/verify` and `POST /api/payments/razorpay/webhook`.

### Security impact
Webhook signature with `RAZORPAY_WEBHOOK_SECRET`. Callback HMAC with `RAZORPAY_KEY_SECRET`.

### Status: LOCKED

---

## Decision D009 — License entitlement snapshot vs live status

### Problem
“Verify license” could mean live `AssetLicense.isActive`.

### Decision
Entitlement is the **OrderItem snapshot** (`licenseId`, `assetLicenseId`, `licenseName`) on a `PAID` order. Later deactivation or price change of the live catalog license does **not** revoke download.

### Rationale
Customers bought a historical license. Catalog changes must not steal paid files.

### Database impact
OrderItem keeps FKs plus snapshot columns. Never update snapshots.

### API/application impact
Download service loads OrderItem, not current AssetLicense.isActive.

### Security impact
Still require Order.userId match, PAID, CAPTURED, master exists.

### Status: LOCKED

---

## Decision D010 — GST-inclusive catalog prices

### Problem
Inclusive vs exclusive display was unspecified.

### Decision
`AssetLicense.pricePaise` is **GST-inclusive**. Gallery, detail, cart, and checkout show inclusive INR. Tax is extracted onto Order/OrderItem for records. Razorpay `amount` = inclusive `totalPaise`.

### Rationale
India consumer expectation for listed prices. Simpler storefront.

### Database impact
Inclusive `pricePaise`; Order snapshots before-tax, tax, inclusive.

### API/application impact
`PriceDisplay` formats inclusive paise. Tax line is informational.

### Security impact
Server recomputes tax; client tax is ignored.

### Status: LOCKED

---

## Decision D011 — OrderItem.taxPaise allocation

### Problem
How to split order tax across lines was unspecified.

### Decision
Per line, with integer paise and **round half up**:

```text
I = unitPriceIncludingTaxPaise
R = taxRateBps
taxPaise = round_half_up(I * R / (10000 + R))
unitPriceBeforeTaxPaise = I - taxPaise
```

MVP `quantity` is always 1, so line tax = unit tax. Order `taxPaise` = sum of line `taxPaise`. No remainder redistribution beyond per-line rounding.

### Rationale
Deterministic, invoice-friendly, no float INR.

### Database impact
Fields already on OrderItem.

### API/application impact
`packages/commerce` implements one `extractGst(inclusivePaise, rateBps)` helper.

### Security impact
None beyond correct amounts.

### Status: LOCKED

---

## Decision D012 — Root category browsing

### Problem
Unclear whether a parent shows only its own assets or descendants.

### Decision
Browsing a category includes published+ready assets whose `categoryId` is **that node or any descendant**. Inactive categories: see D042.

### Rationale
Matches “Gods & Deities” containing Ganesha/Shiva children.

### Database impact
No closure table in MVP. Load descendant ids in the catalog repository (bounded depth; MVP two levels).

### API/application impact
Catalog query expands child ids.

### Security impact
None.

### Status: LOCKED

---

## Decision D013 — Gallery Add to Cart default license

### Problem
Gallery Add to Cart had no license picker.

### Decision
Use the asset’s **default** active `AssetLicense` (`isDefault = true`). Exactly one default per asset (partial unique). Publish requires that default to be active. Detail-page selector can override before add.

### Rationale
One-click add without hard-coding STANDARD in UI.

### Database impact
`AssetLicense.isDefault`.

### API/application impact
Add-to-cart without `assetLicenseId` resolves default server-side.

### Security impact
Server resolves default; client cannot force an inactive license.

### Status: LOCKED

---

## Decision D014 — Replace-master behavior

### Problem
“Never overwrite master” vs an admin replace-master flow.

### Decision
**Out of MVP.** No in-place replace. Retries never overwrite the master object. A future feature must add a **new versioned** master `AssetFile`, not silently PUT over the existing key.

### Rationale
Protects paid downloads and forensic originals.

### Database impact
Unique `(assetId, fileClass)` remains valid for MVP.

### API/application impact
No replace-master endpoint in MVP.

### Security impact
Reduces accidental destruction of entitled files.

### Status: LOCKED

---

## Decision D015 — Bootstrap password handling

### Problem
Plaintext env vs pre-hashed password was ambiguous.

### Decision
`ADMIN_BOOTSTRAP_PASSWORD` is **plaintext in server env** for the one-time CLI/seed only. The seed hashes it with Argon2id (D026) into `User.passwordHash`. The database never stores plaintext. The process refuses if any `ADMIN` exists. Credentials are never in source or client bundles.

### Rationale
Ops can set a password in env without pre-hashing tools. Hashing at insert is the secure store.

### Database impact
`passwordHash` only.

### API/application impact
`pnpm --filter database seed` or `admin:bootstrap` CLI.

### Security impact
Env file must not be committed. Rotate after first login recommended (change-password).

### Status: LOCKED

---

## Decision D016 — Admin working-preview signed URL TTL

### Problem
Customer download TTL was 300s; admin preview TTL was unspecified.

### Decision
Admin working-preview `signedUrl` TTL is **300 seconds**. Same as customer master download.

### Rationale
One constant (`SIGNED_URL_TTL_SECONDS = 300`) in `packages/storage`.

### Database impact
Do not persist the URL.

### API/application impact
Admin preview endpoint returns `{ url, expiresInSeconds: 300 }`.

### Security impact
`requireAdmin`. No public CDN for working previews.

### Status: LOCKED

---

## Decision D017 — Whether pricePaise = 0 is allowed

### Problem
`>= 0` vs “with price” could forbid free assets.

### Decision
**`pricePaise = 0` is allowed** (free licensed download still requires a PAID/CAPTURED order of total 0 or a normal paid checkout of 0). Razorpay: if `totalPaise === 0`, **do not** call Razorpay; mark Payment `CAPTURED` and Order `PAID` server-side after the same availability checks. Still create OrderItem snapshots. GST on 0 is 0.

### Rationale
Promotional/free assets should not need a fake ₹1 charge. Zero-amount must not hit Razorpay (API will reject).

### Database impact
Check `pricePaise >= 0`.

### API/application impact
Checkout branches on `totalPaise === 0`.

### Security impact
Zero-rupee capture still requires auth, availability, and idempotency. No client “mark as paid”.

### Status: LOCKED

---

## Decision D018 — Asset.code and Asset.slug generation

### Problem
Generation algorithm was incomplete.

### Decision
- **code:** `BS-{YYYYMMDD}-{nnnnnn}` UTC via `DailySequence` kind `ASSET_CODE`. **Immutable** after insert.
- **slug:** from title: lowercase, NFKD strip marks, `[a-z0-9]+` joined by hyphens, trim hyphens, max 80 chars. If empty, use `untitled-asset`. If unique violation, append `-2`, `-3`, … **Admin may change slug**; uniqueness enforced. Code is never derived from slug.

### Rationale
Stable public catalog ids; SEO slugs can be edited.

### Database impact
Unique `code`, unique `slug`.

### API/application impact
Generator in `packages/database` or `packages/commerce`.

### Security impact
Do not use original filenames.

### Status: LOCKED

---

## Decision D019 — Upload title placeholder

### Problem
Title is non-null at insert but unknown at upload.

### Decision
On upload set `title = "Untitled Asset"`. Publish is **rejected** while title remains exactly `Untitled Asset`. Admin must set a real title.

### Rationale
Satisfies NOT NULL without fake marketing titles going live.

### Database impact
Default title string.

### API/application impact
Publish validator.

### Security impact
None.

### Status: LOCKED

---

## Decision D020 — Daily orderNumber sequence

### Problem
`COUNT(*)` races under concurrent checkout.

### Decision
`DailySequence` table, unique `(dateKey, kind)`, `UPDATE … SET lastValue = lastValue + 1 RETURNING` in a transaction. Kind `ORDER_NUMBER` and `ASSET_CODE` are separate. Format `BS-YYYYMMDD-XXXXXX`.

### Rationale
Row-level increment is safe under concurrency.

### Database impact
`DailySequence` entity.

### API/application impact
Allocate inside the checkout transaction.

### Security impact
Predictable numbers are OK; they are not secrets.

### Status: LOCKED

---

## Decision D021 — Single ACTIVE TaxRate

### Problem
Service-only “one active” could fail.

### Decision
Partial unique index: only one row with `status = ACTIVE`. Changing rate: deactivate old, insert new ACTIVE. Checkout reads the single ACTIVE row; if none, checkout errors `TAX_NOT_CONFIGURED`.

### Rationale
DB enforces the invariant.

### Database impact
Partial unique index.

### API/application impact
Admin tax UI must not activate a second row.

### Security impact
Prevents silent wrong tax.

### Status: LOCKED

---

## Decision D022 — Domain service / package placement

### Problem
CheckoutService was named but not housed.

### Decision
Add **`packages/commerce`**:

- CartService (guest merge, add/remove, quotes)
- CheckoutService (PRICE_CHANGED, snapshots, idempotency, zero-amount path)
- EntitlementService (download authorization)
- PublishService (publish gates)
- Gst math helper

`packages/payments`: Razorpay HTTP only (create order, verify signature, refund, fetch payment).  
`packages/database`: Prisma, repositories, DailySequence.  
`packages/storage`: keys, publicUrl, signedUrl, presign.  
`packages/image-processing`: Sharp, watermark, limits.  
`packages/auth`: Auth.js, RBAC, password hash.  

Apps call commerce; commerce calls database/payments/storage. UI never calls payments/storage.

### Rationale
Keeps Razorpay I/O separate from checkout policy.

### Database impact
None.

### API/application impact
Monorepo package list updated.

### Security impact
Entitlement not duplicated in UI.

### Status: LOCKED

---

## Decision D023 — Inngest route ownership

### Problem
Which app hosts Inngest.

### Decision
**`apps/admin`** `POST /api/inngest` only. Storefront has no Inngest serve route.

### Rationale
Processing is an admin concern; one signing surface.

### Database impact
None.

### API/application impact
Vercel admin project env: `INNGEST_*`.

### Security impact
See D006.

### Status: LOCKED

---

## Decision D024 — Auth.js cookie and AUTH_URL isolation

### Problem
Two apps could clobber sessions.

### Decision
Two Auth.js deployments:

| App | AUTH_URL | Cookie name |
|---|---|---|
| storefront | `STOREFRONT_URL` | `bommastock.storefront.session` |
| admin | `ADMIN_URL` | `bommastock.admin.session` |

`AUTH_SECRET` may be shared. Cookies: `httpOnly`, `secure` in production, `sameSite=lax`. Host-only (no parent-domain share required). A CUSTOMER session cannot authorize admin routes.

### Rationale
Prevents role confusion across subdomains.

### Database impact
Shared `Session` table is OK; cookie names differ.

### API/application impact
`packages/auth` factory parameterized by app name.

### Security impact
Admin cookie not sent to storefront origin if hosts differ.

### Status: LOCKED

---

## Decision D025 — Session strategy

### Problem
JWT vs database sessions.

### Decision
**Database sessions** via Auth.js Prisma adapter (`Session` table). Session max age: **14 days**. Idle rotation: Auth.js default.

### Rationale
Revoke-on-disable works (`User.status = DISABLED` + delete sessions).

### Database impact
`Session` model required.

### API/application impact
On disable customer/admin, delete that user’s sessions.

### Security impact
Stolen JWT cannot outlive DB revoke.

### Status: LOCKED

---

## Decision D026 — Password hashing algorithm

### Problem
Algorithm unspecified.

### Decision
**Argon2id** for `User.passwordHash` (OWASP). Parameters: memory 19456 KiB, iterations 2, parallelism 1 (or library defaults of `@node-rs/argon2` / `oslo` equivalent — document constants in `packages/auth`). Bootstrap and register use the same hasher. Verify in Auth.js Credentials `authorize`.

### Rationale
Stronger than bcrypt for new systems.

### Database impact
`passwordHash` string; never log.

### API/application impact
`packages/auth` hash/verify helpers.

### Security impact
No reversible password storage.

### Status: LOCKED

---

## Decision D027 — Password reset and change

### Problem
Credentials auth without reset is operationally incomplete.

### Decision
**Change password (MVP):** authenticated user sends current + new password. Re-hash Argon2id. Invalidate other sessions except current (optional: invalidate all).

**Forgot password (MVP):** request by email; always return a generic success message. If user exists and is ACTIVE, store Auth.js `VerificationToken` (TTL **1 hour**) and send a link `{STOREFRONT_URL}/reset-password?token=…`. Admin users use `{ADMIN_URL}/reset-password`. Email via **Resend** (`RESEND_API_KEY`, from `EMAIL_FROM`). If email is not configured in local dev, write the reset URL to **server logs only** (not the HTTP response).

New password rules: minimum 10 characters.

### Rationale
Marketplace buyers will forget passwords. Generic response prevents email enumeration.

### Database impact
`VerificationToken` already in schema.

### API/application impact
Resend in env. Storefront + admin reset pages.

### Security impact
Rate-limit forgot-password with login limits. Tokens single-use.

### Status: LOCKED

---

## Decision D028 — Editable customer profile fields

### Problem
Account/profile was named without a field list.

### Decision
Customer may edit **`name`** and **password** (D027). **Email change is not MVP** (identity key). No avatar upload in MVP. Admin may view email; admin does not edit customer password (use disable + customer reset).

### Rationale
Email change needs verify-new-email; defer.

### Database impact
Update `User.name` only from profile API.

### API/application impact
`PATCH /profile` with Zod `{ name }`.

### Security impact
`requireUser`. No email uniqueness races.

### Status: LOCKED

---

## Decision D029 — Additional admin creation

### Problem
Only first-admin bootstrap was specified.

### Decision
First admin: bootstrap CLI (D015).  
**Further admins:** an existing ADMIN creates them in the admin app: email + temporary password (min 10). `role = ADMIN`, `status = ACTIVE`. Password hashed Argon2id. Audit `ADMIN_USER_CREATE`. No public register-as-admin. CLI must not create extra admins unless `ADMIN_BOOTSTRAP_ALLOW_ADDITIONAL=true` (emergency, documented, default false).

### Rationale
Day-to-day provisioning in UI; bootstrap stays one-shot.

### Database impact
Same User table.

### API/application impact
Admin “Team” or “Admins” screen. `requireAdmin`.

### Security impact
Cannot self-elevate from CUSTOMER.

### Status: LOCKED

---

## Decision D030 — Rate limits and enforcement locations

### Problem
Need numeric limits and where they run.

### Decision
Application-level in **route handlers / Next.js middleware** of the owning app. MVP: in-memory per instance is acceptable. Shared store later.

| Action | Limit | Key | App |
|---|---|---|---|
| Login / register / forgot-password | 5 / 15 min | IP + email | both |
| Upload initiate | 30 / hour | admin user id | admin |
| Payment create / verify | 10 / 15 min | user id | storefront |
| Download signedUrl | 20 / 15 min | user id | storefront |

### Rationale
Stops brute force and download scraping without Redis on day one.

### Database impact
None.

### API/application impact
`packages/auth` or `packages/config` helper `rateLimit(key, limit, window)`.

### Security impact
Required, not optional.

### Status: LOCKED

---

## Decision D031 — R2 CORS

### Problem
Browser PUT to presigned URLs fails without CORS.

### Decision
**Private bucket CORS:** allow origins `ADMIN_URL` only; methods `PUT`, `GET`, `HEAD`; headers `Content-Type`, `Content-Length`, `x-amz-*`; max age 3600.  
**Public bucket:** GET/HEAD from `STOREFRONT_URL` and `ADMIN_URL` (and CDN). No PUT from storefront.

Document the CORS JSON in ops notes; apply in R2 dashboard or IaC later. Not application code in MVP beyond using the correct origins.

### Rationale
Upload is admin-only. Storefront never PUTs.

### Database impact
None.

### API/application impact
Presign `Content-Type` must match the uploaded file.

### Security impact
Do not allow `*` origin on the private bucket.

### Status: LOCKED

---

## Decision D032 — Multipart upload threshold

### Problem
“When large” was undefined.

### Decision
Single presigned PUT if size **≤ 100 MiB**. **> 100 MiB** and ≤ 512 MiB: multipart/resumable (S3 multipart via R2). Above 512 MiB: reject.

### Rationale
100 MiB is a practical browser PUT ceiling; TIFF masters may exceed it.

### Database impact
None.

### API/application impact
Upload API returns `mode: "put" | "multipart"`.

### Security impact
Still Stage-1 size check.

### Status: LOCKED

---

## Decision D033 — WebP quality

### Problem
“Do not crush” had no number.

### Decision
Sharp WebP: **thumbnail quality 75**, **working + watermarked preview quality 82**. Do not go below 70. `effort` 4. No AVIF in MVP.

### Rationale
Balanced size vs evaluation quality.

### Database impact
None.

### API/application impact
Constants in `packages/image-processing`.

### Security impact
None.

### Status: LOCKED

---

## Decision D034 — Watermark defaults

### Problem
Watermark was “configurable” without defaults.

### Decision
Defaults in `packages/image-processing`:

- Repeated diagonal text `BOMMASTOCK`
- Angle **−35 degrees**
- Fill opacity **0.16**
- Font size **5%** of `min(width, height)` (clamped 18–72 px)
- Tile gap **1.6 ×** font size
- Color white with dark stroke (1 px) for contrast on light/dark art

Admins do not configure this in UI in MVP. Code constants only.

### Rationale
Visible, hard to crop, brand-consistent.

### Database impact
None.

### API/application impact
One `applyWatermark(sharpInstance)` function.

### Security impact
Watermark is the public-preview control, not CSS.

### Status: LOCKED

---

## Decision D035 — Download Content-Disposition filename

### Problem
Browser download name was unspecified.

### Decision
Signed GET response (or a same-origin download proxy if R2 cannot set headers):  
`Content-Disposition: attachment; filename="{assetCode}_{licenseCode}.{ext}"`  
Example: `BS-20260815-000001_STANDARD.tiff`.  
Sanitize to `[A-Za-z0-9._-]`. Never use the original upload filename.

If R2 presign cannot set Content-Disposition, **storefront download route** streams via server (authenticated) with that header. Prefer presign query `response-content-disposition` when R2 supports it.

### Rationale
Predictable names; no PII/path leakage.

### Database impact
Use OrderItem snapshots + master extension.

### API/application impact
`packages/storage.signMasterDownload({ filename })`.

### Security impact
No `storageKey` in the filename.

### Status: LOCKED

---

## Decision D036 — Razorpay receipt / orderNumber mapping

### Problem
Receipt mapping missing.

### Decision
Razorpay order `receipt` = Bommastock `orderNumber` (`BS-YYYYMMDD-XXXXXX`, ≤ 40 chars). Also store `providerOrderId` on Payment. Notes: `{ orderId }` (internal cuid) for support.

### Rationale
Dashboard matching.

### Database impact
`Payment.providerOrderId`.

### API/application impact
`orders.create({ receipt: order.orderNumber })`.

### Security impact
Receipt is not a secret.

### Status: LOCKED

---

## Decision D037 — Webhook path

### Problem
Path unspecified.

### Decision
Storefront route: **`POST /api/payments/razorpay/webhook`**. Verify `X-Razorpay-Signature`. Raw body required. Return 200 on idempotent replay. Admin app does not expose this webhook.

### Rationale
Payments are a customer-storefront concern.

### Database impact
None.

### API/application impact
Configure the same URL in Razorpay dashboard.

### Security impact
Webhook secret server-only.

### Status: LOCKED

---

## Decision D038 — Checkout idempotency

### Problem
Double-submit could create two Razorpay orders.

### Decision
Client sends `idempotencyKey` (UUID v4) on checkout create. Store `Order.idempotencyKey`. Unique `(userId, idempotencyKey)`. Replay returns the existing PENDING order and its Razorpay payload if still `PENDING` and not expired. After FAILED/CANCELLED/PAID, the same key must not create a second charge; return the existing order.

### Rationale
Standard payment idempotency.

### Database impact
`Order.idempotencyKey` String, unique with userId.

### API/application impact
CheckoutService looks up key first.

### Security impact
Key is per-user; cannot hijack another user’s order.

### Status: LOCKED

---

## Decision D039 — PENDING timeout

### Problem
Abandoned PENDING orders.

### Decision
Unpaid Order `PENDING` + Payment `PENDING`/`AUTHORIZED` expire after **30 minutes**. Then Order `CANCELLED`, Payment `CANCELLED`. Implementation: Inngest cron every 5 minutes **and** lazy expire on read. Do not capture after expiry. Customer must checkout again.

### Rationale
Clears Razorpay pending orders; matches short-lived checkout.

### Database impact
Use `createdAt` + status.

### API/application impact
Cron in admin Inngest app.

### Security impact
No entitlement on CANCELLED.

### Status: LOCKED

---

## Decision D040 — AUTHORIZED vs auto-CAPTURED

### Problem
Whether to support delayed capture.

### Decision
Create Razorpay orders with **`payment_capture: 1`** (auto-capture). Entitlement requires `CAPTURED`. If a webhook `authorized` arrives, store Payment `AUTHORIZED` and wait for `captured`. Do not implement manual capture in MVP.

### Rationale
India Razorpay default; simpler ops.

### Database impact
AUTHORIZED is a valid intermediate.

### API/application impact
No admin “capture” button.

### Security impact
Do not entitle on AUTHORIZED alone.

### Status: LOCKED

---

## Decision D041 — Refund flow

### Problem
Enum existed; admin copy said “later phases”.

### Decision
**Full refunds are in MVP.** Admin `requireAdmin` calls `packages/payments.refund(providerPaymentId)` for Order `PAID`. Partial refunds are out of MVP. On Razorpay refund webhook or confirmed refund API: Payment `REFUNDED`, Order `REFUNDED`, **download entitlement revoked**. Audit `ORDER_REFUND`. Customer sees refunded status; download returns `ENTITLEMENT_REVOKED`.

### Rationale
Ops need a path to reverse a mistaken charge.

### Database impact
Status transition PAID → REFUNDED only.

### API/application impact
Admin order detail “Refund” with confirm. Storefront webhook handles `refund.processed`.

### Security impact
Server-side only. No customer self-refund.

### Status: LOCKED

---

## Decision D042 — Inactive category vs published assets

### Problem
Deactivating a category left storefront visibility undefined.

### Decision
Storefront discovery (gallery, search, category pages, homepage) **excludes** an asset if its `categoryId` category is `INACTIVE` **or any ancestor is INACTIVE**. `productStatus` is unchanged. Existing `PAID` purchases still download. Admin lists still show the asset with a “category inactive” flag. To sell again: activate category or reassign.

### Rationale
Deactivate is a merchandising hide without mass-unpublish.

### Database impact
No extra column. Catalog query joins category tree.

### API/application impact
Catalog repository filters inactive ancestors.

### Security impact
None.

### Status: LOCKED

---

## Phase 0.2 Completion Checklist

- [x] All documentation conflicts resolved
- [x] All ambiguities resolved
- [x] All missing implementation requirements specified
- [x] Database requirements complete
- [x] Architecture requirements complete
- [x] Image pipeline requirements complete
- [x] Security requirements complete
- [x] Payment requirements complete
- [x] No unresolved contradictory requirements remain

Business inputs still required before **production launch** (not blockers for Phase 1 scaffolding or Prisma): production GST `rateBps`, STANDARD license legal copy, brand colors, privacy policy for storing audit IP/UA, Resend domain/`EMAIL_FROM`.
