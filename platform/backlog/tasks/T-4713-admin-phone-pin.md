# T-4713 · Pinned read-back for admin phone booking

- **Stage**: M2 (phase 5) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-046
- **StoryPoints**: 7

## What

While an operator books a visit from a phone call, the decisions already taken stay pinned: the client, the location, the barber, and the time. The operator can read that strip back to the caller without scrolling the form.

The form is `apps/admin/src/app/bookings/phone`: a verified client, then location, barber, date, and a slot grid. The slot grid is the same length problem as the public booking flow. T-4711 does not cover this screen. The client is already known, and there is no service field.

## Why

The caller is on the line. If the operator has to scroll to remember who the visit is for, they will read back the wrong chair or the wrong time.

## Sources

- `docs/admin-screens.md` §6.2
- `docs/design-system.md`
- `apps/admin/src/app/bookings/phone/VisitForm.tsx`
- `apps/admin/src/app/bookings/phone/VisitFormFields.tsx`
- T-046

## Done

- [ ] Slices a and b are `done`
- [ ] With a slot chosen, the operator sees client, location, barber, and time without scrolling
- [ ] Changing the barber or the date removes the time from the pin, matching the form
- [ ] The strip does not invent a service. The form still sends a fixed duration

## Risks

- [ ] **Empty selects look chosen.** The placeholder «Оберіть …» is not a fact. The pin omits a field until it has a real value
- [ ] **Reading back the wrong client.** The client fact is the verified phone and name. «Змінити клієнта» returns to the phone step and does not keep the previous slot

## Out of scope

- Adding a service picker. That is a separate form change
- The public booking pin (T-4711)
- The calendar visit card. This pin is only the create form
- Walk-in creation
