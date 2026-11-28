# T-4576 · Core Amplitude Event Taxonomy Definition

- **Stage**: M2 (перед фазою 3) · **Tags**: analytics, design, documentation · **Complexity**: middle · **Depends on**: T-4575
- **StoryPoints**: 3

## What

Визначення єдиної таксономії подій для Amplitude: іменування, структура властивостей, ідентифікатори, версіонування. Документ стає джерелом правди для всіх імплементацій (web, mobile, backend).

### Naming Convention
- **Event names**: `snake_case`, префікс домену: `booking_`, `auth_`, `appointment_`, `client_`, `barber_`, `admin_`, `loyalty_`, `referral_`, `ai_`, `gift_`, `waitlist_`, `walkin_`
- **Property names**: `snake_case`, префіксно: `booking_`, `appointment_`, `client_`, `service_`, `barber_`, `location_`, `payment_`, `discount_`
- **Reserved properties** (автоматично Amplitude): `user_id`, `device_id`, `session_id`, `event_id`, `insert_id`, `timestamp`, `platform`, `os_name`, `os_version`, `device_model`, `language`, `country`, `city`, `ip_address` (вимкнено)

### Identity Resolution Strategy
- **Anonymous**: `device_id` (Amplitude генерує) — до OTP verify
- **Known**: `user_id` = `User.id` (UUID з DB) — після успішного OTP
- **Merge**: Amplitude Identity API (`identify` з `$device_id` + `$user_id`) при `verifyOtp` успіху
- **Cross-platform**: однаковий `user_id` на web і mobile (один User на телефон)

### Event Schema Template (для кожної події)
```typescript
interface EventDef {
  name: string;                    // унікальна назва
  trigger: string;                 // коли стріляє (UI action / API endpoint / domain event)
  properties: PropertyDef[];       // властивості з типами
  user_identifiers: {              // що надсилаємо для ідентифікації
    user_id?: boolean;             // true якщо користувач залогінений
    device_id?: boolean;           // true для анонімних
  };
  implementation_location: string; // файл/компонент/handler
  dependencies: string[];          // інші події/таски
  acceptance_criteria: string[];   // як Verify
}
```

### Core Event Categories (план)
1. **Acquisition** (web): `page_view`, `cta_booking_click`, `location_select`, `service_view`, `barber_view`
2. **Authentication**: `auth_phone_submitted`, `auth_otp_submitted`, `auth_otp_verified`, `auth_otp_failed`, `auth_otp_resent`
3. **Booking Funnel**: `booking_started`, `booking_location_selected`, `booking_service_selected`, `booking_party_mode_selected`, `booking_barber_selected`, `booking_slot_selected`, `booking_reference_selected`, `booking_comment_added`, `booking_promo_applied`, `booking_confirmed`, `booking_payment_initiated`, `booking_payment_succeeded`, `booking_payment_failed`
4. **Client Cabinet**: `client_profile_viewed`, `client_profile_updated`, `client_appointments_viewed`, `client_appointment_detail_viewed`, `client_deposit_paid`, `client_balance_paid`, `client_appointment_rescheduled`, `client_appointment_cancelled`, `client_review_submitted`
5. **Barber App**: `barber_calendar_viewed`, `barber_walkin_created`, `barber_walkin_started`, `barber_walkin_completed`, `barber_walkin_paid`, `barber_appointment_confirmed`, `barber_appointment_started`, `barber_appointment_completed`, `barber_appointment_no_show`, `barber_client_card_viewed`, `barber_note_added`
6. **Admin**: `admin_dashboard_viewed`, `admin_analytics_viewed`, `admin_location_created`, `admin_service_created`, `admin_barber_created`
7. **Loyalty/Referral**: `loyalty_progress_viewed`, `loyalty_free_visit_granted`, `loyalty_free_visit_used`, `referral_code_shared`, `referral_signup`, `referral_reward_earned`
8. **AI Haircut**: `ai_haircut_upload`, `ai_haircut_consent`, `ai_generation_requested`, `ai_generation_completed`, `ai_variant_selected`, `ai_variant_attached`
9. **Gift Certificates**: `gift_certificate_purchased`, `gift_certificate_redeemed`, `gift_certificate_balance_viewed`
10. **Waitlist**: `waitlist_joined`, `waitlist_offer_received`, `waitlist_offer_accepted`, `waitlist_offer_declined`, `waitlist_offer_expired`
11. **Walk-in**: `walkin_created`, `walkin_started`, `walkin_completed`, `walkin_paid_on_site`

### Versioning
- Схема версіонується: `v1`, `v2`... в `event_properties._schema_version`
- Брейкінг зміни — нова подія з суфіксом `_v2`, стара deprecated

## Why

Без єдиної таксономії: дублікати подій, несумісні властивості, неможливості аналізу в Amplitude, хаос при змінах.

## Sources

- booking-flow.md (кроки 0–5)
- client-screens.md, barber-screens.md, web-cabinet-screens.md
- products.md, roadmap.md phase 14
- T-4403 (GA4 events → перенести в Amplitude)

## Done

- [ ] Markdown документ `docs/amplitude-event-taxonomy.md` (файл не створено — створюється на старті задачі) з повним переліком подій
- [ ] TypeScript типи в `packages/contracts/src/analytics/events.ts` (shared types для web/mobile/api)
- [ ] Таблиця відповідності: GA4 event name → Amplitude event name (для міграції T-4403)
- [ ] Code review: таксономія затверджена tech lead'ом

## Risks

- [ ] **Over-tracking**: не створювати подію на кожен клік — лише business-meaningful steps
- [ ] **Property explosion**: обмежити до 10-15 властивостей на подію, решта — в окремі lookup таблиці
- [ ] **Schema drift**: CI гейт — валідація подій проти схем (amplitude-js typegen або custom script)

## Gate evidence (T-5015)

`agent-gate qa` cannot finish this row under the current rules: `qaTask` requires the review commit to
contain a test file listed in the plan (`review does not add a test from the implementation plan`), and
this task's deliverable is a taxonomy document. No seat owns `docs/` — `frontend` owns only
`apps/web`, `backend` owns `apps/api` and `packages/`, `qa` owns `apps/api/src/e2e` — so a docs-only
diff can never satisfy `reviewGaps` (≥3 code lines in an owned product file plus a new `it(`) either.
The plan is therefore a document review, not an executable check, and the row stays in `review` until
a seat that owns documentation exists.
