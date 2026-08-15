# Bommastock — System Architecture

## 1. Architecture Overview

Bommastock uses a modular full-stack architecture.

Customer Storefront
and
Admin Application

share:

- Database
- Authentication
- Business logic
- Types
- UI primitives
- Storage services

---

# 2. High-Level Architecture

Customer
    ↓
Next.js Storefront
    ↓
Application Services
    ↓
PostgreSQL

Admin
    ↓
Next.js Admin
    ↓
Application Services
    ↓
PostgreSQL

Image Upload
    ↓
Private Object Storage
    ↓
Image Processing
    ↓
Public Derivatives/CDN

Payment
    ↓
Payment Gateway
    ↓
Server Verification
    ↓
Order