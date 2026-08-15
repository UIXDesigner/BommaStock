# Bommastock — Project Constitution

## 1. Project Overview

Bommastock is a premium digital image marketplace.

The platform allows:

- Administrators to upload high-resolution images.
- Administrators to manage image metadata, pricing, categories and licenses.
- Customers to discover and search images.
- Customers to preview optimized and watermarked versions.
- Customers to add images/licenses to a cart.
- Customers to purchase images.
- Customers to securely download purchased high-resolution files.
- Administrators to manage customers, orders and sales.

The initial version will support a single business/admin account.

The architecture must allow the platform to evolve into a multi-contributor marketplace in the future.

---

# 2. Product Vision

Bommastock should become a modern digital asset marketplace focused initially on:

- Indian cultural imagery
- Hindu devotional artwork
- Digital wall art
- Backgrounds
- Decorative assets
- Festival artwork
- Indian traditional artwork
- Digital illustrations
- AI-generated artwork
- High-resolution printable artwork

The platform should eventually support many types of digital images.

---

# 3. Applications

Bommastock consists of two primary applications.

## 3.1 Customer Storefront

The customer-facing application allows users to:

- Browse images
- Search images
- Filter images
- View image details
- Preview watermarked images
- Select licenses
- Add products to cart
- Checkout
- Make payments
- View purchases
- Download purchased files
- Manage profile
- Manage wishlist

## 3.2 Admin Application

The admin application allows authorized administrators to:

- Manage images
- Upload master images
- Process images
- Manage metadata
- Manage categories
- Manage collections
- Manage pricing
- Manage licenses
- Manage orders
- Manage customers
- Manage downloads
- View sales analytics
- Manage site content

---

# 4. Technology Stack

The preferred technology stack is:

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend

- Next.js server-side functionality
- Server Actions and/or API routes
- TypeScript

## Database

- PostgreSQL
- Prisma ORM

## Storage

- Cloudflare R2

Alternative:

- Amazon S3

## Image Processing

- Sharp

## Authentication

Use a secure authentication solution compatible with Next.js.

Preferred options:

- Auth.js
- Supabase Auth

The final implementation should select one approach and use it consistently.

## Payments

Primary:

- Razorpay

Future:

- Stripe

## Hosting

Preferred:

- Vercel for application
- Cloudflare R2 for image storage
- Cloudflare CDN where appropriate

---

# 5. Architecture Principles

The system must be modular.

Separate:

- Presentation
- Business logic
- Data access
- Storage
- Image processing
- Authentication
- Payments

Do not place business logic directly inside UI components.

Do not duplicate business logic between Admin and Storefront.

Shared business logic should live in reusable packages/services.

---

# 6. Image Security Principle

The original high-resolution master image must NEVER be publicly accessible.

Master files must be stored in private object storage.

Example:

private/masters/{assetId}/original.tiff

Public files may include:

public/thumbnails/{assetId}/thumbnail.webp

public/previews/{assetId}/preview.webp

public/watermarked/{assetId}/watermarked.webp

Customers must never receive a permanent URL to the original master file.

Purchased files must be delivered through authenticated temporary signed URLs.

---

# 7. Automatic Image Processing

When an administrator uploads a master image, the system must automatically:

1. Validate the file.
2. Store the original securely.
3. Read image metadata.
4. Generate thumbnail.
5. Generate optimized preview.
6. Generate watermarked preview.
7. Generate WebP/AVIF derivatives when appropriate.
8. Store derivative files.
9. Save file metadata to PostgreSQL.
10. Mark processing status.
11. Make the product available for publishing.

The administrator should not manually create derivatives.

---

# 8. Supported Image Formats

Initially support:

- JPEG
- PNG
- TIFF
- WebP

Future support may include:

- AVIF
- PSD
- RAW formats
- SVG where appropriate

The system must validate:

- MIME type
- File extension
- File size
- Image dimensions

---

# 9. Master Image Rules

Master images must:

- Remain private.
- Preserve original quality.
- Preserve original dimensions.
- Not be unnecessarily recompressed.
- Be associated with a product/asset record.
- Be downloadable only after verified purchase.
- Be delivered using temporary signed URLs.

