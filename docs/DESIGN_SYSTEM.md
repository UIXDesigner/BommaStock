# Bommastock — Design System

## 1. Design Direction

Bommastock should feel:

- Premium
- Modern
- Elegant
- Visual
- Minimal
- Trustworthy

The interface should allow images to remain the primary visual focus.

---

# 2. Brand Colors

Primary brand colors will be defined separately after final brand exploration.

Neutral foundation:

- Black
- White
- Gray scale

Use neutral colors extensively so image content remains dominant.

---

# 3. Typography

Use a modern sans-serif typeface.

Preferred initial font:

Inter

Typography should support:

- Strong visual hierarchy
- High readability
- Clear pricing
- Clear metadata
- Accessible text sizing

---

# 4. Spacing

Use a consistent spacing scale.

Recommended base:

4px

Examples:

4
8
12
16
24
32
40
48
64
80
96

---

# 5. Border Radius

Use moderate rounded corners.

Cards:

12–16px

Buttons:

8–12px

Inputs:

8–12px

Avoid excessive rounding.

---

# 6. Image Cards

Image cards should prioritize:

1. Image
2. Title
3. Metadata
4. Price
5. Actions

Hover states may include:

- Quick preview
- Favorite
- Add to cart

---

# 7. Product Detail

Product detail page should provide:

- Large preview
- Watermark
- Title
- Description
- Resolution
- Format
- Category
- Tags
- License
- Price
- Add to cart
- Buy now

---

# 8. Buttons

Primary actions:

- Add to Cart
- Buy Now
- Upload
- Publish
- Save

Secondary:

- Cancel
- Edit
- Preview

Destructive:

- Delete
- Unpublish
- Archive

---

# 9. Forms

All forms must have:

- Label
- Input
- Helper text where needed
- Validation
- Error state
- Success state

---

# 10. Loading

Use skeleton loaders for:

- Image grids
- Product details
- Tables

Use progress indicators for:

- File uploads
- Image processing

---

# 11. Empty States

Every major data view must have a meaningful empty state.

Example:

No images found.

Provide an appropriate action where possible.

---

# 12. Accessibility

Follow WCAG 2.2 principles.

Requirements:

- Keyboard accessible
- Focus indicators
- Contrast
- Semantic structure
- Accessible labels
- Screen reader support

---

# 13. Responsive Grid

Desktop storefront:

Use responsive CSS grid.

Example:

Large desktop:
4–6 image cards per row.

Tablet:
3–4.

Mobile:
2.

The exact layout should adapt based on available width rather than fixed screen assumptions.

---

# 14. Component Strategy

Create reusable components.

Examples:

ImageCard
ImageGrid
SearchBar
FilterPanel
PriceDisplay
LicenseSelector
CartItem
ProductMetadata
UploadDropzone
ImageProcessingStatus
DataTable
Modal
Toast