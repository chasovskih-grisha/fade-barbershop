# ADR 0011. "Father + son": one package, two execution modes (`AppointmentParty`)

- Status: accepted
- Date: 2026-09-10

## Context

SKU `father-son` — Signature + Junior package for two people (hypothesis 3, school/lyceum near CLT-01). Client in app must choose **how** to execute:

1. **Sequential** — one barber, one chair.
2. **Parallel** — two barbers, two chairs, so wall-clock shorter (after school).

This not two prices and not two SKUs. This logistics of one service. Regular `Appointment` (one client, one barber, one chair) doesn't express this. Two separate `Appointment` in one `book` transaction break "one aggregate per transaction" rule.

At CLT-01 exactly **2 chairs**: parallel occupies entire hall while package goes.

## Alternatives

1. **Two SKUs** (`father-son-sequential` / `father-son-parallel`) — double price and menu; client doesn't understand this same ritual.
2. **Two `Appointment` + saga** — compensations, window between bookings, risk of one leg without other.
3. **One `Appointment` with two barbers** — barber calendar has no "my" visit; complete/no-show ambiguous.
4. **Aggregate `AppointmentParty` with two legs (`PartyLeg`)** — one transaction, one price, two projections in calendar.

## Decision

### Product

- One `service_id`: `father-son`. Package price — one per location, **same for both modes**.
- `FulfillmentMode`: `sequential` | `parallel`. Chosen **before** slot.
- Leg composition: father → `signature-haircut` (50 min); son → `junior-haircut` (45 min, up to 12 years).
- **Sequential**: one `BarberId`, one `ChairId`. Order fixed in v1: **son first, then father** (child doesn't wait 50 min). Package wall-clock **90 min** (tightly against 45+50).
- **Parallel**: two different barbers, two chairs, **common start**. Package wall-clock **50 min** (`max(50, 45)`). Son's leg frees chair after 45 min; father's leg holds its to 50.
- Parallel **unavailable** if interval doesn't have two active barbers and two free chairs. Show reason, not empty grid. Sequential remains.
- At point with 2 chairs parallel = hall only for this family for ~50 min. Visible in UI ("will occupy both chairs"), not surprise at reception.

### Domain (`scheduling`)

- Aggregate **`AppointmentParty`**: `PartyId`, `LocationId`, `ClientProfileId` (booker = father), `ServiceId = father-son`, `FulfillmentMode`, `AgreedPrice` (ADR 0006 lives **on party**, not on legs), `FinalPrice` / discounts (ADR 0007 — also on party).
- Child entities **`PartyLeg`** (not aggregates): `role: father | son`, component `ServiceId`, `BarberId`, `ChairId`, `duration`, optional `HaircutReferenceId` and `AppointmentComment` per leg, for son — `CompanionName` (mandatory name, no account in v1).
- `book` of party — **one transaction**, both legs or none. Cancellation / rescheduling — of entire party.
- Barber calendar shows **own leg** (projection), not second independent visit.
- Events: `AppointmentPartyBooked` (carries `AgreedPrice`, mode, legs), `AppointmentPartyCompleted` when **both** legs `complete`. Leg can `complete` separately (parallel: son earlier). `AppointmentCompleted` for loyalty — **only from father's leg** (see below).
- Solo visits remain aggregate `Appointment`. Chair occupancy counts both solo and party legs.

### Money, loyalty, feedback

- One `Payment` / one receipt per package. Receipt row v1: "Father + son", not 750+600.
- 42% commission: sequential — entire package base to one barber. Parallel — proportionally to component price (Signature : Junior), package discount divided same way.
- Loyalty: `ClientLoyaltyState` increment **once**, at completion of father's leg. Son without `ClientProfile` in v1 — has no counter. Party doesn't give father +2.
- Feedback: one per party, from booker.

### Booking (web + mobile)

After choosing `father-son`, **before** barber: mode step. Then:

- sequential — like regular flow (one barber or "any"), slot grid for 90 min;
- parallel — two barbers (default "any two free"; can specify two different), grid at start where both legs fit.

Son's name — before confirmation. Reference/comment — separately per leg (screen 4 split in two).

Walk-in: same mode choice; if second chair occupied — only sequential.

## Consequences

- Catalog holds one SKU; duration on card — "50 or 90 min", not one number.
- Phase 4 (`scheduling`) includes party; without this `father-son` in app — lie (only 90 min per master).
- 2 chairs invariant checked against legs, not "one visit = one chair".
- Test invariants: `book` doesn't leave one leg; parallel not created with one barber; package price change doesn't touch `AgreedPrice` of existing party; `AppointmentCompleted` of son's leg doesn't increment father's loyalty.
