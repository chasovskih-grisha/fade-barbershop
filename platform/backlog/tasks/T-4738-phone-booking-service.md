# T-4738 · A phone booking chooses a service

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-046, T-024
- **StoryPoints**: 7

## What

`VisitForm` creates an admin booking with `serviceDuration: 30` and no service. The client then has a visit with no name and a length that is not the service they asked for. The client booking payload already requires a real service and refuses a raw duration (`client-booking.dto`).

The phone form picks a service from the catalog of the location the operator chose. The duration sent with the slot is that service's duration. The request includes `serviceId`. Submit stays disabled until a service is chosen. Changing the location clears a service that location does not offer. The service list does not fall back to the first location in the directory.

## Why

A half-hour visit with no service cannot be shown in the client's cabinet, and it books the wrong length of chair.

## Sources

- `apps/admin/src/app/bookings/phone/VisitForm.tsx`
- `apps/admin/src/app/bookings/phone/VisitFormFields.tsx`
- `apps/api/src/scheduling/dto/book-slot.dto.ts`
- `docs/admin-screens.md` §6.2

## Done

- [ ] Slices a and b are `done`
- [ ] The form cannot submit without a service
- [ ] The stored visit carries that service id and that service's duration
- [ ] The service list follows the chosen location, not the first location

## Risks

- [ ] **A price override.** The service's price is the catalog price. The operator does not type a new one here
- [ ] **The read-back pin.** T-4713 has no service fact because this field did not exist. Once the field exists, the pin shows the service name. This task adds that fact. It does not rebuild the pin

## Out of scope

- Father-and-son on the phone form
- Walk-in
- Editing the catalog
