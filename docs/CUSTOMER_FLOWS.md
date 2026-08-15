# Bommastock — Customer Flows

Version: Phase 0.1 (locked)

Storefront app: `apps/storefront`.

The browser may receive `publicUrl` for thumbnails and watermarked previews. It must never receive MASTER or WORKING_PREVIEW `storageKey` values. Purchased masters are returned only as `signedUrl` (300 seconds).

---

# 1. Homepage

Display:

- Hero and search
- Root categories
- Newly published images (`PUBLISHED` + `READY`)

Homepage copy is static or application configuration. No CMS.

---

# 2. Authentication

Email and password (Auth.js Credentials). OAuth is not in MVP. Email verification is not required for checkout.

Browsing, search, category, detail, and **guest cart** are available without login.

Checkout, purchases, and download require a CUSTOMER session.

On login, merge the guest cart into the customer cart.

---

# 3. Search

PostgreSQL over title, description, tags, category name, asset code. Results: `PUBLISHED` + `READY` only.

---

# 4. Category

Tree via `parentId`. No Subcategory table.

Selecting a parent category includes assets in **all descendant** categories. Selecting a child includes that node (and its descendants if any).

Display: header, child categories, grid, filters, sort newest.

---

# 5. Filters

MVP: category (with descendants), orientation, sort newest.

---

# 6. Image Gallery

Each card:

- Thumbnail `publicUrl`
- Title
- GST-inclusive display price from the **default** `AssetLicense`
- Add to cart (guest allowed)

Add to cart without a license picker uses the default license.

No wishlist control.

---

# 7. Image Details

- Watermarked preview `publicUrl` (not a storageKey field)
- Title, description, dimensions, format, category, tags
- License selector (active `AssetLicense` rows)
- GST-inclusive price for the selected license
- Add to cart
- Buy Now (redirect to login if guest, preserving the intended line)

Never expose master `storageKey` or a permanent master URL.

---

# 8. License Selection

Lists active licenses. MVP seeds STANDARD. Additional licenses appear from data.

Displayed price is GST-inclusive and display-only.

---

# 9. Add to Cart

Guest or authenticated.

If the customer did not select a license, use the asset’s default active `AssetLicense` (exactly one default per published asset).

Server:

- Validates `PUBLISHED` + `READY`
- Validates active `AssetLicense`
- Upserts `CartItem` for `(cartId, assetId, assetLicenseId)`
- Stores `quotedUnitPriceIncludingTaxPaise` from the live inclusive price (quote only)

---

# 10. Cart

Display thumbnail `publicUrl`, title, license, GST-inclusive quoted price, remove, estimated tax breakdown, GST-inclusive total.

Quotes are not authoritative.

---

# 11. Buy Now

Same `CheckoutService` as cart, one line. Login required before payment. Guest is prompted to log in; the line is in the cart/guest cart.

---

# 12. Checkout

Requires authentication.

1. Load lines and live `AssetLicense` prices.
2. Validate availability.
3. If any live inclusive price ≠ cart quote → **`PRICE_CHANGED`**. Show the new GST-inclusive price. Do not charge. Customer confirms; quotes update; checkout is resubmitted.
4. Never trust a browser price.
5. Compute tax with the single ACTIVE `TaxRate` (round half up, integer paise).
6. Create `Order` `PENDING` with immutable `OrderItem` snapshots (before-tax, rate, tax, inclusive, line total).
7. Create `Payment` `PENDING` and Razorpay order for `totalPaise` INR.
8. Customer pays.
9. Server verifies signature.
10. Webhook reconciles authoritatively; `Payment` `CAPTURED`; `Order` `PAID`.

Catalog prices shown here are GST-inclusive.

---

# 13. Payment

```text
Checkout
→ Razorpay Checkout
→ Client payment ids (untrusted)
→ Server HMAC + amount/currency/order verification
→ Webhook authoritative reconciliation (idempotent)
→ Order PAID / Payment CAPTURED
```

Failure: `Payment` `FAILED`, `Order` `FAILED`. No downloads. New checkout required.

Cancel or unpaid expiry (30 minutes): `CANCELLED` on payment and order.

Refunds: `REFUNDED`; downloads revoked.

---

# 14. Purchase Confirmation

Order number (`BS-YYYYMMDD-XXXXXX`), snapshot titles/licenses, GST-inclusive amount paid, download when `PAID`/`CAPTURED`.

---

# 15. My Purchases

Snapshot titles, date, license, download availability.

Unpublished or archived assets remain listed and downloadable for that order. Live catalog license deactivation does not remove entitlement.

---

# 16. Download

```text
Authenticate
→ OrderItem id (not a client storageKey or untrusted asset id)
→ Order belongs to this customer
→ Order PAID and Payment CAPTURED
→ Entitlement = OrderItem license snapshot
→ Resolve master server-side
→ signedUrl TTL 300 seconds
→ Insert Download
→ Return { url, expiresInSeconds: 300 }
```

The page never embeds a permanent master link and never receives `storageKey`.

---

# 17. Customer Account

Profile, orders, purchases/downloads. Out of MVP: wishlist, collections.

---

# 18. Error States

Clear errors for: unavailable image, **price changed**, payment failure, login failure, download failure, network failure, inactive license, cart merge issues.

---

# 19. Future

Wishlist, collections, reviews, coupons, subscriptions, credits, visual search, OAuth.
