# T-4735 · The booking success screen shows the visit and nothing it did not save

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-041, T-043
- **StoryPoints**: 7

## What

`SuccessStep` hides the service, barber, and time unless the client attached a photo or a comment. It then offers service chips and a star rating that set local state and show «Збережено» without writing anything. A badge says «Нагадування активні». The reminder button calls `alert`. The Google Calendar link has no start or end. A Telegram link points at a bot the product does not operate.

The success screen shows the visit that was just created: location, service, barber, and time, whether or not there is a photo. It links to `/account/appointments`. It does not show a control that claims a save, a reminder, or a support channel that does not exist. The dateless calendar button comes off this screen. A real calendar file stays with T-4446.

## Why

The client has just committed. The screen either confirms that visit or it pretends the account recorded a preference and a reminder.

## Sources

- `apps/web/src/app/booking/steps/SuccessStep.tsx`
- `docs/booking-flow.md` (after the booking)
- T-4446

## Status

**Done** (2026-11-12): slices a (spec in `docs/booking-flow.md`) and b (`SuccessStep`) are done. The success screen always shows location, service, barber and time, offers only «Мої візити» and «На головну», and no longer carries the fake save/reminder/support controls or the dateless calendar link. Web 106 suites / 314 tests green; `tsc --noEmit`, ESLint on changed files and `pnpm docs:validate` clean.

## Done

- [x] Slices a and b are `done`
- [x] A booking with no photo still shows location, service, barber, and time
- [x] The screen has no «Збережено», no star rating, no reminder button, and no Telegram bot
- [x] The calendar control with no start time is gone

## Risks

- [ ] **A second calendar.** T-4446 builds the ICS and the dated links. This task only removes the link that opens an event with no time
- [ ] **Saving the chips into preferences.** Those chips are not the preference note (T-4721). They do not get a new store

## Out of scope

- The pinned summary during the steps (T-4711)
- Price math (T-090) and the deposit charge (T-091)
- T-4446