---

# 10. Preview Rules

Public previews should:

- Be optimized for web.
- Be significantly smaller than the master.
- Include Bommastock watermark.
- Prevent direct access to the master.
- Support responsive display.
- Use modern formats when supported.

---

# 11. Database Rules

PostgreSQL is the source of truth for application data.

Do not store large image binaries inside PostgreSQL.

Store:

- Image metadata
- Storage keys
- Product information
- User information
- Orders
- Payments
- Licenses
- Download records

Actual image files belong in object storage.

---

# 12. Payment Security

Never trust payment status received from the client.

Payment status must be verified server-side.

Orders should only become completed after successful server-side payment verification.

Payment secrets must never be exposed to frontend code.

---

# 13. Download Security

Before providing a master download:

1. Authenticate user.
2. Identify requested asset.
3. Verify purchase.
4. Verify payment status.
5. Verify license.
6. Generate temporary signed URL.
7. Log download.
8. Return download URL.

Signed URLs must expire.

---

# 14. UX Principles

Bommastock should feel:

- Premium
- Modern
- Visual
- Fast
- Trustworthy
- Minimal
- Professional

The primary focus is visual discovery.

Images should receive more visual emphasis than text.

---

# 15. Responsive Design

The storefront must support:

- Desktop
- Laptop
- Tablet
- Mobile

The admin application should support:

- Desktop
- Laptop
- Tablet

Mobile admin support is desirable but not mandatory for MVP.

---

# 16. Accessibility

The application should follow WCAG 2.2 principles.

Requirements include:

- Keyboard navigation
- Visible focus states
- Semantic HTML
- Appropriate color contrast
- Accessible form labels
- Accessible error messages
- Alternative text
- Screen-reader support
- Reduced motion support where appropriate

---

# 17. Code Quality

Use:

- TypeScript
- Strong typing
- Reusable components
- Modular architecture
- Clear naming
- Small focused functions
- Consistent error handling

Avoid:

- `any`
- duplicated logic
- giant components
- hard-coded business rules
- hard-coded image URLs
- secrets in source code

---

# 18. Environment Variables

Secrets must be stored in environment variables.

Examples:

DATABASE_URL

R2_ACCOUNT_ID

R2_ACCESS_KEY_ID

R2_SECRET_ACCESS_KEY

R2_BUCKET_NAME

RAZORPAY_KEY_ID

RAZORPAY_KEY_SECRET

AUTH_SECRET

Do not commit `.env` files containing secrets.

---

# 19. Development Method

Do not build the entire application in one step.

Implement the system incrementally.

Each feature should:

1. Understand existing architecture.
2. Review relevant documentation.
3. Identify database requirements.
4. Implement backend.
5. Implement frontend.
6. Connect both.
7. Test.
8. Handle errors.
9. Handle loading states.
10. Handle empty states.
11. Document important changes.

---

# 20. Future Multi-Contributor Architecture

The database should allow future:

- Contributors
- Artist profiles
- Contributor uploads
- Content moderation
- Revenue sharing
- Contributor earnings
- Contributor dashboards

Do not implement the full contributor marketplace in MVP unless explicitly requested.

However, avoid architectural decisions that prevent it.

---

# 21. Source of Truth

The following files are authoritative:

/docs/PRODUCT_REQUIREMENTS.md
/docs/ARCHITECTURE.md
/docs/DATABASE.md
/docs/DESIGN_SYSTEM.md
/docs/IMAGE_PIPELINE.md
/docs/SECURITY.md
/docs/ADMIN_FLOWS.md
/docs/CUSTOMER_FLOWS.md

If implementation conflicts with these documents, review the conflict before changing architecture.

---

# 22. Cursor Development Rule

Before implementing a feature:

- Read AGENTS.md.
- Read the relevant documentation.
- Inspect existing code.
- Reuse existing components/services.
- Do not create duplicate implementations.

After implementation:

- Run type checking.
- Run linting.
- Run tests where available.
- Fix errors before moving to the next feature.

Never claim a feature is complete without verifying the implementation.