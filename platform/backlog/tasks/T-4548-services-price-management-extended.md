# T-4548 · Services & price management: add-ons, packages, bundles, consumables, temp prices

- **Stage**: M1 (phase 2-4) · **Tags**: backend, catalog, scheduling · **Complexity**: middle · **Depends on**: T-024, T-4521, T-4537, T-4419
- **StoryPoints**: 8

## What

Catalog extension (T-024) for operational service management:
- **Service add-ons**: flag `isAddon: true` — cannot be selected standalone, only as an add-on to a primary service (T-4537). Example: "Beard dye", "Face mask"
- **Service packages/bundles**: composite services with fixed price/duration (e.g., "Complex: Haircut + Beard + Mask"). In catalog as a separate service with `packageItems[]`. Decomposed into items during booking (T-4537).
- **Service-specific cleanup/buffer**: `cleanupMinutes` per service (added to slot duration for sanitary treatment)
- **Service-specific resources**: binding to resources (chair, cabin, equipment) — T-4551 (resources)
- **Service-specific commission**: commission % for this service (overrides barber default)
- **Service-specific consumables**: list of materials written off upon service provision (T-4550 inventory)
- **Temporary price changes**: `PriceOverride` with from/to dates (seasonal promos, holiday prices) — does not change base price, logic in `catalog` when calculating `AgreedPrice`
- **Promotions for services**: connection with `discounts` (T-152/153) — automatic rule application

## Why

Flexible pricing, packages, upsells, material cost control — foundation for revenue.

## Sources

- T-024 (catalog prices), T-4521 (barber-service matrix), T-4537 (composite appointments), T-4419 (service duration variants), T-152/153 (discounts)
- Altegio: usługi dodatkowe, pakiety, bufor czasowy, zużycie materiałów, ceny promocyjne

## Done

- [ ] Prisma: extend `Service` with `isAddon`, `packageItems[]`, `cleanupMinutes`, `resourceIds[]`, `commissionPercent`, `consumableItems[]`
- [ ] PriceOverride model: serviceId, locationId, price, fromDate, toDate, reason
- [ ] Catalog API: CRUD for new fields, validation (addon cannot be primary in a package)
- [ ] Admin UI: "Services" tab — additional columns, inline editing of buffer/commission
- [ ] Booking flow: automatic duration calculation = sum(duration + cleanup) for compositions
- [ ] Consumables: record `ConsumableWriteOff` upon `AppointmentCompleted` (T-4550)

## Risks

- [ ] **Price conflicts**: PriceOverride + Discount + Loyalty — application order (ADR 0007, T-4000)
- [ ] **Package pricing**: fixed package price vs sum of component prices — clear rule: package has its own price
