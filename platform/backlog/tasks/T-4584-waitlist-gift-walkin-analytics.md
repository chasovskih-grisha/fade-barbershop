# T-4584 · Waitlist, Gift Certificates & Walk-in Analytics

- **Stage**: M4 (phase 17 — waitlist, phase 20 — gift certificates, phase 15 — walk-in) · **Tags**: frontend, analytics, operations · **Complexity**: middle · **Dependencies**: T-4575, T-4576, T-4579, T-4581
- **StoryPoints**: 5

## What

Tracking operational features: wait queue (waitlist), gift certificates, walk-in booking (parties from T-4581 partially). Queue conversion, certificate breakage, walk-in share.

### Events (per T-4576)

#### Waitlist (Phase 17)
| Event | Trigger | Properties |
|-------|--------|-------------|
| `waitlist_joined` | Submit "Notify if freed" form (web slot step / mobile) | `waitlist_id`, `configuration_id` (location+service+barber), `date_window_start`, `date_window_end`, `position_in_queue` |
| `waitlist_offer_received` | Push/notification about freed slot (server → client) | `waitlist_id`, `offer_id`, `slot_start_iso`, `barber_id`, `price`, `offer_expires_at_iso`, `channel` (push, in_app) |
| `waitlist_offer_accepted` | Click "Confirm booking" in offer screen (mobile) | `offer_id`, `waitlist_id`, `appointment_id` (created), `time_to_accept_sec` |
| `waitlist_offer_declined` | Click "Skip" in offer screen | `offer_id`, `waitlist_id`, `time_to_decline_sec` |
| `waitlist_offer_expired` | 15 min timer ended (server cron) | `offer_id`, `waitlist_id`, `auto_declined` (boolean) |
| `waitlist_left` | Click "Unsubscribe" in queue (web/mobile) | `waitlist_id`, `position_at_exit`, `time_in_queue_min` |
| `waitlist_paused` | Click "Pause" in queue | `waitlist_id`, `pause_reason?` |
| `waitlist_resumed` | Click "Resume" after pause | `waitlist_id`, `paused_duration_min` |

#### Gift Certificates (Phase 20)
| Event | Trigger | Properties |
|-------|--------|-------------|
| `gift_certificate_purchased` | Successful certificate payment (web `/gift` / admin POS) | `certificate_id`, `amount`, `buyer_user_id?`, `recipient_phone?`, `purchase_channel` (web, admin_pos, walkin_pos) |
| `gift_certificate_redeemed` | Certificate redemption on booking/payment | `certificate_id`, `appointment_id`, `redeemed_amount`, `remaining_balance`, `redemption_channel` (web_booking, mobile_booking, admin_pos, walkin_pos) |
| `gift_certificate_balance_viewed` | Balance view (web cabinet / mobile profile / admin) | `certificate_id`, `current_balance`, `original_amount`, `days_to_expiry` |
| `gift_certificate_expired` | Certificate expiration (server cron) | `certificate_id`, `original_amount`, `unused_balance` (breakage), `purchased_at_iso` |
| `gift_certificate_cancelled` | Cancellation by admin / buyer (before redemption) | `certificate_id`, `reason`, `refunded_amount` |

#### Walk-in (Phase 15) — supplement to T-4581
| Event | Trigger | Properties |
|-------|--------|-------------|
| `walkin_created_admin` | Admin creates walk-in in web admin (network calendar) | `appointment_id`, `service_id`, `barber_id`, `location_code`, `client_phone_provided`, `created_by_admin_id` |
| `walkin_payment_on_site_admin` | Admin marks "Paid on site" | `appointment_id`, `amount`, `payment_method`, `marked_by_admin_id` |

### Implementation

**Web (`apps/web`):**
- Booking slot step (SlotStep): `waitlist_joined` on waitlist form submit
- Gift purchase (`/gift` — new route): `gift_certificate_purchased` on successful payment
- Client cabinet: `gift_certificate_balance_viewed` in certificates section

**Mobile (`apps/mobile/(client)`):**
- Waitlist screen (§6 queue): `waitlist_joined`, `waitlist_offer_received` (push handler), `waitlist_offer_accepted/declined` (offer screen), `waitlist_left/paused/resumed`
- Gift certificates (§5): `gift_certificate_balance_viewed`

**Admin (`apps/admin`):**
- Calendar: `walkin_created_admin` on admin creation
- Payments: `walkin_payment_on_site_admin`, `gift_certificate_purchased` (POS)

**Backend (`apps/api`):**
- Waitlist cron: `waitlist_offer_received` (push send), `waitlist_offer_expired` (timer)
- Gift certificates: `gift_certificate_redeemed` (on apply), `gift_certificate_expired` (cron), `gift_certificate_cancelled` (admin action)

### Acceptance Criteria

- [ ] Waitlist: `waitlist_joined` → `waitlist_offer_received` → `waitlist_offer_accepted/expired` funnel in Amplitude
- [ ] Waitlist: `time_to_accept_sec` median < 300s (5 min) — operational KPI
- [ ] Gift: `gift_certificate_purchased` → `gift_certificate_redeemed` conversion rate
- [ ] Gift: `gift_certificate_expired` → `unused_balance` = breakage (ANL-010 CertificateBreakage)
- [ ] Walk-in admin: events duplicate barber mobile (T-4581) with `source: admin`
- [ ] Amplitude: Waitlist conversion dashboard, Gift certificate lifecycle, Walk-in share % (walkin / total appointments)

## Why

Waitlist conversion → revenue recovery (WTL-ADM-04). Gift breakage → pure margin (ANL-010). Walk-in share → operational capacity planning.

## Requirement sources

- roadmap.md phase 17 (waitlist WTL-*), phase 20 (gift certificates GFT-*), phase 15 (walk-in WALK-*)
- client-screens.md §4 (queue), §5 (certificates)
- barber-screens.md §1 (walk-in)
- admin-screens.md (network calendar, payments)
- acceptance-criteria/14-waitlist-autofill.md, 16-gift-certificates.md, 09-walk-in-booking.md

## Done

- [ ] Web: `waitlist_joined` in SlotStep, `gift_certificate_purchased` in `/gift`, `gift_certificate_balance_viewed` in cabinet
- [ ] Mobile: Waitlist screen events, Gift balance view
- [ ] Admin: `walkin_created_admin`, `walkin_payment_on_site_admin`, `gift_certificate_purchased` (POS)
- [ ] Backend: Waitlist cron events, Gift redemption/expired/cancelled
- [ ] Amplitude: Waitlist funnel, Gift lifecycle cohort, Walk-in share chart

## Risks

- [ ] **Push delivery**: `waitlist_offer_received` may not arrive (push token invalid) — server-side duplicate in Amplitude (T-4587)
- [ ] **Certificate liability**: `gift_certificate_purchased` without `redeemed` = liability on balance (CertificateLiability, ANL-010)
- [ ] **Waitlist spam**: `waitlist_joined` without limits — rate limit in API, track `waitlist_left` for churn analysis
- [ ] **Idempotency**: `waitlist_offer_accepted` → `appointment_id` — `insert_id` = offer_id for dedup
