# Bommastock — Admin Flows

# 1. Admin Login

Admin
↓
Login
↓
Authentication
↓
Authorization
↓
Admin Dashboard

Invalid credentials:

Display safe error.

---

# 2. Admin Dashboard

Dashboard should show:

- Total assets
- Published assets
- Draft assets
- Processing assets
- Failed processing
- Orders
- Revenue
- Customers
- Downloads

---

# 3. Upload Asset

Admin
↓
Images
↓
Upload
↓
Select master file
↓
Upload
↓
Validation
↓
Processing

---

# 4. Image Processing

After upload:

Processing
↓
Extract metadata
↓
Generate thumbnail
↓
Generate preview
↓
Generate watermark
↓
Optimize
↓
Save derivatives
↓
Ready

Display progress/status.

---

# 5. Asset Editing

Admin can edit:

- Title
- Description
- Category
- Subcategory
- Tags
- Price
- License
- Status

Master file should not be replaced without explicit action.

---

# 6. Publishing

Admin
↓
Review
↓
Preview
↓
Validate required metadata
↓
Publish

Required:

- Title
- Category
- Preview
- Price
- License
- Master file
- At least one tag

---

# 7. Unpublish

Admin can unpublish an asset.

Unpublished products:

- Do not appear in public search.
- Do not appear in public categories.
- Existing purchases remain valid.

---

# 8. Archive

Archived assets:

- Are hidden from public marketplace.
- Remain available for historical orders.
- Must not break existing downloads.

---

# 9. Category Management

Admin can:

- Create category
- Edit category
- Create subcategory
- Reorder
- Activate/deactivate

Do not delete categories that contain assets without handling relationships.

---

# 10. Order Management

Admin can view:

- Order number
- Customer
- Items
- Amount
- Payment status
- Order status
- Date

---

# 11. Customer Management

Admin can view:

- Name
- Email
- Registration date
- Purchase count
- Total spend
- Account status

Avoid exposing unnecessary personal information.

---

# 12. Processing Failure

If image processing fails:

Display:

- Asset
- Failure status
- Error category
- Retry action

Admin can retry processing.

---

# 13. Bulk Operations

Future:

- Bulk publish
- Bulk unpublish
- Bulk category assignment
- Bulk tag assignment
- Bulk pricing