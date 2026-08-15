# Bommastock — Security Specification

## 1. Security Objective

Protect:

- Master images
- Customer accounts
- Admin accounts
- Payments
- Orders
- Download access
- Personal information

---

# 2. Authentication

All protected areas require authentication.

Admin routes require ADMIN authorization.

Customer purchase routes require authenticated customers.

---

# 3. Authorization

Authentication answers:

"Who is the user?"

Authorization answers:

"What is this user allowed to do?"

Never rely only on frontend route protection.

Server-side authorization is mandatory.

---

# 4. Master Image Protection

Master files must remain private.

Do not expose:

- Bucket URLs
- Storage credentials
- Master storage keys
- Permanent download URLs

---

# 5. Signed Downloads

When a customer requests a download:

1. Authenticate.
2. Find purchase.
3. Verify ownership.
4. Verify payment.
5. Generate temporary signed URL.
6. Return URL.
7. Record download.

Signed URL should expire.

---

# 6. Payment Security

Never trust:

- Frontend payment status
- Frontend price
- Frontend order status

Server must:

- Calculate price
- Create payment order
- Verify payment
- Validate amount
- Validate currency
- Validate order
- Record payment

---

# 7. Admin Security

Admin routes must be protected.

Admin actions should include:

- Upload
- Delete
- Publish
- Unpublish
- Edit price
- Manage users
- Manage orders

These actions must be authorized server-side.

---

# 8. Upload Security

Validate:

- File extension
- MIME type
- File signature where practical
- File size
- Image dimensions

Do not execute uploaded files.

Uploaded filenames must never become executable paths.

---

# 9. Input Validation

Validate all:

- API inputs
- Form inputs
- Query parameters
- IDs
- Prices
- Pagination
- Filters

Use schema validation.

Recommended:

Zod

---

# 10. Secrets

Never store secrets in:

- frontend code
- Git
- database
- public environment variables

Use environment variables.

---

# 11. Rate Limiting

Consider rate limiting for:

- Login
- Search
- Download requests
- Payment endpoints
- Admin APIs
- Upload APIs

---

# 12. Logging

Log important security events:

- Login
- Failed login
- Admin actions
- Upload
- Publish
- Payment verification
- Download

Never log:

- Passwords
- API secrets
- Payment secrets
- Full private URLs

---

# 13. Data Protection

Only collect data required for the product.

Provide appropriate privacy and data-management policies before production launch.

---

# 14. Security Principle

Assume that every client-side request can be manipulated.

All critical decisions must happen server-side.