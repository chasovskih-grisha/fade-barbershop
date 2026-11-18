# T-4712b · Cabinet visit pin on the website

- **Stage**: M1 (phase 4) · **Tags**: frontend, ux, a11y · **Complexity**: middle · **Depends on**: T-4712a
- **StoryPoints**: 5

## What

Build the pin from slice a on the website cabinet.

- Reschedule dialog (`RescheduleForm`) opens with the visit pin above the date and start fields.
- «Новий час» appears only when `rescheduleSlot` accepts the start. An invalid start leaves the line off and keeps the existing error.
- The reference editor shows the same pin without «Новий час».
- A visit waiting on a deposit shows «Депозит переноситься». Other visits do not.
- The pin reads the visit passed into the dialog. It does not fetch a second copy.
- Tokens only. No hex in the screen. The component stays under the file-size gate.

## Why

The sentence above the inputs scrolls away. The pin is what the client checks before pressing «Перенести».

## Sources

- T-4712a
- `docs/client-screens.md` §4
- `apps/web/src/app/account/appointments/RescheduleForm.tsx`
- `apps/web/src/app/account/appointments/AppointmentReference.tsx`

## Done

- [ ] Reschedule shows location, service, barber, and «Зараз» before any edit
- [ ] A valid new start shows «Новий час»; clearing or breaking it removes that line
- [ ] Reference edit shows the visit pin and no new time
- [ ] The deposit line appears only for a visit waiting on a deposit
- [ ] Region name is «Цей візит». The new time is one polite live message
- [ ] Tests cover both dialogs, a valid start, an invalid start, and the deposit line
- [ ] Checked in the browser: the pin stays above the fields on a short window

## Risks

- [ ] **Stale new time.** The line must be derived from the current inputs, not stored after a failed submit
- [ ] **List card and pin disagree.** Both read the same visit object. Do not format the booked time a second way
