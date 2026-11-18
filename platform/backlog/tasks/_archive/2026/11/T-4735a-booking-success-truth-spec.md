# T-4735a · Specify the success screen

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4735
- **StoryPoints**: 2

## What

Add a short «Після підтвердження» note to `docs/booking-flow.md`, after screen 5.

- The screen always shows location, service, barber, and the chosen time.
- A photo and a comment appear when the visit has them. Their absence does not hide the four facts.
- One link, «Мої візити», to `/account/appointments`.
- No preference chips, no rating, no reminder toggle, no support bot.
- No calendar button on this screen until T-4446 supplies a link that includes the start and the end.

## Why

The flow doc ends at payment. The screen that shipped after it is not described, so the fake controls have nothing to be checked against.

## Sources

- T-4735
- `docs/booking-flow.md`
- T-4446

## Status

**Done** (2026-11-12): `docs/booking-flow.md` has a «Після підтвердження (T-4735)» note right after screen 5. It names the four facts (location, service, barber, time), the optional photo/comment, the single «Мої візити» link, and what the screen must not contain (preference chips, rating, reminder toggle, support bot, dateless calendar button until T-4446). Screen 5's payment content is untouched; `pnpm docs:validate` is green.

## Done

- [x] The note lists the four facts and the one link
- [x] It names what the screen does not contain
- [x] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **Rewriting screen 5.** Payment and the price breakdown stay where they are. This note is only the screen after a created visit
