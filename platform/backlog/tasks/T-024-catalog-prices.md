# T-024 · Catalog: Services, Location Prices, and Price Change Mechanism

- **Stage**: M1 (phase 2) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-021
- **StoryPoints**: 5

## What

`catalog` context: services (duration, category, activity), **location-specific pricing**, `father-son` variant (package, 50/90 min), price change mechanism per ADR 0006 (new price applies only to new bookings; history). Public availability: disabled service disappears from site and flow (MNG-ADM-10), unavailable in a location — without card (MNG-ADM-12).

## Why

Prices are the source of `AgreedPrice` (T-090); gate `MNG-ADM-10…14`.

## Sources

- `MNG-ADM-10…14`; `admin-screens.md` §3; **ADR 0006** (price snapshot on booking)
- `web-screens.md` §3 (consumption)

## Done

- [x] Services and location prices CRUD; for a single SKU, sequential/parallel duration can be set (e.g., 90/50 min)
- [x] Booking price is fixed as a snapshot; subsequent changes apply only to new bookings (ADR 0006)

## Risks

- [x] **Migrations**: global service price migrated to ServicePrice for each existing location; old bookings preserved without fabricated price
- [ ] **Domain Events**: subscriptions are idempotent (pattern ADR 0009/0016)

## Implementation Boundaries

- Admin and API store both durations and booking mode. Parallel booking by two barbers/chairs requires the full `AppointmentParty` aggregate per ADR 0011.
- MNG-ADM-14 audit ("who/when/before/after") remains a separate step; current admin logger does not record before/after values.
