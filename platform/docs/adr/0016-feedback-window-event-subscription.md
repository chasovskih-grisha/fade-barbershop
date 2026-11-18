# ADR 0016. `feedback`: feedback window by `AppointmentCompleted` event (idempotent subscription)

- Status: accepted
- Date: 2026-09-11

## Context

Review right arises from `scheduling.AppointmentCompleted` event (FDB-001): submission window — **30 days** after completion (FDB-003, configurable), **one review per visit** (FDB-002), push "How did visit go?" — ~2 hours after completion, not more than one per visit (FDB-MOB-02). In phase 24 same moment becomes push of channel choice (private review or "Rate on Google" — GBP-003/004, two equal buttons in **one** message).

Subscription pattern already proven in ADR 0009 (`loyalty`): outbox `scheduling` (at-least-once) → application-handler → idempotent processing by `AppointmentId`, one transaction per message. This decision applies same pattern and fixes **differences**.

Three questions to close:

1. **How to model window** — calculate from visit time at each read or materialize.
2. **Who wakes push** — feedback handler, `notifications` or separate scheduler.
3. **Idempotency** — redelivery of `AppointmentCompleted` shouldn't create second window or second reminder.

Alternatives:

1. **Window calculated on the fly** (`completed visits where now < completedAt + 30d`) — no new state, but: window config change backdated moves open windows; no place for "reminder sent" flag (FDB-MOB-02); each surface pulls `scheduling`.
2. **Materialized window record on completed visit** — one entity, deduplication by key, reminder flags inside.
3. **`notifications` itself subscribes to `AppointmentCompleted`** — violates "no own business logic" (`notifications` — dumb sender) and spreads window rule across contexts.

## Decision

### 1. Materialized window — `FeedbackWindow`

- Aggregate **`FeedbackWindow`** (context `feedback`, one per `AppointmentId`): `appointmentId` (unique index — dedup key), `clientProfileId`, `barberId`, `locationId` (denormalized for "barber reviews" queries, admin filters), `completedAt`, **`windowEndsAt`** (duration snapshot from admin config at creation moment — config change doesn't move already open windows, same forward-only semantics as threshold T in ADR 0009), `remindedAt?`, `feedbackId?`, status `open | submitted | expired | closed`.
- **Visit without window has no review** — second half of FDB-001 guaranteed by structure: event published only on `completed`, so cancelled/no-show visits get no windows at all.
- Status: review submission → `submitted` + `feedbackId` (uniqueness = FDB-002 "one review per visit", enforcement at DB level); `windowEndsAt` passed → `expired` (lazy on read; periodic job — optional hygiene); review deletion by client before window end → back to `open` (FDB-WEB-03).

### 2. Subscription and push — fan-out, not chain

- `feedback` subscribes to `scheduling.AppointmentCompleted` **directly** via outbox — same fan-out as `loyalty` (ADR 0009): event distributed to all subscribers, contexts don't relay event to each other.
- Handler creates `FeedbackWindow` and publishes **`FeedbackWindowOpened`**. Delayed push (2h, FDB-MOB-02) — **delivery scheduling**, not business logic: delayed job queued on `FeedbackWindowOpened` processing, sending — via `notifications` (dumb sender). `remindedAt` flag on window guarantees "not more than one reminder" (FDB-MOB-02).
- In phase 24 this push becomes `ReviewChannelChoice` (two buttons) — **one message, not two**: private channel and Google channel offered in one reminder, symmetrically (GBP-004). No separate GBP subscription needed.

### 3. Idempotency — simpler than loyalty

- Redelivery of `AppointmentCompleted` → insert conflict by unique `appointmentId` → ignored. **Separate processed events table as in ADR 0009 not needed**: window record itself is dedup key (loyalty increments counter, so needs journal; here — upsert semantics).
- Single message processing — one transaction: insert window + outgoing event `FeedbackWindowOpened`.
- Test invariants: redelivery doesn't create second window and second push; on visit with `submitted` resubmission edits review, not creates new (FDB-002); window not opened on cancelled/no-show visit even with artificial event delivery.

## Consequences

- Same reliability pattern as ADR 0009 — team gets third subscriber to one event (`loyalty`, `feedback`, and `analytics` projections) without new mechanism.
- Window duration config (FDB-003) applies **only to future windows** — admin can't "close" already open windows backdated by one change (separate admin action if needed).
- `FeedbackWindow` — source of truth also for "visit → review" conversion statistics (future ANL extension): open/submitted/expired windows counted without joins with `scheduling`.
- Cost: one row per completed visit; grows with history — archive `expired` by age if needed.
