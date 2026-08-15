# Bommastock — Database Specification

Version: 1.0
Status: Initial Architecture
Database: PostgreSQL
ORM: Prisma
Primary Currency: INR
Primary Market: India

---

# 1. Purpose

This document defines the database architecture for Bommastock.

Bommastock is a digital image marketplace where:

- Administrators upload high-resolution master images.
- The system automatically generates optimized derivatives.
- Customers browse and search images.
- Customers select licenses.
- Customers add assets to a cart.
- Customers make payments.
- Customers receive access to purchased assets.
- Customers securely download high-resolution files.
- Administrators manage assets, customers, orders, payments and sales.

The database must support the current single-admin marketplace and be extensible for a future multi-contributor marketplace.

---

# 2. Database Technology

Use:

PostgreSQL

ORM:

Prisma

Database access must be type-safe.

All schema changes must be made through Prisma migrations.

Do not modify the production database manually unless absolutely necessary.

---

# 3. Database Design Principles

The database must follow these principles:

1. Normalize transactional data.
2. Avoid storing binary image files in PostgreSQL.
3. Store image files in object storage.
4. Store storage keys and metadata in PostgreSQL.
5. Preserve historical order and payment information.
6. Never overwrite historical purchase prices.
7. Use foreign keys for relational integrity.
8. Use unique constraints where appropriate.
9. Add indexes for frequently queried fields.
10. Use timestamps consistently.
11. Prefer soft deletion/archiving for business-critical records.
12. Keep payment records immutable where possible.
13. Keep purchase records immutable after completion.
14. Design for future contributors.
15. Avoid unnecessary premature complexity.

---

# 4. Entity Overview

Core entities:

- User
- Account/Auth Identity
- Asset
- AssetFile
- Category
- Tag
- AssetTag
- Collection
- CollectionItem
- License
- AssetLicense
- Cart
- CartItem
- Order
- OrderItem
- Payment
- Download
- Wishlist
- WishlistItem

Administrative/supporting entities:

- ImageProcessingJob
- AssetView
- AuditLog
- Coupon
- CouponRedemption

Future contributor entities:

- ContributorProfile
- ContributorAsset
- ContributorEarning
- ContributorPayout

---

# 5. Entity Relationship Overview

```text
USER
 │
 ├─────────────── CART
 │                  │
 │                  └── CART_ITEM
 │                          │
 │                          └── ASSET
 │
 ├─────────────── ORDER
 │                  │
 │                  ├── ORDER_ITEM
 │                  │       │
 │                  │       ├── ASSET
 │                  │       └── LICENSE
 │                  │
 │                  └── PAYMENT
 │
 ├─────────────── DOWNLOAD
 │
 ├─────────────── WISHLIST
 │                  │
 │                  └── WISHLIST_ITEM
 │
 └─────────────── AUDIT_LOG


ASSET
 │
 ├── ASSET_FILE
 │
 ├── ASSET_TAG
 │       │
 │       └── TAG
 │
 ├── CATEGORY
 │
 ├── ASSET_LICENSE
 │       │
 │       └── LICENSE
 │
 ├── COLLECTION_ITEM
 │       │
 │       └── COLLECTION
 │
 └── IMAGE_PROCESSING_JOB