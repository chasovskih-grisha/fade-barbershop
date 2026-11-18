# T-4213 · Booth Rental Model

- **Stage**: M6 (phase 40) · **Tags**: backend, hr, finance · **Complexity**: middle · **Depends on**: T-3300, T-2400
- **StoryPoints**: 15

## What
Booth rental: **Contracts** — fixed rent (monthly/weekly), utilities split (electricity/water/wifi by meters/area), revenue sharing % (optional), deposit, notice period, early termination; **Billing** — automated invoicing, payment tracking, late fees, prorate for partial month; **Tenant Portal** — barber sees contract, payments, utilities consumption, maintenance requests; **Admin** — contract management, financial overview, eviction/relocation, recalculation on tariff changes.

## Why
Alternative model: barber = entrepreneur. Fewer HR risks. Flexibility for experienced masters.

## Sources
- docs/booth-rental.md — phantom 2026-09-22: file never existed; source accepted at task start
- Civil Code of Ukraine (lease agreement)
- docs/hr.md — phantom 2026-09-22: file never existed; source accepted at task start §Booth rental

## dependencies
> Slices are defined at task start; separate subtask files are created then if needed.
