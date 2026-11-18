# T-4614e · Empty catalog showroom

- **Stage**: horizontal · **Tags**: frontend, design · **Complexity**: middle · **Dependencies**: T-4614, T-4513
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

## Done

- [ ] Home, header and mobile menu without booking and without 700/600 ₴ prices when active locations zero
- [ ] `/locations`, `/barbers`, `/services` on `empty` explain that booking opens with first location, and don't lead to `/booking`
- [ ] `/booking` on zero locations doesn't open "Select location" step
- [ ] One active location returns booking CTA to home, to header and to catalog pages
- [ ] Verified in browser on empty API and on API with one location

## Risks

- [ ] **Hardcoded price remains in meta description**: `services/page.tsx` and `locations/page.tsx` also promise booking "in 10 seconds" in `description`
