# ADR 0012: Waitlist — FIFO offer, soft-hold and auto-fill of slots

- Status: accepted
- Date: 2026-09-11
- Context: `scheduling` (mechanic owner), `notifications` (delivery), `crm` (reads queue)

## Context

When no free slots, client today just leaves. When slot frees (cancellation, no-show), it "dies" till end of day — and same-day cancellations to 2-chair point constitute significant share of slots. Waitlist turns these events into new bookings, but redistribution mechanic itself — architectural decision: who holds slot during offer, how long client has to respond, and how not to create race of two contenders.

## Decision

### 1. Waitlist lives in `scheduling`, not separate context

Queue — not new language: request is "desired booking" (configuration location+service+barber/"Any" + date window + time precision). It holds same identifiers as `Appointment`, and converts to `Appointment` by one domain command. Separate context would create second calendar without new knowledge. `notifications` and `crm` only **read** queue state (CQRS: queue read-model for admin and client).

### 2. Offer and hold — by events, with FIFO by configuration

- Cancellation sources: `AppointmentCancelled` and `AppointmentNoShowed` (at-least-once via outbox — same infrastructure as loyalty in ADR 0009).
- Handler chooses **first request by FIFO** with configuration matching freed slot (location, service, barber or "Any", date window covers date, time precision matches slot).
- Handler **idempotent by event**: redelivery doesn't create second offer (key `AppointmentId` + `WaitlistEntryId`).

### 3. Soft-hold 15 minutes: slot held as **hold**, not as booking

- On freed slot creates `SlotHold` (new aggregate beside `Appointment`): `expiresAt = now + 15 min`, link to request.
- Slot with active hold **not shown free** for regular booking and not offered to next request — this closes race "two clients book same slot" without blocking entire calendar: hold — one row, not visit status.
- Hold **never converts automatically**: only explicit client confirmation creates `Appointment` (with new `AgreedPrice` — price snapshot at confirmation moment, ADR 0006; discounts — current at that moment, DSC-001). Missed hold simply disappears.

### 4. One offer window — **15 minutes**, without repeat cascade

- Client has 15 min (admin setting). Expired or "Skip" → hold removed immediately and **same cancellation event reprocessed for next in queue** (new offer, new hold).
- Cascade limited by anti-spam threshold: 3 consecutive failures → request paused. This prevents "eating" queue by one inactive client, when evening slot offered to all in sequence.
- Offer one-time: no repeat push for same slot to same request.

### 5. Walk-in and reschedule don't compete with queue

- Walk-in (WALK-002) and admin reschedule validated against `Availability` + `OpeningHours` + chairs invariant **above holds**: hold-slots invisible, so conflict impossible.
- Barber doesn't receive pushes about queue: filling "earlier completed visit" — barber decision in chair (open question 14.2), not automation.

## Consequences

- **Pros**: freed slots distributed in seconds without manual labor; soft-hold cheap (one record, timer) and doesn't complicate `Appointment` state; FIFO by configuration fair and clear to client.
- **Cons/cost**: cancellation event now "heavier" (queue check); hold timers need expiration handling (check on calendar read + periodic cleanup).
- **Future**: if "Any barber" requests become dominant — prioritize by specific barber (config, not new model). Public "waitlist on site" without login — out of v1 feature (only push clients).

## Rejected alternatives

1. **Hold nothing, offer without hold** — two clients see same "free" slot and both press "Confirm"; would need conflict queue on booking. Worse than cheap hold.
2. **Auto-book slot by request without confirmation** (book, cancel if not confirmed) — client who confirmed later than other gets "occupied" slot; and phantom visits appear in calendar and CRM.
3. **Long window (hour+)** — slot dead in evening, when people don't see push; short window doesn't kill queue sense, because slot freed recently anyway.
