# Admin Panel — Calendar & Scheduling Domain

## Purpose
Network calendar view for the barbershop network. Handles day/week toggle, location and barber filtering, appointment cards, walk-in booking, and reschedule/cancel/no-show actions. Core scheduling invariants: 2 chairs per location, 15-min slots, availability within OpeningHours.

## Pages & Features
- **Network Calendar** (`/calendar`)
  - **Toolbar**: Day/Week toggle, Location filter (Network / CLT-01 / …), Barber filter, "With reference / Without reference / All" (REF-ADM-02), "Today" button
  - **Grid**: Columns = barbers (or chairs, invariant 2), Rows = time (15-min step); cells = appointments
  - **Cell appointment**: Client name, service, time badge; payment status badge (PAY-ADM-01); "Free" badge for 7th visit (LYL-ADM-05); reference marker (photo icon) if father-son party mode
  - **Click on appointment cell** → appointment card (modal right panel or full page)
  - **Click on free slot** → "Create appointment (walk-in)" — quick form: service, client (search/new), time (default "now"), comment (optional); then on-site payment (WALK-ADM-01, WALK-ADM-02)
  - **Empty state**: "No appointments for this date." Slot conflicts not possible (invariant phase 4)
  - **Waitlist-hold**: slot held by queue proposal shown shaded with "Awaiting confirmation (min)" label, not clickable for creation (`WTL-003`, ADR 0012)

