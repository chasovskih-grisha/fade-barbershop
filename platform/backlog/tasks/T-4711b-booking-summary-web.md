# T-4711b · Sticky summary on the web booking flow

- **Stage**: M1 (phase 4) · **Tags**: frontend, ux, a11y · **Complexity**: middle · **Depends on**: T-4711a, T-041
- **StoryPoints**: 5

## What

Build the pin from slice a on `apps/web` `/booking`.

- A `BookingSummary` in the booking shell, above the step body and below the site header. It reads `useBookingFlow`. It does not keep a second copy of the choices.
- The concierge banner in `BookingHeader` renders on step 0 only. From the first decision the pin replaces it.
- Facts, labels, edit targets, collapse, and the live time announcement follow slice a.
- Earlier-fact buttons call the existing setters (`setStep` plus the clears those setters already perform). Do not add a parallel reset.
- On the slot step, pressing a slot fills the when-fact immediately. Changing the date removes it.
- The success step does not render the pin.
- New code stays on tokens. No hex in the screen. The component file stays under the LOC gate (ADR 0019). Missing pieces extend `packages/ui` rather than a one-off control, but this summary is flow-specific and may live next to the booking shell.

## Why

The spec does not help the client who is looking at the slot grid. This slice is the screen they asked for.

## Sources

- T-4711a
- `docs/booking-flow.md`
- `docs/design-system.md`
- `apps/web/src/app/booking/page.tsx`, `BookingHeader.tsx`, `useBookingFlow.ts`, `bookingActions.ts`

## Done

- [ ] Slot step: location, service, and barber are visible without scrolling, and stay visible while the grid scrolls
- [ ] Choosing 14:00 fills the when-fact; choosing another slot moves it; changing the date clears it
- [ ] «Змінити послугу» returns to the service step, and a later location change removes the service, barber, and time from the pin
- [ ] Before a location is chosen, and on the success step, the pin is absent. On step 0 the concierge banner is still there
- [ ] The region name is «Ваш запис». Chip buttons expose `Змінити …`. The time announcement is a single polite live message
- [ ] Tests cover the fact rules, the any-barber label, the edit jump, and the hidden states
- [ ] Checked in the browser on the slot step, desktop and a narrow viewport: the pin does not cover the date strip, and the collapsed narrow layout keeps the chosen time

## Risks

- [ ] **Empty id shown as any barber.** Steps 0–2 start with `barberId === ''`. The pin must use the step, not the empty string, before it prints «Будь-який барбер»
- [ ] **Sticky under the site header.** A `top: 0` pin will slide under the public header. Offset it by the header
- [ ] **Live region noise.** Announcing the whole pin on every step change repeats facts the step announcer already speaks. Announce only the newly chosen time

## Re-verified at 91202f68

`Depends on: T-4711a, T-041`; both are `todo` at `91202f68` (`m1.md:161` for T-4711, `m1.md:160`
for T-041). The pin lives on the booking flow T-041 has not shipped, so this slice has no surface to
attach to yet.
