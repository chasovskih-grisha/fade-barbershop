# T-4740 · An app visit can be moved or cancelled, like on the website

- **Stage**: M2 (phase 10) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-072, T-4737a, T-4739a
- **StoryPoints**: 10

## What

The website cabinet can reschedule and cancel a visit. The app row can edit a reference and cannot do either of the other two. The screen header used to promise a reschedule. T-4739 removes that promise until this task adds the action.

An upcoming visit on the app gets «Перенести» and «Скасувати». Reschedule uses the same slot rules as the website reschedule. Cancel uses the consequence words from T-4737: no money sentence unless the visit has a deposit and a stored window. Both call the commands the website already calls. A completed visit gets neither button. «Записатися знову» stays T-4617.

## Why

A client who booked on the phone cannot change that visit on the phone. The website can.

## Sources

- `apps/mobile/src/app/(client)/account/appointments/list-item.tsx`
- `apps/web/src/app/account/appointments/RescheduleForm.tsx`
- `docs/client-screens.md` §4
- T-4737
- T-4617

## Done

- [ ] Slices a and b are `done`
- [ ] An upcoming visit can be rescheduled and cancelled from the app
- [ ] A completed visit offers neither
- [ ] Cancel copy matches T-4737, including the quiet case

## Risks

- [ ] **A new scheduling API.** Use the reschedule and cancel endpoints the website uses
- [ ] **Book again.** T-4617 owns that action
- [ ] **The header promise returning early.** The word «переносите» comes back only when the button is on the row

## Out of scope

- Deposit refund execution (T-091)
- The status labels (T-4739)
