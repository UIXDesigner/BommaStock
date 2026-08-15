# Bommastock — Security Specification

Version: Phase 0 (locked)

---

# 1. Security Objective

Protect:

- Master images and working previews
- Customer accounts
- Admin accounts
- Payments
- Orders
- Download access
- Personal information

Assume every client-side request can be manipulated. Prices, payment status, and download entitlement are server decisions.

---

# 2. Authentication

Provider: Auth.js with Prisma adapter. One `User` table. Roles: `CUSTOMER`, `ADMIN`.

- Customer registration and login are public on the storefront (email and password, Auth.js Credentials).
- OAuth social login is not in MVP.
- Email verification is not required for MVP checkout.
- There is no public admin registration.
- First admin is created by a secure bootstrap/seed process (`ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`). The process refuses to create another admin if one exists, unless an explicit controlled force flag is used.
- Additional admins are provisioned, not self-served.
- Disabled users (`User.status = DISABLED`) cannot authenticate.
- Protected customer routes: cart mutations, checkout, purchases, downloads.
- Admin app and all admin server actions require `role === ADMIN`.

Do not use Supabase Auth. Do not create a second user database.

Frontend route hiding is not authorization.

---

# 3. Authorization

Authentication answers who the user is.

Authorization answers what they may do.

`requireUser()` and `requireAdmin()` run on the server for every sensitive action.

---

# 4. Untrusted Client Payloads

Never trust:

- Client-side price
- Client-side order amount
- Client-side payment success
- Client-side order status
- Client-supplied storage keys
- Client-supplied MIME type as the only file check
- Client-supplied user id or role

The server loads assets, licenses, and prices from PostgreSQL.

---

# 5. Master Image Protection

Masters and working previews stay in the private R2 bucket.

Do not expose:

- Bucket credentials
- Master storage keys
- Working-preview keys to the storefront
- Permanent download URLs
- Unwatermarked large previews on the public CDN

Public CDN objects: thumbnail and watermarked preview only.

---

# 6. Signed Downloads

TTL: 300 seconds.

Flow:

1. Authenticate customer.
2. Identify asset from `OrderItem` (not from a client storage key).
3. Verify the order belongs to the session user.
4. Verify `Order.status = PAID` and `Payment.status = CAPTURED`.
5. Verify license entitlement on the line.
6. Verify MASTER `AssetFile` exists.
7. Generate a short-lived signed GET URL.
8. Insert `Download`.
9. Return `{ url, expiresInSeconds: 300 }`.

Never return R2 credentials, permanent master URLs, or storage keys.

Unpublished or archived assets remain downloadable for entitled purchases.

Download rows exist so quotas can be added later. MVP does not enforce a numeric cap.

---

# 7. Payment Security

Razorpay Orders + signature verification + webhooks.

Server must:

- Calculate amount from `AssetLicense` and `TaxRate`
- Create internal `Order` `PENDING_PAYMENT` with snapshots
- Create Razorpay order for `totalPaise` INR
- Verify HMAC signature
- Validate amount, currency, and order id
- Reconcile webhooks
- Mark `Payment` `CAPTURED` and `Order` `PAID` only after verification

`providerPaymentId` is unique. Duplicate webhooks are no-ops.

`RAZORPAY_KEY_ID` may be public. `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are server-only.

---

# 8. Admin Security

These actions require server-side ADMIN authorization:

- Upload
- Replace master
- Retry processing
- Publish / unpublish / archive
- Edit price or licenses
- Manage categories and tags
- Disable customers
- View orders, customers, downloads, audit log

Admin working-preview access uses short-lived signed URLs, never public objects.

---

# 9. Upload Security

Validate:

- Extension allowlist
- MIME allowlist
- File signature / magic bytes
- File size (512 MiB)
- Longest edge (20,000 px)
- Megapixels (250)
- Decodability via Sharp

Do not execute uploaded files. Original filenames never become storage paths.

---

# 10. Input Validation

Validate API inputs, form inputs, query parameters, ids, pagination, and filters with Zod (`packages/types`).

Ignore client-submitted prices for charging.

---

# 11. Secrets

Never store secrets in frontend code, Git, the database, or `NEXT_PUBLIC_*` variables (except Razorpay key id and the public CDN base URL for thumbnails/previews).

Use environment variables. See `/docs/ARCHITECTURE.md` §18.

---

# 12. Rate Limiting

Required (not optional) on:

- Login / register
- Upload
- Payment order creation and verification
- Download URL minting

Also apply reasonable limits to search and admin APIs.

---

# 13. Logging and PII

Log:

- Login and failed login (user id / email hashed or truncated as appropriate)
- Admin actions (AuditLog)
- Upload, publish, unpublish, archive
- Payment verification outcomes (ids, not secrets)
- Download issuance (Download row)

Never log:

- Passwords or password hashes
- `AUTH_SECRET`
- R2 access keys
- Razorpay secrets
- Full signed URLs
- Webhook raw secrets
- Card data (Razorpay never sends PAN to us; do not store it)

PII:

- Prefer user ids in logs.
- Do not put emails in `AuditLog.metadata` unless necessary.
- MVP Download rows do not store IP or user-agent.
- Do not log EXIF GPS from masters.

---

# 14. Derivatives Privacy

Strip EXIF and GPS from public derivatives and from the working preview.

Watermark generation lives in `packages/image-processing`.

---

# 15. Data Protection

Collect only data required to operate accounts, orders, and downloads.

Provide privacy and data-management policies before production launch.

---

# 16. Security Principle

All critical decisions happen server-side: price, tax, payment capture, publish eligibility, and download entitlement.
