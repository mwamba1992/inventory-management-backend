# Inventory Management Backend

## Overview

NestJS (v11) + TypeScript backend for inventory management with WhatsApp commerce integration, multi-warehouse support, and dual authentication (admin/customer).

## Tech Stack

- **Runtime:** Node.js
- **Framework:** NestJS 11 (Express platform)
- **Language:** TypeScript (ES2021 target, CommonJS modules)
- **Database:** PostgreSQL (host: 84.247.178.93, db: inventorydb, schema: core)
- **ORM:** TypeORM (synchronize: true — auto-creates tables from entities)
- **Auth:** JWT (passport-jwt) + bcrypt password hashing
- **Image uploads:** Cloudinary (auto-resize 800x800, WebP conversion)
- **Messaging:** WhatsApp Cloud API
- **Docs:** Swagger at /api-docs
- **Scheduling:** @nestjs/schedule (cron jobs for abandoned carts)

## Commands

- `npm run start` — Start in development
- `npm run start:dev` — Start in watch mode
- `npm run start:prod` — Start in production
- `npm run build` — Compile TypeScript
- `npm run test` — Run unit tests (Jest)
- `npm run test:e2e` — Run e2e tests
- `npm run test:cov` — Test coverage

## Project Structure

```
src/
├── auth/                    # Admin JWT auth, guards, roles, permissions
│   ├── auth.guard.ts        # Global AuthGuard (JWT, checks @Public())
│   ├── permission/          # Permission entity & CRUD
│   ├── role/                # Role entity & CRUD (many-to-many with permissions)
│   └── user/                # Admin User entity & CRUD
├── customer-auth/           # Separate customer auth (register, login, profile, orders)
│   └── customer-auth.guard.ts  # CustomerAuthGuard (validates token type='customer')
├── database/seeds/          # Database seeding scripts
├── expense/                 # Business expense tracking (CRUD)
├── items/item/              # Core inventory module
│   ├── entities/            # Item, ItemPrice, ItemStock, ItemStockDistribution, ItemAccountMapping
│   ├── services/            # CloudinaryService for image uploads
│   ├── item.controller.ts   # Items CRUD + image upload endpoints
│   ├── item-price.controller.ts
│   ├── item-stock.controller.ts
│   └── item-stock-distribution.controller.ts
├── reports/                 # Business analytics (overview, inventory, financial, balance sheet)
├── sale/                    # Sales transactions + analytics
├── settings/                # Configuration modules
│   ├── brand/               # Product brands
│   ├── business/            # Business profile
│   ├── color-category/      # Color variants (name, hexCode)
│   ├── common/              # Categories & subcategories (self-referencing hierarchy)
│   ├── customer/            # Customer records
│   ├── item-suppliers/      # Supplier management
│   ├── tax/                 # Tax configuration
│   ├── users/               # System users
│   └── warehouse/           # Warehouse/location management
├── transaction/             # Inventory transactions (purchase, sale, return, adjustment)
├── utils/                   # Shared utilities, constants, decorators (@Public)
├── whatsapp/                # WhatsApp bot + e-commerce orders
│   ├── entities/            # WhatsAppOrder, WhatsAppOrderItem, WhatsAppSession
│   └── services/            # WhatsAppAPI, MessageHandler, Session, Order, AbandonedCart
├── app.module.ts            # Root module
└── main.ts                  # Bootstrap (port from env, CORS, Swagger setup)
```

## Entity Relationships

```
Business ──1:N──> Item
Item ──N:1──> Common (category)
Item ──N:1──> Common (subcategory)
Item ──N:1──> Warehouse
Item ──N:1──> ItemSupplier
Item ──N:1──> Brand
Item ──1:N──> ItemPrice (price history, isActive flag)
Item ──1:N──> ItemStock (per-warehouse stock)
Item ──1:N──> InventoryTransaction
Item ──1:N──> ItemAccountMapping

ItemStock ──N:1──> Warehouse
ItemStock ──1:N──> ItemStockDistribution ──N:1──> ColorCategory

Common (category) ──1:N──> Common (subcategory)  [self-referencing]

Customer ──1:N──> Sale
Customer ──1:N──> WhatsAppOrder
Sale ──N:1──> Item, Customer, Warehouse
WhatsAppOrder ──1:N──> WhatsAppOrderItem ──N:1──> Item

User (admin) ──N:N──> Role ──N:N──> Permission
```

## Authentication

### Admin Auth
- **Guard:** `AuthGuard` (global, JWT-based)
- **Login:** POST /auth/login
- **Token expiry:** Access 6000s, Refresh 7d
- **Bypass:** Use `@Public()` decorator on routes
- **Password:** bcrypt (4 salt rounds)
- **RBAC:** User → Roles → Permissions

### Customer Auth
- **Guard:** `CustomerAuthGuard`
- **Token type:** `customer` in JWT payload (30-day expiry)
- **Password:** bcrypt (10 salt rounds)
- **Supports:** Guest checkout → account conversion via set-password

## Key API Routes

| Route Prefix | Description |
|---|---|
| POST /auth/login | Admin login |
| /customer-auth/* | Customer register, login, profile, orders |
| /items | Products CRUD + image upload |
| /items/item-prices | Price management |
| /items/item-stocks | Stock management (available, low-stock, actual-value) |
| /items/item-stock-distributions | Color variant stock |
| /sales | Sales CRUD + analytics (top-products, metrics, weekly trends) |
| /whatsapp/webhook | WhatsApp bot webhook (GET verify, POST messages) |
| /whatsapp/ecommerce-order | E-commerce order creation |
| /whatsapp/orders | Order management |
| /reports/* | business-overview, inventory, customers, financial, balance-sheet |
| /warehouses | Warehouse CRUD |
| /brands | Brand CRUD |
| /color-categories | Color category CRUD |
| /item-suppliers | Supplier CRUD |
| /customers | Customer CRUD |
| /taxes | Tax CRUD |
| /common | Category/subcategory CRUD |
| /accounts | Chart of accounts CRUD |
| /expenses | Expense CRUD |
| /transactions | Inventory transaction CRUD |

## CORS

Allowed origins:
- https://store.mwendavano.com
- https://business.mwendavano.com
- http://localhost:3000, :3001, :5173

## Architecture Patterns

- **Modular:** Each feature is a separate NestJS module with its own controller/service/entity
- **forwardRef():** Used between SaleModule and WhatsAppModule to avoid circular dependencies
- **BaseEntity:** Shared base with soft deletes, timestamps, UUID IDs
- **DTOs:** class-validator + class-transformer for request validation
- **Request-scoped:** UserContextService carries authenticated user per request
- **Cron jobs:** AbandonedCartService runs scheduled cart reminders

## WhatsApp Bot

State machine-based conversational commerce:
- States: main_menu, browsing_categories, viewing_products, viewing_cart, checkout, tracking_order, rating_order, etc.
- Features: browse by category, search by code, add to cart, checkout, order tracking, ratings/feedback, reorder from history
- Session entity tracks phone number, state, and context (JSON cart data)
- Abandoned cart reminders via scheduled cron job
- Admin notifications on new orders

## Environment Variables

Key env vars (in .env):
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SCHEMA`
- `JWT_SECRET`, `JWT_REFRESH_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `ADMIN_PHONE_NUMBER`
- `PORT` (default 3000)
- `NODE_ENV`

## Notes

- TypeORM synchronize is ON — entity changes auto-apply to DB (not safe for production migrations)
- No custom middleware or pipes detected; validation uses NestJS built-in ValidationPipe
- Swagger auto-generated from decorators with persistent authorization
