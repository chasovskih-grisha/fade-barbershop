# T-4430 · Barber push notification for new appointment / cancellation

- **Stage**: M2 (phase 5) · **Tags**: mobile, notifications, barber-app · **Complexity**: junior · **Depends on**: T-083, T-4410
- **StoryPoints**: 3

## What

Barber push notification: new appointment, cancellation, reschedule (T-4414/4420), client waiting in the hall. Route to appointment card (T-4428), nothing duplicated in SMS; push spam limits (T-4410) apply to streams.

## Why

A barber near the chair does not check the app every time; push is the only way not to miss schedule changes (mobile T-083 exists, state change flows from T-042).

## Sources

- barber-screens.md; notifications README; T-083 (barber mobile)

## Done

- [ ] Creation/cancellation/reschedule events → barber push
- [ ] Opens appointment card; duplicate sender prevention
- [ ] Daily stream limit (anti-spam)

## Risks

- [ ] **Noise**: client cancellations × 5 a day — "quiet hours" rule (product decision)