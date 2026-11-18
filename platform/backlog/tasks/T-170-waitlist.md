# T-170 · Waitlist: queue, soft-hold, offer cascade

- **Stage**: M4 (phase 17) · **Tags**: backend, high-risk · **Complexity**: senior · **Depends on**: T-042, T-080, advised T-160
- **StoryPoints**: 4

## What

ADR 0012: `WaitlistEntry` (configuration, window, precision) + `SlotHold` (15 min, not a booking); release sources — `AppointmentCancelled`/`AppointmentNoShowed`; FIFO by configuration; offer via push, confirmation → standard `Appointment` (new `AgreedPrice`, current discounts); cascade to next; anti-spam (3 misses → pause); request limits; without push — not added (WTL-008).

## Sources

- `WTL-001…008`; **ADR 0012** (idempotency, rejected alternatives); scheduling README (queue events)

## Done

- [ ] Hold→push→confirm→cascade mechanics work with race condition tests
- [ ] Expired holds are cleaned up; slots with holds are invisible

## Risks

- [ ] **Soft-hold 15 min**: timers/expiration — integration tests
- [ ] **Auto-fulfillment**: race with manual booking — shared validator
