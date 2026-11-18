# T-4738b · Service field on the phone booking form

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4738a
- **StoryPoints**: 5

## What

Add the service select to `VisitFormFields`. Options are the services offered at the selected location. Changing location clears the selection when the service is not in the new list. `VisitForm` sends `serviceId` and the service duration instead of a fixed 30. The slot query uses that duration. The create button stays disabled without a service. If `POST /admin/bookings` ignores `serviceId` today, pass it through to the booking that already stores `serviceId`. Do not add a new booking type.

## Why

The form is the only place an operator creates a visit for a client who called.

## Sources

- T-4738a
- `apps/admin/src/app/bookings/phone/VisitForm.tsx`
- `apps/admin/src/app/bookings/phone/VisitFormFields.tsx`
- `apps/api/src/scheduling/dto/book-slot.dto.ts`

## Done

- [ ] Submit without a service does not call the API
- [ ] The payload duration equals the chosen service
- [ ] Switching location does not keep a service from the previous one

## Risks

- [ ] **The slot hook's location fallback.** The service list uses the same chosen location as the slot query. It does not query `locations[0]` while the select is empty
