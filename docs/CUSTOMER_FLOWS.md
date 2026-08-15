# Bommastock — Customer Flows

Version: Phase 0 (locked)

Storefront app: `apps/storefront`.

Public storefront images are thumbnail and watermarked preview only. Never expose master or working-preview URLs.

---

# 1. Homepage

Customer opens the storefront.

Display:

- Hero and search
- Root categories
- Newly published images (`productStatus = PUBLISHED` and `processingStatus = READY`)

Primary action: search images.

Homepage copy and highlights are static or application configuration. There is no CMS and no collections product in MVP.

---

# 2. Authentication

Customer registers and logs in on the storefront with email and password (Auth.js Credentials).

Browsing, search, category, and image detail are public.

Add to cart, Buy Now, checkout, purchases, and download require a CUSTOMER session. Unauthenticated cart/checkout actions redirect to login.

OAuth social login is not in MVP. Email verification is not required for MVP checkout.

---

# 3. Search

Customer enters a search term.

Example: Krishna

PostgreSQL search over:

- Title
- Description
- Tags
- Category name
- Asset code

Results include only `PUBLISHED` + `READY` assets.

---

# 4. Category

Customer selects a root category (example: Gods & Deities).

Display:

- Category header
- Child categories (subcategories)
- Image grid
- Filters
- Sort (newest)

Selecting a child category (example: Lord Ganesha) filters to that node. Category is a tree (`parentId`). There is no separate Subcategory entity.

---

# 5. Filters

MVP:

- Category / subcategory
- Orientation: landscape, portrait, square
- Sort: newest

Future: resolution, format, price, license, popularity.

---

# 6. Image Gallery

Each card displays:

- Public thumbnail
- Title
- Display price supplied by the catalog service (STANDARD `AssetLicense` when active; otherwise the first active license by `sortOrder`)
- Relevant metadata (orientation or dimensions as space allows)
- Add to cart (requires authentication; otherwise redirect to login)

Do not show a favorite/wishlist control in MVP.

Cards must not load master or working-preview URLs.

---

# 7. Image Details

Display:

- Large watermarked preview (`public/previews/{assetId}/preview.webp`)
- Title
- Description
- Resolution / dimensions (from master metadata)
- Format
- Category
- Tags
- License selector (from active `AssetLicense` rows, not hard-coded)
- Display price for the selected license
- Add to cart
- Buy Now

Never expose the master file URL or storage key.

---

# 8. License Selection

The selector lists active licenses attached to the asset.

MVP seeds STANDARD. If additional licenses exist in the database, they appear automatically.

The displayed price updates from `AssetLicense.pricePaise`. That value is display-only.

---

# 9. Add to Cart

Requires an authenticated CUSTOMER.

Customer selects Asset + License, then adds to cart.

Server:

- Validates `PUBLISHED` + `READY`
- Validates active `AssetLicense`
- Upserts `CartItem` for `(userId, assetId, licenseId)`
- Stores `quotedPricePaise` as a display snapshot

The same asset/license cannot appear twice for one user.

---

# 10. Cart

Display:

- Thumbnail
- Asset title
- License name
- Display price (revalidated from the database when the cart is loaded)
- Remove
- Subtotal, tax, total as estimates

Revalidate live `AssetLicense` prices before checkout. If a price changed, tell the customer and use the server price. Never charge a browser-submitted amount.

---

# 11. Buy Now

Requires an authenticated CUSTOMER.

Buy Now uses the same `CheckoutService` as cart checkout with a single in-memory `(assetId, licenseId)` item. It does not depend on persisting that line in the cart.

---

# 12. Checkout

Requires authentication.

Display:

- Customer identity (from session)
- Order summary (title, license, server unit price)
- Tax (from configurable `TaxRate`, snapshotted)
- Final amount in INR
- Pay with Razorpay

Flow:

1. Load asset/license from the database.
2. Validate availability.
3. Calculate amounts on the server.
4. Create `Order` `PENDING_PAYMENT` with immutable `OrderItem` snapshots.
5. Create Razorpay order for `totalPaise`.
6. Customer pays.
7. Server verifies signature and amount.
8. Webhook reconciles; `Payment` `CAPTURED`; `Order` `PAID`.

---

# 13. Payment

```text
Checkout
→ Razorpay Checkout
→ Client returns payment ids (untrusted)
→ Server verifies signature, amount, currency, order id
→ Webhook reconciliation (idempotent)
→ Order confirmation
```

On failure: show a safe error. Leave the order `FAILED` or `PENDING_PAYMENT` as appropriate. Do not entitle downloads.

---

# 14. Purchase Confirmation

Display:

- Order number
- Purchased assets (snapshot titles)
- License names (snapshot)
- Amount paid
- Download action per entitled line

---

# 15. My Purchases

Customer can see:

- Purchased assets (snapshots)
- Purchase date
- License
- Download availability

Unpublished or archived assets still appear here and remain downloadable.

---

# 16. Download

Customer clicks download.

```text
Authenticate
→ Identify asset from OrderItem
→ Verify the order belongs to this customer
→ Verify Order PAID and Payment CAPTURED
→ Verify license on the line
→ Verify master AssetFile exists
→ Signed R2 URL, TTL 300 seconds
→ Insert Download row
→ Return temporary URL
```

The browser then fetches the master through that URL. The page never embeds a permanent master link.

---

# 17. Customer Account

MVP sections:

- Profile
- Orders
- Purchases / downloads

Out of MVP: wishlist, saved collections.

---

# 18. Error States

Show clear, non-technical errors for:

- Image unavailable (not published, not ready, or archived)
- Price changed at checkout
- Payment failure
- Login failure
- Download failure
- Network failure
- Cart failure (unauthenticated, duplicate handled by upsert, inactive license)

---

# 19. Future Customer Features

Wishlist, collections, reviews, coupons, subscriptions, credits, visual search.
