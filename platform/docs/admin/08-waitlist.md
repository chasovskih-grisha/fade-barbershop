# Admin Panel — Waitlist Domain

## Purpose
Management of the client waitlist queue. Handles queue configuration (location + service + barber/ "Any"), soft-hold (15 min), pause (3 days), auto-release after 7 days, and manual slot release for first in queue. Core flow: slot becomes free (cancel/no-show) → Soft-hold 15 min → Push to first in queue → Confirmation → Normal Appointment.

## Pages & Features
- **Queue List** (`WTL-ADM-01…04`)
  - **Layout**: Top — queue configurations (location + service + barber/"Any") with count of waiting clients; Expand → list of requests
  - **Request columns**: Client, Request date, Date window, Accuracy ("On time" / "I'll manage"), Status (Active / On pause / Has proposal)
  - **Actions** (`WTL-ADM-02`):
    - Add client (from client card, §6)
    - Delete request
    - Pause / Resume pause
    - **"Give slot now"** — manually trigger hold→push→confirm flow for first in queue
  - **Settings** (`WTL-ADM-03`):
    - Confirmation window: 15 min (clients have 15 min to confirm the proposed slot)
    - Soft-hold duration: 15 min (default, configurable)
    - Pause threshold: 3 failed attempts → pause
    - Auto-release: after 7 days if not confirmed
  - **Empty state**: "No waiting clients for selected configuration."

- **Waitlist Mechanics**
  - **Soft-hold (SlotHold)**: When a slot becomes free (cancel/no-show), it enters hold state for 15 min. Shown shaded in calendar with "Awaiting confirmation (min)" label. Not clickable for new creation.
  - **Push to first in queue**: After 15 min hold, the first client in the relevant queue is pushed a notification with the proposed slot. Client has 15 min to confirm.
  - **Confirmation**: Client confirms → normal `Appointment` created; slot released from hold; cascade to next in queue if any.
  - **Anti-spam**: 3 failed confirmations in a row → client moved to pause state (3-day hold); cannot be pushed during pause.
  - **Auto-release**: If not confirmed within 7 days, the hold is automatically released and client is removed from active queue.
  - **Manual "Give slot now"**: Admin can bypass the hold and push the first client immediately; used when slot has been waiting long or for operational reasons.

## API Endpoints
Waitlist API under the scheduling module:

- `GET /admin/waitlist/queues` — List queue configurations with waiting client counts
- `GET /admin/waitlist/requests?configId=` — List waiting requests for a configuration
- `POST /admin/waitlist/requests` — Add client to waitlist (from client card)
- `DELETE /admin/waitlist/requests/:id` — Remove client from waitlist
- `POST /admin/waitlist/:configId/pause` — Put first request on pause (3-day hold)
- `POST /admin/waitlist/:configId/resume` — Resume paused request
- `POST /admin/waitlist/:configId/give-slot` — Manually trigger hold→push→confirm for first in queue
- `GET /admin/waitlist/settings` — Get current settings (confirm window, hold duration, pause threshold, auto-release)

## DTOs (inferred)
- `WaitlistConfig`: locationId, serviceId?, barberId?, accuracy ("on-time" / "manage"), confirmationWindowMin (default 15), pauseThreshold (default 3), autoReleaseDays (default 7)
- `WaitlistRequest`: clientId, configId, requestedAt, accuracy, status (active/paused/has-proposal), proposalSlot?, proposalExpiresAt
- `WaitlistSettings`: confirmationWindowMin, holdDurationMin, pauseThreshold, autoReleaseDays

## Business Rules
- **Queue configuration**: Each waitlist entry is configured by (location + service + barber/"Any") — FIFO order within that configuration
- **Soft-hold 15 min**: Slot held for 15 min during queue proposal; visual cue in calendar only; not a booking
- **Confirmation window**: Client has 15 min (configurable) to confirm proposed slot; after expiry, hold released, next in queue pushed
- **Pause**: After 3 failed attempts, client enters 3-day pause; cannot be pushed during pause; manual admin resume required
- **Auto-release**: After 7 days unconfirmed, hold released, client removed from active queue
- **First in queue gets slot**: When slot becomes free, only the first client in the relevant configuration is pushed; others remain waiting
- **Anti-spam cascade**: 3 pauses → client excluded from queue until admin manually reactivates; logged for audit

## Permissions
- `admin` role only (v1)
- `location_manager` (phase 9+): own location waitlist only
- Direct URL access without role → 403
- Barber: no access to admin waitlist (mobile has separate waitlist flow)

## Development Notes
- Queue configurations are persistent; new configurations can be created for any location/service/barber combination
- Soft-hold visual: shaded cell in calendar, opacity reduced, text "Awaiting confirmation (X min)" — non-interactive
- Pause state: client marked as "on pause" in waitlist DB; 3-day countdown; admin can manually resume
- Auto-release: cron-like or event-driven; after 7 days from proposal if no confirmation
- "Give slot now": admin action that bypasses 15-min hold; still validates client is eligible for the slot
- Waitlist requests linked to `ClientProfile`; client can only be in one waitlist at a time per configuration

## Important Edge Cases
- Client can only be in one waitlist configuration at a time; adding to new configuration removes from old
- "Give slot now" bypasses 15-min hold but still validates client eligibility and slot availability
- 3 failed confirmations → 3-day pause; admin must manually resume; automatic resume not supported
- Auto-release after 7 days: client reclaimed from queue; slot becomes free for new bookings
- Waitlist configurations with "Any barber": slot available to any barber with OpeningHours coverage
- Pause threshold of 3 applies per-client; separate from no-show count (NSH-001)
- If waitlist configuration has no clients, "Give slot now" has no effect (silent or info message)

## Links to Related Documentation
- `docs/acceptance-criteria/14-waitlist-autofill.md` (WTL-ADM-01…04)
- `docs/acceptance-criteria/09-walk-in-booking.md` (WALK-ADM-01 — walk-in creates same flow)
- `docs/acceptance-criteria/16-no-show-policy.md` (NSH-001, NSH-ADM — no-show as waitlist source)
- `docs/ubiquitous-language.md` (WaitlistEntry, SlotHold, SlotOffer, ClientConsent, Accuracy)
- `docs/roadmap.md` (phase 17 — waitlist with autofill; phase 16 — no-show policy integration)
- `docs/admin-screens.md` (§9 — waitlist)
- `docs/adr/` (ADR 0012 — waitlist hold/pause/auto-release mechanics)