# ADR 0006. Appointment price fixed at booking (`AgreedPrice`)

- Status: accepted
- Date: 2026-09-09

## Context

Prices live in `catalog` and set by locations (`MNG-ADM-11`). `Appointment` references `ServiceId`. If admin changes price after booking, client who agreed to 400 ₴ at booking shouldn't get bill for new amount: payment (`billing`), fiscal receipt Checkbox and possible disputes must rely on price client saw and confirmed. Criterion `MNG-ADM-13`: "Price change doesn't affect already created visits".

Alternatives:

1. **Resolve price from `catalog` at visit read time** — price change affects old visits (violates `MNG-ADM-13`), historical price impossible to reproduce.
2. **Version prices in `catalog` and store `PriceVersionId` on visit** — formally correct, but hard: price history, version resolve on read, migrations. Unjustified for network at start.
3. **Snapshot price on visit at booking** — simple, fully satisfies criterion, doesn't need price history in `catalog`.

## Decision

`Appointment` (context `scheduling`) at booking stores **`AgreedPrice`** — value object `{ amount, currency: UAH }`, taken from `catalog` at `book` moment. Sum unchanged for entire visit lifecycle. For package `father-son` snapshot lives on **`AppointmentParty`**, not on legs (ADR 0011).

- `Appointment` = `ServiceId` + `AgreedPrice`. Service name can change in `catalog` — not critical (shows current name); sum — no.
- Event `AppointmentBooked` carries `AgreedPrice`: `billing` initiates `Payment` exactly on this sum, receipt formed from it.
- Read models **never recalculate** visit price from `catalog`. If UI shows current price nearby — it labeled "current price" and doesn't affect bill.
- Exception: `loyalty` — free visit (`LYL-004`) sets payment sum 0 in `billing`; `AgreedPrice` on visit remains reference (fixes "what would cost").
- Admin: price matrix warns "Change applies only to new bookings" (`MNG-ADM-13`) — mechanism ensured by this decision.

## Consequences

- `catalog` — price source only for **new** bookings; for existing — `AgreedPrice` on visit.
- No price versions and migrations in `catalog` at start.
- Test invariant: price change in `catalog` doesn't change `AgreedPrice` of any existing visit.
- Compromise: if ever need "recalculate old visits" (backdated promo) — explicit separate operation, not automatic resolve.
