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

## Data Query Rules — READ BEFORE RUNNING SQL

- **NEVER trust aggregated stock from multi-join queries.** Joining `item_stock` with `sale`, `item_price`, or other 1:N tables and using `SUM(st.quantity)` multiplies stock by the number of joined rows. Incident 2026-04-15: reported Pop 3R as 10 units when real was 2 — led to wrong restock advice.
- **Authoritative stock query:** `SELECT "warehouseId", quantity, "inTransit" FROM core.item_stock WHERE "itemId" = X;` — one row per warehouse, raw numbers.
- **Cross-check stock** by running the simple query above before quoting any number. If an aggregated query gives a different total, the aggregated one is wrong.
- **Show the source** when quoting numbers. Say where the data came from so the user can verify.
- **Flag uncertainty** when a number looks suspicious instead of building confident advice on it.

## Business Context (GLOBAL AUTHENTICS TZ — business_id=1)

- Two tenants in DB: GLOBAL AUTHENTICS TZ (active, wearables/audio retail) and PRIME ROOT (id=2, supplements, no sales yet)
- Walk-in customer placeholder: customer name `WALK IN KARIAKOO` — exclude from retention/customer analytics (already filtered in `/reports/retention`)
- Top brands by revenue (lifetime): Samsung (10.8M), Amazfit (3.6M), Xiaomi/Redmi (3.5M), Nothing (3.1M), Pixel (2.7M)
- Buyer profile: classic/rugged Samsung watches sell best (Watch 6 Classic, Ultra). Apple Watch and HAINO TEKO/Firebolt do NOT sell — stop reordering these. Naviforce sells slowly at clearance prices (60K) — clear the pile that arrived but do NOT reorder.
- USED premium watches command higher avg ticket (360K) than NEW (250K) — refurb-premium is the sweet spot
- Repeat rate ~9.6% (target 25%); 60% of inventory cost trapped in slow movers (>90 days idle)
- Naviforce 30-unit shipment arrived (received around 2026-04-25). PROD-080 currently 28 on-hand at 60K each — first 2 units sold the same day they were stocked. Treat as **liquidation only** (not in the reorder pipeline) — clearing the pile at 60K is ~1.68M latent revenue worth chasing, but do NOT restock.

## Open Purchase Order Plan (last reviewed 2026-04-08)

### FINAL 4M ORDER — 15 units, ~3.91M (with real supplier prices)

| Item | Qty | Source | Landed/unit (TZS) | Total |
|---|---|---|---|---|
| Google Pixel Watch 2 USED (eBay UK refurb, £79) | 4 | eBay UK | 269K | 1,076K |
| Mi Band 10 (Amazon UAE, 132 AED) | 4 | Amazon UAE | ~121K | ~484K |
| Samsung Watch 6 Classic (eBay US, $99.99 + $24/2 ship) | 2 | eBay US | ~283K | ~567K |
| Samsung Watch 8 Classic 46mm NEW SKU (Amazon UAE, 902 AED + 25 AED ship) | 1 | Amazon UAE | ~640K | ~640K |
| Amazfit Active Max (Amazon UAE, 608 AED) | 1 | Amazon UAE | ~428K | ~428K |
| Huawei Fit 4 Pro (Amazon UAE, 536 AED) | 1 | Amazon UAE | ~378K | ~378K |
| Samsung Watch 4 Classic 42mm Refurbished (eBay US, $54 + $12) | 2 | eBay US | ~167K | ~334K |
| **TOTAL** | **15** | | | **~3,907K** |
| **Reserve** | | | | ~93K |

### Sourcing rules learned this session
- **Amazon UAE wins** for: Mi Band, Amazfit, Huawei, new Samsung NEW (cheaper than Alibaba at small MOQs)
- **eBay UK wins** for: Pixel refurbished, Samsung Classic refurbished (best refurb supply)
- **eBay US wins** for: Samsung refurbished if shipping is bundled cheaply
- **Always require**: Top Rated Seller, 99%+ feedback, "Refurbished — Excellent" condition, returns accepted
- **Never buy**: "spares or repairs", unknown sellers, anything claiming Apple at 30% retail
- For all eBay refurbished: confirm activation lock removed before paying

### Margin reality (from this session)
- Jiji.co.tz is NOT the real TZ market — most actual selling happens on Instagram DMs
- Don't price-audit using Jiji alone, prices there are ~30-50% above real Instagram market
- User's existing prices are reasonable; ~58% ROI projected on this 4M order at current sell prices (not 114% I initially claimed using Jiji data)

### Do NOT reorder
Apple Watch line, HAINO TEKO line, NAVIFORCE (PROD-080 — shipment arrived 2026-04-25, 28 on-hand; sell through at 60K, do NOT restock), Firebolt, Hummer Pulse, Noise Vortex, Fast Track. Supplements are PRIME ROOT (business_id=2), not Global Authentics.

### Brand preferences confirmed
- Buyer wants **Classic and Rugged** Samsung (not FE, not regular Watch 6)
- Pixel **USED** sells, Pixel **NEW** does not (Pixel Watch 3 USED PROD-064 already sitting unsold ⚠️)
- Both 42mm and 46mm Watch 4 Classic sell
- Highest historical seller: Samsung Watch 6 Classic line (8 sales, 3.6M)
- 75% gross markup typical, USED items = higher avg ticket (360K) than NEW (250K)

### Top 3 ad picks (point all to click-to-WhatsApp, launch AFTER stock arrives)
1. Google Pixel Watch 2 USED — acquisition, premium hook
2. Mi Band 10 — volume + low-friction first purchase
3. Samsung Watch 8 Classic 46mm — first-mover test on newest model

### Ad budget guidance
- Daily: $9/day across 3 ads ($3/ad/day minimum for Meta optimization)
- Monthly: ~$270 / ~675K TZS (same as historical spend, smarter use)
- Phase 1: 14 days validate. Phase 2: scale winners to $10-15/day. Kill ads <5 conversations after 7 days.
- Mix: 2 click-to-WhatsApp (sales) + 1 brand engagement (followers/profile visits)
- Run all in Swahili — past Swahili boosts performed better than English ones

### 90-day scoreboard
| Metric | Today | 90-day target |
|---|---|---|
| Repeat rate | 9.6% | 20% |
| Monthly revenue | ~3M | 5M+ |
| WhatsApp orders | 0 | 10+/month |
| Slow-mover cash trapped | 13.4M | <8M |
| Ad ROAS | unknown | ≥4x |
