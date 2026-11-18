# T-271 · Shop-lite: 48-hour 'to cash desk' reserve

- **Stage**: M5 (v1.1, phase 27) · **Tags**: backend, frontend · **Complexity**: middle · **Depends on**: T-270, T-011 (shared session)
- **StoryPoints**: 5

## What

SHOP-010…013 + SHOP-BAR-01: CTA "Book to cash desk" on shop.fade.com.ua → location selection → 48-hour reserve (configurable); stock is deducted, expired — returned automatically (`ShopReservationExpired`); client confirmation; cancellation by the client; "Issued" mark by admin/barber; client without push — statuses in the cabinet (SHOP-004). Shared session: logged in on the website — logged in in the shop.

## Sources

- `SHOP-001, SHOP-004, SHOP-010…013, SHOP-BAR-01`; `docs/online-shop.md` (shop-lite); **ADR 0017** (session)

## Done

- [ ] Full reserve lifecycle with auto-expiration
- [ ] "booking → cash desk" conversion visible in analytics

## Risks

- [ ] **48-hour reserve**: release of reserve — timer
