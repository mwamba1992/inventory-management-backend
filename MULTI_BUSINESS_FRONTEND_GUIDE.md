# Multi-Business Isolation - Frontend Integration Guide

## What Changed

The backend now supports **multi-business (multi-tenant) data isolation**. Every piece of data (items, sales, customers, warehouses, expenses, reports, etc.) is now scoped to a specific business. When a user logs in, their JWT token carries a `businessId`, and all API responses are automatically filtered to only return data belonging to that user's business.

### Current Businesses

| ID | Business Name | Admin User |
|----|--------------|------------|
| 1 | GLOBAL AUTHENTICS TZ | joel.gaitan |
| 2 | PRIME ROOT | catherine.msungu |

---

## Admin Dashboard (`business.mwendavano.com`)

### JWT Token Changes

The admin login response (`POST /auth/login`) now returns a JWT token containing:

```json
{
  "sub": 1,
  "username": "JOEL MSUNGU",
  "businessId": 1,
  "permissions": [...]
}
```

**New field: `businessId`** - You can decode the JWT to display the business name in the UI.

### Breaking Changes

#### 1. Remove `businessId` from Create Item request

**Before:**
```json
POST /items
{
  "name": "Product ABC",
  "code": "P001",
  "businessId": 1,        // <-- REMOVE THIS
  "purchaseAmountId": 100,
  "freightAmountId": 10,
  "profitMargin": 30,
  "sellingPriceId": 150,
  ...
}
```

**After:**
```json
POST /items
{
  "name": "Product ABC",
  "code": "P001",
  "purchaseAmountId": 100,
  "freightAmountId": 10,
  "profitMargin": 30,
  "sellingPriceId": 150,
  ...
}
```

The `businessId` is now automatically set from the authenticated user's JWT token. **Do not send it in the request body.**

#### 2. Remove `businessId` from Report filters

**Before:**
```
GET /reports/business-overview?dateRange=last_30_days&businessId=1
```

**After:**
```
GET /reports/business-overview?dateRange=last_30_days
```

The `businessId` parameter has been removed from `ReportFilterDto`. Reports are automatically scoped to the logged-in user's business.

### No Other Changes Needed for Admin Dashboard

All other endpoints work exactly the same - just remove `businessId` from the two places above. The backend automatically filters all data by the logged-in user's business:

- `GET /items` - Returns only items for the user's business
- `GET /sales` - Returns only sales for the user's business
- `GET /customers` - Returns only customers for the user's business
- `GET /warehouses` - Returns only warehouses for the user's business
- `GET /brands` - Returns only brands for the user's business
- `GET /expenses` - Returns only expenses for the user's business
- All report endpoints - Automatically scoped
- All CRUD operations - Automatically scoped

**No query parameters or request body changes needed for any of these.**

---

## Customer Storefront (`store.mwendavano.com`)

### Important: Business Identification

The storefront needs to tell the backend **which business** a customer belongs to. This is required because customer auth endpoints (`register`, `login`, `set-password`) are public (no JWT token), so the backend can't determine the business automatically.

### Option A: Add `businessId` to Request Body (Recommended)

Add `businessId` to the customer registration and login request bodies:

#### Register

```json
POST /customer-auth/register
{
  "name": "John Doe",
  "phone": "255712345678",
  "password": "mypassword",
  "email": "john@example.com",
  "city": "Dar es Salaam",
  "region": "Kinondoni",
  "businessId": 1              // <-- ADD THIS
}
```

#### Login

```json
POST /customer-auth/login
{
  "phone": "255712345678",
  "password": "mypassword",
  "businessId": 1              // <-- ADD THIS
}
```

#### Set Password

```json
POST /customer-auth/set-password
{
  "phone": "255712345678",
  "password": "mypassword",
  "businessId": 1              // <-- ADD THIS
}
```

### Option B: Hardcode in Frontend Config

If each storefront deployment serves only one business, you can store the `businessId` in your frontend environment config:

```env
# .env (frontend)
NEXT_PUBLIC_BUSINESS_ID=1
```

Then include it in every customer auth request automatically.

### E-Commerce Order Creation

If the storefront creates orders via the e-commerce endpoint, include `businessId`:

```json
POST /whatsapp/ecommerce-order
{
  "customerName": "John Doe",
  "customerPhone": "255712345678",
  "warehouseId": 1,
  "deliveryAddress": "House 123, Kinondoni",
  "items": [...],
  "businessId": 1              // <-- ADD THIS
}
```

### Customer JWT Token

After login/register, the customer JWT token now includes `businessId`:

```json
{
  "sub": 83,
  "phone": "255712345678",
  "name": "John Doe",
  "type": "customer",
  "businessId": 1
}
```

Authenticated customer endpoints (`GET /customer-auth/me`, `GET /customer-auth/orders`, etc.) will automatically use the `businessId` from the token.

---

## Summary of Frontend Changes

### Admin Dashboard - Changes Required

| Action | Endpoint | What to Change |
|--------|----------|---------------|
| Remove field | `POST /items` | Remove `businessId` from request body |
| Remove field | `GET /reports/*` | Remove `businessId` from query params |
| Optional | Login response | Decode JWT to show business name in header |

### Customer Storefront - Changes Required

| Action | Endpoint | What to Change |
|--------|----------|---------------|
| Add field | `POST /customer-auth/register` | Add `businessId` to request body |
| Add field | `POST /customer-auth/login` | Add `businessId` to request body |
| Add field | `POST /customer-auth/set-password` | Add `businessId` to request body |
| Add field | `POST /whatsapp/ecommerce-order` | Add `businessId` to request body |

### No Changes Needed

All other authenticated endpoints (items list, sales, warehouses, brands, categories, reports, etc.) are **automatically scoped** by the JWT token. No changes needed.

---

## Testing

1. Login as `joel.gaitan` (password unchanged) - should see only GLOBAL AUTHENTICS data
2. Login as `catherine.msungu` (password: `Trat@1234*`) - should see empty dashboard (PRIME ROOT has no data yet)
3. Create an item while logged in as catherine - verify it does NOT appear when logged in as joel
4. Customer register with `businessId: 1` - customer should only be visible in GLOBAL AUTHENTICS
5. Customer register with `businessId: 2` - customer should only be visible in PRIME ROOT

## API Docs

Full Swagger documentation is available at: `/api-docs`
