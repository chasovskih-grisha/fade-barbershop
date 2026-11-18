# T-041 · Online Booking Flow Implementation

- **Stage**: M2 (phase 4) · **Tags**: frontend, booking, backend · **Complexity**: senior · **Depends on**: T-030, T-024, T-022
- **StoryPoints**: 8

## What

End-to-end online booking flow for clients: service selection, location selection, barber selection, date and time slot selection, contact details / OTP verification, and booking confirmation.

## Why

Online booking is the primary acquisition and scheduling channel for clients, reducing front-desk workload.

## Sources

- `docs/booking-flow.md`
- `docs/client-screens.md`

## Done

- [ ] Multi-step booking flow implemented on web
- [ ] Backend integration for slot validation and appointment creation
- [ ] E2E tests passing

## Risks

- [ ] **Slot concurrency**: race conditions when multiple clients try to book the same time slot simultaneously.
