# T-4862 · Share this barber

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4860, T-4477a
- **StoryPoints**: 6

## What

There is no way to send the profile except copying the address bar. The profile and the app screen get one share control. It shares the canonical profile URL and the barber’s name. It does not share `/booking`. The URL uses the slug T-4477a settles; this task does not invent one. Slices: website (T-4862a), app (T-4862b).

## Why

Choosing a person is often a message to someone else.

## Sources

- `apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx`
- T-4840 (the same control for a studio, not a person)

## Done

- [ ] T-4862a and T-4862b are done
- [ ] The shared URL is the profile, not the booking flow

## Risks

- [ ] **Sharing a UUID.** Until T-4477a replaces the slug, the control shares the current path. It does not build a second URL

## Out of scope

- The slug itself (T-4413, T-4477a)
- Booking deep links (T-4477b, T-4541)