- **Appointment Card** (5.2, referenced from calendar)
  - **Details**: Client (link to client card), Location, Barber, Time, Service, Appointment status, Payment status
  - **Haircut reference**: Miniature → full size (click); next to it — original client photo (if AI reference) and comment (REF-ADM-01). Without reference — section absent (REF-BARBER-04-semantics)
  - **Price breakdown**: Base (`AgreedPrice`) − discounts = Subtotal (`FinalPrice`); 0 UAH with reason `loyalty` for free visit (DSC-ADM-05, LYL-ADM-05)
  - **On-site payment block**: Deposit and remainder separately — "Deposit: paid (card, 14:02) • Remainder: 340 UAH to pay"; "Pay on site" button visible while unpaid part exists
    - Modal: format — Cash | Card POS (radio), amount shown not editable (`FinalPrice` − deposit)
    - Confirmation → `PaymentCaptured` (Payment #2) → status "Paid", line "Remainder: paid (cash/POS, HH:MM, admin)"
    - Checkbox on remainder amount — status after creation shows here: ⏳ `CREATED` → ✅ `DONE` (link to receipt) → ⚠️ `CANCELLED/ERROR` with reason and "Receipt" button (payment not reversed, PAY-ONS-03)
    - Re-click does not create second Payment/receipt (PAY-ONS-04); fact logged (who, when, form) — PAY-ONS-05
    - Same action for walk-in in barber mobile (`barber-screens.md` §1.3); mark appears in calendar after synchronization
  - **Actions**: Confirm (if pending), Reschedule, Cancel, Mark no-show
    - **Reschedule** → modal with new slot selection (same validation as booking flow)
    - **Cancel** → confirmation: "Appointment will be cancelled, client receives notification"; slot automatically re-promoted to queue (`WTL-003`)
    - **Mark no-show** → confirmation: "Appointment will be marked as no-show; deposit not returned" (`NSH-BAR-01`-semantics, NSH-ADM). Auto-fixation triggers without this button (NSH-001)
    - **Add to gallery** (after completion): before/after pair → moderation queue (§11, PRT-ADM)

- **Waitlist Integration**
  - Soft-hold (15 min) shown shaded with "Awaiting confirmation (min)" label
  - After confirmation → normal `Appointment`; cascade to next in queue
  - Anti-spam: 3 failed attempts → pause; 3 pause → 3-day hold; auto-release after 7 days
  - Manual slot release for first in queue (`WTL-ADM-02`)

## API Endpoints
- `GET /admin/calendar` — Grid read model (day/week, filters: location, barber, reference, status). Every visit carries `haircutReferenceId` **and** `referencePhotoUrl` — a signed reference-photo URL (15-min TTL, private bucket per ADR 0008 §2), so the day card renders the photo without a separate `GET /admin/reference-photos/:id` per visit. `referencePhotoUrl` is `null` when there is no reference photo or the photo row is missing/soft-deleted; on expiry the card falls back to the per-id endpoint.
- `POST /admin/bookings` — Create new booking (admin). Uses `BookSlotDto`: barberId?, locationId, dayOfWeek, start, end, serviceDuration? (default 30). Fetches real OpeningHours from LocationRepository, validates against slot, checks for free chairs, returns `{ id: booking.id }`. Conflict errors: `BookingConflictError` → 409 "No free chairs for this slot"; `InvalidSlotError` → 400.
- `GET /admin/barbers/:barberId/availability/:locationId` — Get barber availability for location (AdminAvailabilityController)
- `PATCH /admin/barbers/:barberId/availability` — Set barber availability windows (AdminAvailabilityController)
- Public slots: `GET /booking/slots` (BookingController) — returns available slots for given location, day, service; validates against OpeningHours and per-barber schedules

## DTOs (from codebase)
- `BookSlotDto`: barberId?, locationId, dayOfWeek, start (HH:mm), end (HH:mm), serviceDuration? (default 30)
- `TimeSlotData`: { dayOfWeek, start, end }
- `AvailableSlotDto`: { start, end, barbers: string[] }

## Entities & Values
| Entity | Fields |
|--------|--------|
| **Appointment** | id, client, barber, location, service, agreedPrice, finalPrice, status (booked/confirmed/completed/cancelled/no-show), paymentStatus, haircutReference?, partyLeg?, createdAt, updatedAt |
| **TimeSlot** | dayOfWeek, start (HH:mm), end (HH:mm), isFree, holdByWaitlist (min), bookedByAppointments |
| **OpeningHours** | days: { dayOfWeek, open (HH:mm), close (HH:mm), closed: boolean } |

## Business Rules
- **2 chairs invariant**: each location has exactly 2 slots available at any time; booking fills one slot
- **15-min slot step**: all time slots increment by 15 minutes
- **Availability within OpeningHours**: barber schedule cannot exceed location OpeningHours (warns but doesn't block in v1)
- **Appointment conflict**: saving schedule blocks if conflicts with existing appointments; must resolve all before save
- **Walk-in**: created without OTP, without deposit; same calendar/CRM/post-flow; payment on-site (cash/POS, checkbox receipt)
- **Father-son party mode**: `AppointmentParty` — sequential (90 min, queue) or parallel (50 min, two chairs, one price); same price, two legs, one `AgreedPrice`
- **Waitlist-hold**: slot held 15 min during queue proposal; not clickable for creation; auto-release after confirmation or 15 min expiry
- **No-show auto-fixation**: 15 min after slot time; deposit not returned; neutral push to client
- **Price breakdown**: `AgreedPrice` (snapshot at booking) − Σ discounts = `FinalPrice`; `FinalPrice` can be 0 for loyalty free visit

## Permissions
- `admin` role only (v1) for admin calendar
- Location filtering via `StaffAssignment` — barber only sees their assigned locations
- Direct URL access without role → 403
- Barber mobile has limited calendar view (own visits only, §2–3 in barber-screens.md)

## Development Notes
- Grid: columns = barbers (or chairs, invariant 2), rows = time slots with 15-min step
- Day/week toggle changes grid granularity; week view shows 7×96 cells, day view shows 1×96
- Click on free slot opens walk-in form pre-filled with slot time; service and client still required
- Appointment card price breakdown uses `AgreedPrice` snapshot; discounts applied at rendering time
- Payment on-site modal: cash/POS radio buttons; amount not editable; checkbox for remainder receipt
- No-show auto-fixation: backend event `AppointmentNoShowed` fires 15 min after slot start; UI shows badge but does not require manual action
- Waitlist-hold visual: shaded cell with "Awaiting confirmation (X min)" text; opacity reduced; not interactive
- Father-son party: `AppointmentParty` controller `POST /appointment-party`; `mode: sequential/parallel`; `agreedPriceId` shared

## Important Edge Cases
- Barber schedule exceeding location OpeningHours → yellow warning banner (not preventing save in v1)
- Walk-in booking: no deposit, no OTP; same post-flow (CRM, loyalty, push, payment receipt)
- No-show: auto-fixed after 15 min; deposit not returned; client receives neutral push
- Waitlist-hold: slot becomes available again if not confirmed within 15 min; visual cue only
- Father-son party: same price for both legs; one `AgreedPrice`; sequential/parallel mode affects duration and chair usage
- Calendar grid: conflicts not possible (invariant); but waitlist-hold cells are visually non-interactive

## Links to Related Documentation
- `docs/acceptance-criteria/04-admin-management.md` (MNG-ADM-15, REF-ADM-01…04)
- `docs/acceptance-criteria/09-walk-in-booking.md` (WALK-ADM-01…03)
- `docs/acceptance-criteria/14-waitlist-autofill.md` (WTL-ADM-01…04)
- `docs/ubiquitous-language.md` (Appointment, TimeSlot, Availability, OpeningHours, WalkIn, HaircutReference, AgreedPrice, FinalPrice)
- `docs/roadmap.md` (phases 4 — scheduling core, 15 — walk-in, 16 — no-show, 17 — waitlist)
- `products.md` (role matrix × screens, father-son party ADR 0011)
- `docs/adr/` (ADR 0012 — waitlist ADR, ADR 0011 — appointment party)
- `docs/admin-screens.md` (§5 — calendar network, appointment card)