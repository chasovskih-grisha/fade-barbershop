# T-046 · Admin Visit Creation (Phone Booking)

- **Stage**: M2 (phase 5, together with CRM) · **Tags**: frontend · **Complexity**: junior · **Depends on**: T-045 (calendar), T-060 (client card)
- **StoryPoints**: 3

## What

"Book" action from client card in CRM (`admin-screens.md` §6.2): the same booking flow with a pre-selected client (admin selects service/barber/slot); reference and comment are optional (client can add later from cabinet — REF-WEB-04). Payment: deposit link sent to client (SMS/push) or "pay on site" mark. Booking source `admin` — channel slice in analytics (ANL-004, phase 16).

## Why

Phone booking is a significant part of the barbershop's operational reality; without it, the admin cannot manage a calling client, and analytics loses the channel.

## Sources

- `admin-screens.md` §6.2 ("Book" — path to booking-flow)
- ANL-004 (booking channels); WALK-ADM-03 visit source semantics

## Done

- [x] Admin creates a visit from the client card in a few steps (backend done 2026-09-26: same `POST /admin/bookings` with `origin.clientId` — pre-selected client; UI done 2026-10-06: "Book" in CRM table → phone booking with pre-selected client; UI done 2026-10-09: "Book" on client card as well — login with `User.id`, see slice below)
- [x] Channel `admin` visible in visit data (for analytics) — `Booking.source` ('web'|'admin'|'walk_in'|'mobile', default 'web', ANL-004), open set is validated, source and clientId in calendar response

## Current slice (2026-09-26, backend)

- migration `20261102030000_booking_source`: nullable `clientId` (link to identity)

## Status

- 2026-11-25 — both Done criteria are in the tree and covered by tests: `apps/admin/src/app/clients/ClientsTable.test.tsx`, `apps/admin/src/app/clients/[id]/page.book.test.tsx`, `apps/admin/src/app/bookings/phone/page.preselect.test.tsx`. Index moved to `review`.
