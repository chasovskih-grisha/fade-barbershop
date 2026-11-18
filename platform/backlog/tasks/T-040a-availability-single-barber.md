# T-040a · Single Barber Slots (2/8)

- **Stage**: M1 (phase 4) · **Tags**: backend, middle · **Complexity**: middle · **Depends on**: T-022, T-023
- **StoryPoints**: 2

## What
Implement validator for a single barber: `Availability` + `OpeningHours` − service duration. The booking flow can already be tested on a single chair. Pure validator logic without concurrency.

## Why
Slice 1/3 — parallel start from day one; middle developer under supervision.

## Sources
- scheduling README (`Availability`, `TimeSlot`)
- `booking-flow.md` screen 3

## Done
- [ ] Validator for single barber works
- [ ] Unit Tests for edge cases

## dependencies
- T-040b (any barber)
- T-040c (concurrency)
