# T-4614e · Empty catalog showroom

- **Stage**: horizontal · **Tags**: frontend · **Complexity**: middle · **Dependencies**: T-4614, T-4513
- **StoryPoints**: 5

## Blocker

Site draws network that doesn't exist, and leads to booking that can't be completed.

- `apps/web/src/app/page.tsx`: header and paragraph "Barbershop network. Haircuts from 700 ₴, first — 600 ₴" always render. "Register" CTA leads to `/booking`, even when locations zero or API down. "Nearest location" block hidden, booking promise — none.
- `apps/web/src/app/components/shell/SiteHeader.tsx` and `MobileNav.tsx`: "Register" item always in header (`BOOKING_HREF` in `nav-items.ts`).
- Empty `/locations`, `/barbers`, `/services` show EmptyState and still call "Register" (`locations/page.tsx`, `barbers/page.tsx`, `services/page.tsx`).
- `booking/steps/LocationStep.tsx` on empty list writes "Locations not yet — opening soon", but guest already inside master with step indicator.

States `ok | empty | error` already exist (T-4513). Texts and CTA for zero locations missing.

## What

While active locations zero, site — "preparing first point" state. Without price, without "Register", without location choice step. When first active location appears in admin, same pages without separate release again lead to booking.

## Implementation plan

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/components/home/HomeEmptyCatalog.tsx`
- `apps/web/src/app/components/shell/SiteHeader.tsx`
- `apps/web/src/app/components/shell/MobileNav.tsx`
- `apps/web/src/app/components/shell/PublicShell.tsx`
- `apps/web/src/app/services/page.tsx`
- `apps/web/src/app/services/ServicesEmptyHeader.tsx`
- `apps/web/src/app/booking/steps/LocationStep.tsx`
- `apps/web/src/app/__tests__/home-catalog-state.test.tsx`
- `apps/web/src/app/components/shell/__tests__/SiteHeaderCatalog.test.tsx`
- `apps/web/src/app/services/__tests__/services-page.test.tsx`
- `apps/web/src/app/booking/__tests__/location-step.catalog.test.tsx`

Checks:
- `npx jest --config apps/web/jest.config.js --rootDir apps/web apps/web/src/app/__tests__/home-catalog-state.test.tsx apps/web/src/app/components/shell/__tests__/SiteHeaderCatalog.test.tsx apps/web/src/app/services/__tests__/services-page.test.tsx apps/web/src/app/booking/__tests__/location-step.catalog.test.tsx --runInBand`

## Done

- [x] Home, header and mobile menu without booking and without 700/600 ₴ prices when active locations zero
- [x] `/locations`, `/barbers`, `/services` on `empty` explain that booking opens with first location, and don't lead to `/booking`
- [x] `/booking` on zero locations doesn't open "Select location" step
- [x] One active location returns booking CTA to home, to header and to catalog pages
- [ ] Verified in browser on empty API and on API with one location

## Risks

- [x] **Hardcoded price remains in meta description**: `services/page.tsx` and `locations/page.tsx` also promise booking "in 10 seconds" in `description`

## Implementation notes

- apps/web/src/app/__tests__/home-catalog-state.test.tsx
- apps/web/src/app/booking/__tests__/location-step.catalog.test.tsx
- apps/web/src/app/booking/steps/LocationStep.tsx
- apps/web/src/app/components/home/HomeEmptyCatalog.tsx
- apps/web/src/app/components/shell/MobileNav.tsx
- apps/web/src/app/components/shell/PublicShell.tsx
- apps/web/src/app/components/shell/SiteHeader.tsx
- apps/web/src/app/components/shell/__tests__/SiteHeaderCatalog.test.tsx
- apps/web/src/app/layout.tsx
- apps/web/src/app/page.tsx
- apps/web/src/app/services/ServicesEmptyHeader.tsx
- apps/web/src/app/services/__tests__/services-page.test.tsx
- apps/web/src/app/services/page.tsx

## Verification

- Focused Jest: `home-catalog-state`, `SiteHeaderCatalog`, `services-page`, `location-step.catalog`, `PublicShell` — 14 tests green.
- Empty catalog: homepage renders preparing hero without `/booking` links or `₴`; header/mobile menu omit CTA; services header and promo are hidden; booking location step renders "Запис ще не відкрито".
- Populated catalog: homepage keeps booking CTA and prices; header/mobile CTA returns; services list and location picker render normally.
- Browser verification on a live empty/populated API remains open.

## QA

- `npx jest --config apps/web/jest.config.js --rootDir apps/web apps/web/src/app/__tests__/home-catalog-state.test.tsx apps/web/src/app/components/shell/__tests__/SiteHeaderCatalog.test.tsx apps/web/src/app/services/__tests__/services-page.test.tsx apps/web/src/app/booking/__tests__/location-step.catalog.test.tsx --runInBand` exit 0
