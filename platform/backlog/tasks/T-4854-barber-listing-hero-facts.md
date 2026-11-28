# T-4854 · The barber listing hero does not invent network statistics

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-030
- **StoryPoints**: 3

## What

The `/barbers` hero states «5+ років», «100%», and «Прямий запис» as if they were measured, and the meta description promises portfolio, prices, and free windows. None of those figures come from a record.

The hero keeps a title and one short line. The three statistic cards are removed. The meta description does not promise free windows, a portfolio, or a price.

## Why

A directory that opens with a fake score has already spent the guest’s trust.

## Implementation plan

Paths:
- apps/web/src/app/barbers/BarbersHeader.tsx
- apps/web/src/app/barbers/BarbersHighlights.tsx
- apps/web/src/app/barbers/page.tsx
- apps/web/src/app/barbers/__tests__/hero-facts.test.tsx

Checks:
- pnpm --filter @fade/web exec jest apps/web/src/app/barbers/__tests__/hero-facts.test.tsx

## Sources

- `apps/web/src/app/barbers/page.tsx`
- `pageMetadata` on that route

## Done

- [x] The strings «5+ років» and «100%» are not on the listing
- [x] The description does not mention вільні вікна or ціни
- [x] A test reads the hero and the metadata

## Risks

- [ ] **An empty header.** The title «Архітектори вашого стилю» may stay or become «Майстри». This task removes the false figures, not the title

## Out of scope

- Real tenure computed from hire dates
- Prices on the profile (T-4477a) and free windows (T-130)

## Implementation notes

- apps/web/src/app/barbers/BarbersHeader.tsx
- apps/web/src/app/barbers/__tests__/hero-facts.test.tsx

## QA

- `pnpm --filter @fade/web exec jest apps/web/src/app/barbers/__tests__/hero-facts.test.tsx` exit 0
