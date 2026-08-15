# Bommastock — Admin Flows

Version: Phase 0.1 (locked)

Admin app: `apps/admin`. Every mutation requires `requireAdmin()`. No public admin registration.

Audit security-sensitive **mutations**. Do not audit ordinary list/detail views.

---

# 1. Admin Login

```text
Login → Auth.js → role ADMIN and status ACTIVE → Dashboard
```

Generic error on failure. Non-admin users are denied after authentication.

---

# 2. Admin Dashboard

Counts: total assets, PUBLISHED, DRAFT, ARCHIVED, processing (`UPLOADED`/`PROCESSING`), FAILED processing, orders, revenue (`PAID` totals), customers, downloads.

---

# 3. Upload Asset

```text
Select master
→ Rate-limited upload initiation
→ Presigned PUT to private master key (original filename discarded)
→ Asset DRAFT + UPLOADED
→ title = Untitled Asset
→ code = BS-YYYYMMDD-XXXXXX (DailySequence ASSET_CODE)
→ slug from title (unique)
→ MASTER AssetFile.storageKey stored server-side
→ ImageProcessingJob attempt 1 QUEUED
```

Validation: MIME, extension, magic bytes, 512 MiB, 20,000 px, 250 MP, Sharp decode. Supported: JPEG, PNG, WebP, TIFF.

---

# 4. Image Processing

Inngest (signature-verified `/api/inngest` on the admin app) runs `processAsset`:

```text
RUNNING / PROCESSING
→ Metadata
→ Thumbnail (public)
→ Working preview (private)
→ Watermarked preview (public)
→ READY / SUCCEEDED
```

Admin may open working preview via `signedUrl` TTL **300 seconds**. Never a public CDN object. Never send `storageKey` to the browser.

---

# 5. Asset Editing

Editable: title, description, category tree, tags, `AssetLicense` prices (GST-inclusive paise), default license flag, publish/unpublish/archive.

`Asset.code` is immutable.

`Asset.slug` may change; uniqueness enforced.

MVP does **not** replace the master in place. A future replace-master feature must create a new versioned master object, not overwrite the existing R2 object silently.

---

# 6. Publishing

Required:

- `processingStatus = READY`
- Title other than `Untitled Asset`
- Category
- ≥1 tag
- Exactly one default active `AssetLicense` with GST-inclusive `pricePaise`
- MASTER and WATERMARKED_PREVIEW files

Sets `PUBLISHED` and `publishedAt`. Audit.

---

# 7. Unpublish

`productStatus = DRAFT`, clear `publishedAt`. Hidden from storefront. Purchases remain valid. Audit. No `UNPUBLISHED` enum.

---

# 8. Archive

`productStatus = ARCHIVED`. Hidden from storefront. Orders and downloads remain valid. Audit.

---

# 9. Category Management

Root `parentId = null`; children have `parentId`. Storefront parent browse includes descendants. Do not delete in-use categories; deactivate.

---

# 10. License and Pricing

Seed STANDARD. Set GST-inclusive `pricePaise`. Mark exactly one `isDefault` per asset. Price changes do not rewrite `OrderItem`. Audit price and license mutations.

---

# 11. Order Management

View order number, customer, snapshot lines (before-tax, tax, inclusive), payment status, order status, date.

Cannot edit snapshots. Order status changes and refunds are audited.

---

# 12. Customer Management

View name, email, dates, purchase count, spend, `ACTIVE`/`DISABLED`. May disable. Audit. Never expose password hashes.

---

# 13. Download Records

View customer, asset, order, timestamp. Do not display `signedUrl` or `storageKey`.

---

# 14. Processing Failure and Retry

Show FAILED status and safe error. Retry **inserts a new** `ImageProcessingJob` with `attempt = previous max + 1`. Previous jobs are retained. Master is not replaced.

---

# 15. Refunds

Admin-initiated Razorpay refund (when implemented in later phases of MVP ops): Payment `REFUNDED`, Order `REFUNDED`, download entitlement revoked. Audit.

---

# 16. Audit Log

Log mutations: asset create/update, upload, retry, publish/unpublish/archive, license/price changes, order status changes, refunds, admin role changes, customer disable, login failures.

Do not log every view. Never log passwords, secrets, payment secrets, storage credentials, tokens, private `storageKey`, or `signedUrl`.

IP and user-agent may be stored on `AuditLog` per privacy policy.

---

# 17. Bulk Operations

Future.

---

# 18. First Admin Bootstrap

CLI/seed from `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD`. Refuse if an admin exists. Credentials never in source. Additional admins via controlled CLI or existing admin provisioning — never “Register as Admin”.
