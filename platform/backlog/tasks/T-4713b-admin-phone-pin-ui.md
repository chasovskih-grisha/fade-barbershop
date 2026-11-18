# T-4713b · Read-back pin on the admin phone form

- **Stage**: M2 (phase 5) · **Tags**: frontend, ux, a11y · **Complexity**: middle · **Depends on**: T-4713a, T-046
- **StoryPoints**: 5

## What

Build the pin from slice a on the phone-booking form.

- The pin sits above `VisitFormFields`, under the admin header, and reads the same state as the selects and `SlotSection`.
- The client fact is the verified phone and name from `VerifiedClientCard`. It is visible as soon as the form opens.
- Location, barber, and time appear only after a real selection. The empty option is not a fact.
- Changing barber or date clears the picked slot and the when-fact together. This already happens in `VisitFormFields`; the pin must not keep the old slot.
- «Змінити клієнта» returns to the phone step and drops the slot.
- «Змінити локацію» and «Змінити барбера» move focus to those selects.
- The create button stays at the end of the form. The pin does not submit.
- Tokens only. No hex. The component stays under the file-size gate.

## Why

The operator is reading the visit back on a call. The slot grid is too long to keep the client and the chair in view.

## Sources

- T-4713a
- `docs/admin-screens.md` §6.2
- `apps/admin/src/app/bookings/phone/VisitForm.tsx`
- `apps/admin/src/app/bookings/phone/VisitFormFields.tsx`
- `apps/admin/src/app/bookings/phone/slot-section.tsx`

## Done

- [ ] A verified client is in the pin before any select is touched
- [ ] Choosing a slot shows the time; changing the barber or the date removes it
- [ ] The empty options do not appear as facts
- [ ] «Змінити клієнта» leaves the form and does not submit a visit
- [ ] Region name is «Запис для клієнта». The chosen time is one polite live message
- [ ] Tests cover an empty form, a full selection, a cleared slot, and the return to the phone step
- [ ] Checked in the browser on the phone-booking page: the pin stays visible while the slot grid scrolls and does not cover the first row

## Risks

- [ ] **Location defaults to the first option in the slot query.** The pin shows a location only when the select's value is a chosen option, not because the slot hook fell back to `locations[0]`
- [ ] **Focus moves the page under the sticky header.** The select focus target has to clear the pin
