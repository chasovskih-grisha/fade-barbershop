# 23. Online store (shop.fade.com.ua)

> Feature: internet store of goods (cosmetics, care, styling) on `shop.fade.com.ua`. Two steps: **shop-lite** — "reserve to cash" without online payment (v1.1, right after v1) and **full store** — cart, payment, delivery (phase 27).
>
> Contexts: **without new service** — catalog/stock/orders live in same monolith (ADR 0002), payment — `billing` (new payment type `order` on same `AcquiringGateway` port), notifications — `notifications`, CRM link — `crm`. Domains and **shared auth — ADR 0017**: one session on `Domain=.fade.com.ua`, `my.fade.com.ua` not done. Mechanics and phases — `docs/online-shop.md`.

## Common (both steps)

- [ ] **SHOP-001.** Entry to store = same network `User`: logged in on `fade.com.ua` — logged in on `shop.fade.com.ua` (shared cookie `Domain=.fade.com.ua`, ADR 0017 §3); logout in one place — logout in both. Separate store registration none; guest checkout in v1 none (phone = client `crm`).
- [ ] **SHOP-002.** Goods catalog — store's own model (Product, ProductVariant), **not mixed with `catalog` services**: prices, stock and store discounts separate; disabled product disappears from store immediately (within cache), like disabled services/barbers.
- [ ] **SHOP-003.** Product photos — in `media.fade.com.ua` (object storage, CDN); no API secrets on public URLs.
- [ ] **SHOP-004.** Client without push not blocked: order/reserve statuses sent by available channel (push/email; email — open channel question), CRM profile shows orders and reserve always.
- [ ] **SHOP-005.** Buyer personal data (phone, delivery address, order history) — available to admin and store role; barber sees client's orders only in their client card, without address.

## Shop-lite — "reserve to cash" (v1.1)

- [ ] **SHOP-010.** Client chooses goods on `shop.fade.com.ua` → "Reserve to cash" CTA → location choice → 48-hour reserve (admin configurable). No online payment; money — at location cash register with regular receipt.
- [ ] **SHOP-011.** Reserve writes off location stock at booking moment; other buyer sees updated remainder. Expired → stock auto-returned (`ShopReservationExpired`).
- [ ] **SHOP-012.** Client receives confirmation with location and deadline; pickup marked by admin/barber (`ShopReservationPickedUp`) — or reserve expires. Client sees own active reserve in "My orders" and can cancel self.
- [ ] **SHOP-013.** Events `ShopReservationCreated` / `ShopReservationPickedUp` / `ShopReservationExpired` fixed for analytics (reserve→cash conversion, stock return).
- [ ] **SHOP-BAR-01.** Barber in mobile: create reserve to cash from client card (recommended product in chair) and "Issued" mark on own reserve; network sums and stock barber doesn't see — only own reserves (same access limit as client card).

## Full store (phase 27)

- [ ] **SHOP-020.** Cart and checkout: quantity/variants, stock check on add and **repeat on payment** (race of two buyers of last item — later loses; "Out of stock" message, payment not processed).
- [ ] **SHOP-021.** Delivery: Nova Poshta (department/post office — buyer's address data) and self-pickup from location (free); delivery cost — admin setting.
- [ ] **SHOP-022.** Online payment: card via booking acquiring (port `AcquiringGateway`, payment type `order`); success → `OrderPaid` → "Assembling" status; acquiring error — "money not charged" + retry (PAY-WEB-05/06 semantics); double click doesn't create second order/payment (PAY-WEB-03 semantics).
- [ ] **SHOP-023.** Order statuses: `new → paid → packing → shipped | ready_pickup → completed` (+ `cancelled`, `refunded`); `shipped` transition — with track number NP; client sees statuses in "My orders" (`/account`).
- [ ] **SHOP-024.** FPRPO receipt on goods — by distance selling rule (verified before phase 27 launch, open question `online-shop.md`); receipt to email/phone; **loyalty**: orders not counted in "7th visit" (LYL-001 — visits, not purchases), free visit not applied to goods.
- [ ] **SHOP-025.** Cancellation/return: before `shipped` — by client self (stock returned, payment — refund by PAY-005…010 semantics); after shipment — via admin (NP return, manual refund with log).
- [ ] **SHOP-026.** Store discounts — store's own `shop` mechanics (goods promotions, bundles), **not** `discounts` promo codes: 30% cap and DSC-003 stack remain services mechanics; order counting in loyalty — consciously deferred (open question).

## Store (web — shop.fade.com.ua)

- [ ] **SHOP-WEB-01.** Catalog: goods card grid (photo `media.fade.com.ua`, name, price, variants, stock badge); category filter; product card — description, variants, "Out of stock" at stock 0.
- [ ] **SHOP-WEB-02.** Cart: positions with variants and quantity, total; quantity change checks stock.
- [ ] **SHOP-WEB-03.** Checkout: login (if not logged in — OTP, same flow) → address/NP department or self-pickup → payment → confirmation screen with order number; "Register" CTA nearby (ADR 0017 — one client).
- [ ] **SHOP-WEB-04.** Shop-lite: "Reserve to cash" CTA on product card and in cart; location choice; reserve deadline visible.

## Cabinet (fade.com.ua/account)

- [ ] **SHOP-ACC-01.** "My orders" section: list with statuses and track number; order details — positions, sum, address/department, receipt.
- [ ] **SHOP-ACC-02.** "Delivery address" section — saved address/department NP, editable.
- [ ] **SHOP-ACC-03.** Active shop-lite reserves: location, deadline, cancellation.

## Admin (admin.fade.com.ua)

- [ ] **SHOP-ADM-01.** "Products" section: list (name, category, price, stock, status), product form (description, category, brand, photo — upload to `media.fade.com.ua`), variants (volume/color — separate price and stock).
- [ ] **SHOP-ADM-02.** "Orders" section: list with filters (status, period, self-pickup location); order card — positions, buyer, address, status, track number; actions — change status, add track, refund (with log).
- [ ] **SHOP-ADM-03.** Shop-lite reserves: active list by locations (client, goods, deadline), "Issued" mark, expired — auto.
- [ ] **SHOP-ADM-04.** Store settings: reserve deadline (48 hours), delivery cost, "full store" switch (until phase 27 — hidden).
- [ ] **SHOP-ADM-05.** Effectiveness (ANL extension): store revenue/day, "reserve→cash" conversion, AOV, **sales by recommending barber** — which barbers best sell care (Recommend product in visit card, `docs/online-shop.md`).

## Open questions

1. **Payment provider**: same as booking acquiring or separate (installments) — before phase 27.
2. **FPRPO for distance selling** — receipt order, verify with Checkbox/accountant (SHOP-024).
3. **Order counting in loyalty** — now no (SHOP-024); founder decision, affects 7th visit economics.
4. **v1 assortment** — CLT-01 showcase or drop-ship.
5. **Delivery zone** — all Ukraine or Kyiv.
