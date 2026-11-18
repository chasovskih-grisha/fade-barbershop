# T-4739b · Ukrainian status on the app visit row

- **Stage**: M2 (phase 10) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-4739a
- **StoryPoints**: 5

## What

Map the four statuses in `list-item.tsx` to the labels from slice a. Replace the hex colors with theme tokens. In `visits-body.tsx`, remove `/booking` from the empty copy and remove «переносите» from the header until a reschedule control exists. Keep «Записатися».

## Why

The row and the header are the whole visit screen.

## Sources

- T-4739a
- `apps/mobile/src/app/(client)/account/appointments/list-item.tsx`
- `apps/mobile/src/app/(client)/account/appointments/visits-body.tsx`

## Done

- [x] A confirmed visit does not show the word `confirmed`
- [x] The file has no hex literal
- [x] The empty state does not show a path

## Risks

- [ ] **Translating inside the API.** The map lives in the row. The stored status stays the enum
