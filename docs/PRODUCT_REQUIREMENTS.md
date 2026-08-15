# Bommastock — Product Requirements Document

Version: Phase 0.2 (locked)

---

# 1. Product Name

Bommastock

---

# 2. Product Type

Digital image marketplace.

---

# 3. Product Vision

Bommastock is a platform where customers discover, purchase, and download high-quality digital images and artwork.

The experience should feel premium and visual, similar in concept to established stock-image marketplaces, while initially focusing on unique Indian artwork and digital assets.

---

# 4. Target Users

## 4.1 Customers

Customers may include graphic designers, interior designers, printers, marketing and advertising agencies, content creators, businesses, religious organizations, publishers, social media creators, and individual consumers.

## 4.2 Administrators

Administrators manage assets, categories, tags, licenses, pricing, orders, customers, downloads, and processing.

Administrators are provisioned. There is no public admin registration.

## 4.3 Future Contributors

Out of MVP. Future users may upload images, submit assets, track sales, receive revenue share, and manage contributor profiles.

---

# 5. Core Customer Journey

Home
→ Search / Browse / Category
→ Image Gallery
→ Image Details
→ Select License
→ Add to Cart or Buy Now
→ Checkout (authenticated)
→ Razorpay Payment
→ Server verification
→ Purchase Confirmation
→ My Purchases
→ Secure Download

---

# 6. Core Admin Journey

Login
→ Dashboard
→ Upload master
→ Validate
→ Asynchronous processing
→ Add metadata, category, tags
→ Attach license and price
→ Review watermarked preview
→ Publish (only if processing is READY)

---

# 7. MVP Features

## 7.1 Customer

- Homepage (search, categories, newly published images)
- Image gallery
- Categories and subcategories
- Search (title, description, tags, category, asset code)
- Filters (category, orientation, sort by newest)
- Image detail page
- Thumbnail and watermarked preview
- License selection
- License-based price display
- Add to cart
- Buy Now
- Customer registration and login (email and password)
- Change password and forgot password
- Account / profile (`name`; email change not MVP)
- Razorpay checkout
- Purchase history
- Secure master download

Cart and checkout: guest cart is allowed; checkout requires an authenticated customer. Browsing and search do not. Guest cart merges on login.

## 7.2 Admin

- Admin login
- Dashboard counts
- Image upload
- Automatic asynchronous processing
- Processing status
- Failed processing retry
- Metadata management
- Category / subcategory tree
- Tags
- License management
- License-based pricing
- Publish / unpublish (return to draft) / archive
- Order management
- Customer management
- Download records
- Audit log

---

# 8. Future Scope

Do not implement in MVP:

- Contributor marketplace, accounts, uploads, moderation, earnings, payouts
- Coupons
- Wishlist
- Reviews
- Subscriptions
- Credits
- Image bundles
- AI tagging and AI descriptions
- Similar image search, visual search, color search
- Elasticsearch / OpenSearch / Algolia
- Advanced analytics product
- Public API
- Mobile applications
- Stripe
- Advanced CMS / collections product
- Bulk admin operations

---

# 9. Image Product

Every marketplace image is an Asset.

Each asset has:

- Unique asset ID
- Unique image code `BS-YYYYMMDD-XXXXXX` (immutable after creation)
- URL slug generated from title (unique; admin may change)
- Title (placeholder `Untitled Asset` until metadata is supplied)
- Category (tree; subcategory is a child category)
- Tags
- One or more licenses with prices (`AssetLicense`)
- Dimensions, orientation, format, file size (from the master)
- Thumbnail, watermarked preview, working preview, master (as `AssetFile` rows)
- `processingStatus`
- `productStatus`
- Created and updated timestamps

---

# 10. Status Model

Processing and publishing are independent.

## 10.1 processingStatus

- `UPLOADED` — master stored, job not finished
- `PROCESSING` — worker running
- `READY` — derivatives stored successfully
- `FAILED` — processing failed; master retained; retry allowed

## 10.2 productStatus

- `DRAFT` — not in storefront discovery (includes unpublished)
- `PUBLISHED` — visible in storefront discovery
- `ARCHIVED` — hidden from storefront; retained for history

Rules:

- New assets always start as `DRAFT` + `UPLOADED`.
- Admin can publish only when `processingStatus = READY`.
- Publishing sets `productStatus = PUBLISHED`.
- Unpublishing returns `productStatus` to `DRAFT`.
- Archive sets `productStatus = ARCHIVED`.
- Storefront discovery shows only `PUBLISHED` + `READY`.
- Existing purchases and downloads remain valid after unpublish or archive.

---

# 11. Pricing

MVP uses license-based pricing.

- Seed license: `STANDARD`.
- An asset may have one or more `AssetLicense` rows.
- Exactly one default active license per published asset (`isDefault`).
- Add to cart without an explicit license uses the default license.
- Price is stored as integer paise (`pricePaise`) with `currency = INR`.
- Catalog prices are **GST-inclusive**.
- UI components must not hard-code prices or license lists.
- The customer-facing price is a display value.
- At checkout, if the live price differs from the cart quote, return `PRICE_CHANGED` and require confirmation. Never charge silently.
- The server calculates the authoritative checkout amount from the database.
- The catalog service supplies gallery-card prices (default `AssetLicense`).
- `OrderItem` stores an immutable snapshot: before-tax unit price, tax rate, tax amount, inclusive unit price, line total.

Future licenses (data, not new pricing engines): Extended, Editorial, Commercial, Enterprise.

Future pricing models (out of MVP): subscriptions, credits, bundles.

---

# 12. Tax

India-first. Currency: INR.

MVP supports GST as a configurable tax rate stored in the database (`TaxRate`). Exactly one `TaxRate` may be `ACTIVE`.

Catalog prices are GST-inclusive. Orders snapshot extracted tax using integer paise and round-half-up.

Do not hard-code a GST percentage in application code.

Do not build a complete tax engine (place of supply, HSN matrix, GSTIN invoicing) in MVP.

The production GST rate and applicability for digital image sales must be confirmed with the business’s tax/accounting requirements before launch.

---

# 13. Search

MVP search uses PostgreSQL.

Fields: title, description, tags, category, asset code.

Repository/service layer must be replaceable later by a dedicated search engine. Do not add Elasticsearch, OpenSearch, or Algolia in MVP.

---

# 14. Filtering

MVP filters:

- Category (a parent includes descendant categories’ assets)
- Orientation (landscape, portrait, square)
- Sort: newest

Future filters: resolution, file format, price range, license, popularity.

---

# 15. Site Content

Do not build a CMS.

Homepage content is static or application configuration in the storefront. Featured collections are out of MVP.

---

# 16. Success Metrics

Initial operational metrics (dashboard / queries, not a separate analytics product):

- Published assets
- Registered customers
- Revenue
- Average order value
- Orders
- Downloads

Future: product views, add-to-cart rate, conversion funnels, most popular assets.

---

# 17. Business Model

Primary (MVP): individual licensed image sales.

Future: bundles, subscription, credits, contributor marketplace, enterprise licensing, API licensing.
