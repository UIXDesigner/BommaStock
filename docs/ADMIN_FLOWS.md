# Bommastock — Admin Flows

Version: Phase 0 (locked)

Admin app: `apps/admin`. Every flow requires `requireAdmin()` on the server. There is no public admin registration.

---

# 1. Admin Login

```text
Admin
→ Login
→ Auth.js authentication
→ role === ADMIN and status === ACTIVE
→ Admin dashboard
```

Invalid credentials: generic safe error. Do not reveal whether the email exists.

Non-admin customers who reach `/login` on the admin app are denied after authentication.

---

# 2. Admin Dashboard

Show counts (queries, not a separate analytics product):

- Total assets
- Published (`productStatus = PUBLISHED`)
- Draft (`productStatus = DRAFT`)
- Archived (`productStatus = ARCHIVED`)
- Processing (`processingStatus = PROCESSING` or `UPLOADED`)
- Failed processing (`processingStatus = FAILED`)
- Orders
- Revenue (sum of PAID order totals)
- Customers
- Downloads

---

# 3. Upload Asset

```text
Images → Upload
→ Select master file
→ Client uploads to private R2 via presigned PUT
→ Server creates Asset DRAFT + UPLOADED and MASTER AssetFile
→ ImageProcessingJob QUEUED
→ UI shows processing status
```

Original filename is discarded. Validation uses MIME, extension, magic bytes, size (512 MiB), dimensions (20,000 px / 250 MP), and decodability.

---

# 4. Image Processing

Worker (Inngest) runs `processAsset`:

```text
PROCESSING
→ Extract metadata
→ Thumbnail (public)
→ Working preview (private)
→ Watermarked preview (public)
→ READY
```

Display `processingStatus` and job error category on failure.

Admin may open the private working preview for quality review. That URL is a short-lived signed URL, never a public CDN object.

---

# 5. Asset Editing

Admin can edit:

- Title
- Description
- Category (tree; child category is subcategory)
- Tags
- Active licenses and `pricePaise` per license
- `productStatus` via publish / unpublish / archive actions

Master replacement requires an explicit replace-master action, which re-enters `UPLOADED` and queues a new job. Do not overwrite the previous master until the new file is stored; keep purchase downloads pointing at the current MASTER `AssetFile` until replacement succeeds.

Prices are database values. Admin UI must not hard-code license names or amounts.

---

# 6. Publishing

```text
Review
→ Inspect watermarked preview
→ Validate required metadata
→ Publish
```

Required:

- `processingStatus = READY`
- Title
- Category
- At least one tag
- At least one active AssetLicense with price
- MASTER file
- WATERMARKED_PREVIEW file

Publish sets `productStatus = PUBLISHED` and `publishedAt`.

Write an AuditLog row.

---

# 7. Unpublish

Unpublish sets `productStatus = DRAFT` and clears `publishedAt`.

Effects:

- Hidden from public search and categories
- Existing purchases remain valid
- Downloads remain valid

There is no separate `UNPUBLISHED` enum value.

---

# 8. Archive

Archive sets `productStatus = ARCHIVED`.

Effects:

- Hidden from the public marketplace
- Hidden from normal admin “active catalog” lists (still findable in archived filter)
- Historical orders unchanged
- Downloads remain valid

---

# 9. Category Management

Admin can:

- Create root category (`parentId = null`)
- Create child category (`parentId` set) — this is a subcategory
- Edit name, slug, description
- Reorder (`sortOrder`)
- Activate / deactivate

Do not delete categories that have children or assets. Deactivate or reassign first.

Example:

- Gods & Deities
  - Lord Ganesha
  - Lord Shiva
  - Goddess Lakshmi
  - Lord Vishnu

---

# 10. License and Pricing Management

Admin can:

- View licenses (MVP seed: STANDARD)
- Add future licenses as rows (Extended, Editorial, Commercial, Enterprise) without a code change to pricing UI
- Set `AssetLicense.pricePaise` per asset
- Activate / deactivate an asset license

Changing a price does not rewrite historical `OrderItem` rows.

---

# 11. Order Management

Admin can view:

- Order number
- Customer (name/email as needed; avoid extra PII)
- Items (snapshot title, license, amounts)
- Amounts in paise, displayed as INR
- Payment status
- Order status
- Date

Admin cannot edit snapshot prices.

---

# 12. Customer Management

Admin can view:

- Name
- Email
- Registration date
- Purchase count
- Total spend
- Account status (`ACTIVE` / `DISABLED`)

Admin may disable a customer account. Disabled users cannot authenticate.

Do not expose password hashes.

---

# 13. Download Records

Admin can view download log rows: customer, asset, order, timestamp.

Do not display signed URLs or storage keys.

---

# 14. Processing Failure

Display:

- Asset
- `processingStatus = FAILED`
- Error category / safe message
- Retry action

Retry queues a new `ImageProcessingJob`. The master is not deleted.

---

# 15. Audit Log

Admin actions that must be logged:

- Login (and failed login)
- Upload
- Retry processing
- Publish / unpublish / archive
- Price change
- License change
- Customer disable
- Order/payment viewing is optional; mutations are required

Never log passwords, secrets, payment secrets, or full private URLs.

---

# 16. Bulk Operations

Future: bulk publish, unpublish, category assignment, tagging, pricing.

---

# 17. First Admin Bootstrap

Not a UI flow on the public internet.

After migrations, a one-time seed/bootstrap creates the first `User` with `role = ADMIN` from server env (`ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`). It refuses to run if an admin already exists.

Additional admins are provisioned by an existing admin or the same controlled process. Never “Register as Admin”.
