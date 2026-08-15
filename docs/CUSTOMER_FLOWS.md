# Bommastock — Customer Flows

# 1. Homepage

Customer opens website.

Display:

- Hero/search
- Featured collections
- Popular images
- New images
- Categories
- Promotional content

Primary action:

Search images.

---

# 2. Search

Customer enters search term.

Example:

Krishna

System searches:

- Title
- Description
- Tags
- Category
- Asset code

Display relevant results.

---

# 3. Category

Customer selects:

Gods

Display:

- Category header
- Subcategories
- Image grid
- Filters
- Sorting

---

# 4. Image Gallery

Each card displays:

- Image
- Watermark where appropriate
- Title
- Price
- Relevant metadata
- Favorite
- Quick action

---

# 5. Image Details

Display:

- Large watermarked preview
- Title
- Description
- Resolution
- Dimensions
- Format
- Category
- Tags
- License options
- Price
- Add to cart
- Buy now

Never expose master file URL.

---

# 6. License Selection

Customer selects license.

Example:

Standard
Commercial
Extended

Price updates based on selected license.

---

# 7. Add to Cart

Customer selects:

Asset
+
License

Then adds to cart.

Cart must validate availability and price.

---

# 8. Cart

Display:

- Image thumbnail
- Asset title
- License
- Price
- Remove
- Total

Revalidate price before checkout.

---

# 9. Checkout

Display:

- Customer information
- Order summary
- License
- Price
- Tax if applicable
- Final amount
- Payment action

---

# 10. Payment

Customer:

Checkout
↓
Payment Gateway
↓
Payment
↓
Server verification
↓
Order confirmation

---

# 11. Purchase Confirmation

Display:

- Order number
- Purchased assets
- License
- Amount
- Download button

---

# 12. My Purchases

Customer can see:

- Purchased assets
- Purchase date
- License
- Download availability

---

# 13. Download

Customer clicks download.

System:

Authenticate
↓
Verify purchase
↓
Verify payment
↓
Generate signed URL
↓
Download

---

# 14. Wishlist

Future feature.

Customer can:

- Add image
- Remove image
- View wishlist

---

# 15. Customer Account

Sections:

- Profile
- Orders
- Purchases
- Downloads
- Wishlist
- Saved collections

---

# 16. Error States

Customer should see clear errors for:

- Image unavailable
- Payment failure
- Login failure
- Download failure
- Network failure
- Cart failure

Do not expose technical errors.