# Bommastock — Security Specification

Version: Phase 0.2 (locked)

---

# 1. Security Objective

Protect masters, working previews, accounts, payments, orders, downloads, and personal information.

Assume every client request can be manipulated. Prices, payment status, and download entitlement are server decisions.

---

# 2. Authentication

Auth.js + Prisma adapter. Database sessions. One `User` table. Roles: `CUSTOMER`, `ADMIN`. No Supabase Auth.

- Customer: email/password. Argon2id. Change-password and forgot-password are MVP. OAuth later. Email verification not required for MVP checkout.
- Guest cart allowed; checkout requires login.
- No public admin registration.
- First admin: env/CLI bootstrap (`ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`). Refuse if an admin exists. Credentials never in source.
- Additional admins: controlled provisioning only.
- `DISABLED` users cannot authenticate.
- `requireUser` / `requireAdmin` on the server. Frontend hiding is not authorization.

---

# 3. Authorization

Who vs what. Every sensitive mutation is authorized server-side.

---

# 4. Untrusted Client Payloads

Never trust: client price, order amount, payment success, order status, private `storageKey`, client MIME as the only file check, client user id/role, client asset id as download authority.

---

# 5. Storage: storageKey vs publicUrl vs signedUrl

| Term | Browser |
|---|---|
| `storageKey` (MASTER / WORKING_PREVIEW) | Never |
| `publicUrl` (thumbnail, watermarked preview) | Yes |
| `signedUrl` (300s) | After entitlement (customer master) or `requireAdmin` (working preview) |

Never return R2 credentials or permanent private URLs.

---

# 6. Signed Downloads

TTL: 300 seconds.

1. Authenticate customer.
2. Identify `OrderItem` (not a client `storageKey` or untrusted asset id).
3. Verify the order belongs to the session user.
4. Verify `Order.status = PAID` and `Payment.status = CAPTURED`.
5. Verify entitlement from the **OrderItem license snapshot** (live `AssetLicense` may be inactive).
6. Resolve MASTER `storageKey` server-side.
7. Generate `signedUrl`.
8. Insert `Download`.
9. Return `{ url, expiresInSeconds: 300 }` only. Prefer `Content-Disposition` filename `{assetCode}_{licenseCode}.{ext}`.

A customer cannot download another customer’s asset by changing an asset id.

Admin working preview: `signedUrl` 300s, `requireAdmin`.

---

# 7. Payment Security

Razorpay Orders. Currency INR. Catalog prices GST-inclusive.

Server:

1. Revalidate cart (availability, license, live price).
2. On quote mismatch return `PRICE_CHANGED`; do not charge.
3. Calculate totals (integer paise, round half up).
4. Create `Order` `PENDING` and `Payment` `PENDING`.
5. Create Razorpay order.
6. Verify HMAC on callback; fetch/validate amount, currency, order id.
7. Webhook is authoritative reconciliation.
8. Map provider status → `PENDING` | `AUTHORIZED` | `CAPTURED` | `FAILED` | `CANCELLED` | `REFUNDED`.
9. Entitlement only when `CAPTURED` / Order `PAID`.
10. Idempotent on `providerPaymentId`.

Never trust client-reported success.

Failed attempt → `FAILED`. Unpaid cancel/expiry → `CANCELLED`. Refund → `REFUNDED` and entitlement revoked.

Storefront webhook: `POST /api/payments/razorpay/webhook`. Verify `X-Razorpay-Signature`.

Razorpay orders use `payment_capture: 1`. Entitlement requires `CAPTURED`, not `AUTHORIZED`.

Zero-amount orders skip Razorpay and are captured server-side after the same checks.

---

# 8. Admin Security

Server-side ADMIN for: upload, retry, publish/unpublish/archive, prices/licenses, categories/tags, disable customers, refunds, role changes.

Working preview: short-lived `signedUrl` only.

---

# 9. Upload Security

MIME, extension, magic bytes, 512 MiB, 20,000 px, 250 MP, Sharp decode, filename sanitization (never use original name as path). JPEG, PNG, WebP, TIFF. CMYK only if Sharp can process; otherwise fail clearly.

---

# 10. Input Validation

Zod on all inputs. Ignore client prices for charging.

---

# 11. Secrets

Never in frontend, Git, database, or `NEXT_PUBLIC_*` except Razorpay key id and public CDN base URL.

---

# 12. Rate Limiting

Application-level (route handlers / middleware). MVP does not require Redis. Per-instance limits are acceptable; a shared store can be added later.

| Action | Limit | Key |
|---|---|---|
| Login / register / forgot-password | 5 / 15 minutes | IP + email |
| Upload initiation | 30 / hour | Admin user id |
| Payment order creation | 10 / 15 minutes | User id |
| Download `signedUrl` minting | 20 / 15 minutes | User id |

Also apply coarse limits to search and admin APIs.

---

# 13. Audit Logging

Audit **mutations**, not ordinary reads.

Must audit: asset create/update, upload, processing retry, publish/unpublish/archive, license/price changes, order status changes, refunds, admin user create/role change, customer account disable, login failures.

Never log: passwords, hashes, `AUTH_SECRET`, R2 keys, Razorpay secrets, tokens, full `signedUrl`, private `storageKey`, card data.

IP and user-agent **may** be stored on `AuditLog` according to the privacy policy.

---

# 14. Derivatives Privacy

Strip EXIF/GPS from public derivatives and working preview. Watermark in `packages/image-processing`.

---

# 15. Inngest Endpoint

`POST /api/inngest` on the admin app must verify Inngest signatures. Unsigned requests are rejected. It is not a public processing API.

---

# 16. Data Protection

Collect only what accounts, orders, and downloads require. Privacy policy before production launch.

---

# 17. Security Principle

Server-side: price, tax, `PRICE_CHANGED`, payment capture, publish eligibility, download entitlement.
