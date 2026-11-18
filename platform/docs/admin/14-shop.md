# Admin Panel — Shop / Store Domain

## Purpose
Management of product catalog, orders, and reservations. Handles product creation with variants (size/color), per-location stock, order list with filtering, and 48-hour reservation deadlines. Also efficiency metrics: revenue, conversion, AOV.

## Pages & Features
- **Product Catalog** (`SHOP-ADM-01`)
  - **Layout**: Header + "Create product" → Table with columns: Name, Category, Price, Stock (by variants), Status (badge), Actions (Edit, Delete)
  - **Empty state**: "No products yet."
  - **Product form**: Name, Description, Category, Brand, Photos (upload to `media.fade.com.ua`), Variants (volume/color — separate price and stock per variant)

- **Orders List** (`SHOP-ADM-02/03`)
  - **Layout**: Filters (Status, Period, Self-pickup) → Table with columns: Order, Positions, Customer, Address/Branch, Status, Track number, Actions
  - **Order card**: Positions list, Purchase address/branch, Status timeline, Track number field, Actions: Change status, Add track, Refund (with log)
  - **Statuses**: New → Confirmed → Preparing → Ready → Picked up/Delivered → Refunded
  - **Refund**: With log (who, when, reason); fiscal receipt issued; linked to payment system

- **Reservations** (`SHOP-ADM-02/03`)
  - **Active reservations**: Per location, client + products, deadline; status "Issued"; expired → auto-released
  - **Deadline**: 48 hours default from reservation creation; configurable in Settings (`SHOP-ADM-04`)
  - **Expiration**: Automatic — unsold reservations released; admin can also manually release

- **Efficiency Metrics** (`SHOP-ADM-04/05`)
  - **Sales per day**: Store revenue per day, ▼/▲ vs previous period
  - **Conversion**: "Reservation → checkout" rate; % of reserved items actually purchased
  - **AOV**: Average order value (UAH); ▼/▲ vs previous period
  - **Sales per barber-recommender**: If products recommended during booking; per-barber metrics

## API Endpoints
Shop API under the catalog module:

- `GET /admin/shop/products` — List products with filters (category, status, search)
- `POST /admin/shop/products` — Create new product
- `GET /admin/shop/products/:id` — Get product detail with variants
- `PATCH /admin/shop/products/:id` — Update product (name, price, status, variants)
- `GET /admin/shop/orders` — List orders with filters (status, period, self-pickup)
- `GET /admin/shop/orders/:id` — Get order detail with positions, customer, address
- `PATCH /admin/shop/orders/:id` — Update order status, add track number, refund (with log)
- `GET /admin/shop/reservations` — List active reservations with filters (location, expiry)
- `POST /admin/shop/reservations` — Create new reservation (client + products, 48h deadline)
- `POST /admin/shop/reservations/:id/expire` — Manual expiry/release of reservation

## DTOs (inferred)
- `ProductDto`: id, name, description, category, brand, photoUrl, variants (array), status
- `VariantDto`: id, name (e.g., "300ml", "Brown"), price (separate from base), stock (separate from base)
- `OrderDto`: id, customerId, customerAddress, positions (array), totalAmount, status, trackNumber, createdAt, selfPickup
- `ReservationDto`: id, clientId, productIds, locationId, createdAt, expiresAt, status (`issued` / `expired` / `cancelled`)

## Business Rules
- **Product variants**: Each variant has separate price and stock; base product price is default; variants can override
- **Stock per variant**: Tracked independently; can go to 0; "Out of stock" badge; no backorders in v1
- **48-hour reservation deadline**: Default; configurable in Settings; reservations auto-expire after deadline; released to general stock
- **Order refund**: With log (admin, reason, timestamp); fiscal receipt re-issued or voided; refund process same as payments module (partial or full)
- **Self-pickup**: Optional flag on order; client picks up at location; no delivery in v1
- **Conversion**: "Reservation → checkout" rate tracked; items reserved but not purchased after 48h released
- **AOV calculation**: Total store revenue / number of successful orders (not reservations); excludes cancelled/refunded

## Permissions
- `admin` role only (v1)
- Direct URL access without role → 403
- Location scoping: products and orders may be scoped to location in phase 9+; currently global in v1

## Development Notes
- Product photo upload: to `media.fade.com.ua`; signed URLs; responsive images; max 3 photos per product
- Variant management: add/remove variants; price/stock per variant; base product price remains as default if no variant selected
- Reservation deadline: stored as `expiresAt` = `createdAt` + 48h (configurable); cron or event-driven expiry; releases reservation and restores variant stock
- Order status flow: `new` → `confirmed` → `preparing` → `ready` → `picked_up`/`delivered` → `refunded`; each step may trigger events
- Track number: optional field; format free text; linked to shipping integration (none in v1, placeholder for phase 27)
- Conversion tracking: reservation → order conversion measured by `OrderCreated` event linked to prior `ShopReservationCreated` event
- AOV: computed from `OrderDto.totalAmount`; excludes orders with status `refunded` or `cancelled`

## Important Edge Cases
- Variant stock independent: base product stock not tracked; only variant stock matters; can sell out specific variant while base product active
- 48-hour reservation: configurable per deployment; if changed, existing reservations' deadlines do not update (keep original `expiresAt`); new reservations use new default
- Order refund: restocks variant stock; fiscal receipt voided or credited; linked to payment refund if same payment method
- Conversion rate: may be > 100% if bugs; normally 0–100%; ratio of orders to active reservations at any time
- AOV: smart exclusion of refunded/cancelled orders; if all orders refunded, AOV shows 0 or error state
- Self-pickup only in v1: no delivery address validation; delivery planned for phase 27 (full shop)

## Links to Related Documentation
- `docs/acceptance-criteria/23-online-shop.md` (SHOP-ADM-01…05)
- `docs/acceptance-criteria/04-admin-management.md` (SHOP-ADM-01/02 references)
- `docs/acceptance-criteria/08-analytics-dashboard.md` (ANL-ADM linkage, store revenue in KPI)
- `docs/ubiquitous-language.md` (no direct — shop is separate context)
- `products.md` (§15 — shop, SHOP-ADM-01…05)
- `docs/roadmap.md` (phase 27 — full shop; phase 23 — live slots; phase 24 — GBP; SHOP-lite v1.1)
- `docs/admin-screens.md` (§15 — shop)
- `docs/adr/` (ADR 0017 — single cookie session domain; shared auth with site/market)