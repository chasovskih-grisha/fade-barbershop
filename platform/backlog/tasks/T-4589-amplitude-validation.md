# T-4589 · Amplitude Event Taxonomy Validation & Dashboard Verification

- **Stage**: M5 (після фаз 3–8, перед запуском v1) · **Tags**: analytics, qa, validation, launch, backend · **Complexity**: middle · **Depends on**: T-4575, T-4576, T-4577, T-4578, T-4579, T-4580, T-4581, T-4582, T-4583, T-4584, T-4587, T-4588
- **StoryPoints**: 5

## What

Фінальна валідація всієї Amplitude імплементації: перевірка таксономії подій, якісність даних, дашборди, алерти, sign-off перед запуском v1.

### Validation Checklist

#### 1. Event Taxonomy Compliance (T-4576)
- [ ] Всі події в коді відповідають `docs/amplitude-event-taxonomy.md` (файл не створено — створюється на старті задачі) (назва, властивості, типи)
- [ ] Жодних недокументованих подій (grep по `amplitude.track` / `Amplitude.track` → порівняння з реєстром)
- [ ] Всі `insert_id` унікальні та детерміновані (event_name + entity_id + timestamp)
- [ ] `_schema_version` присутній в server-side подіях (T-4587)
- [ ] PII scan: CI пройшов (жодного phone/email/name в properties)

#### 2. Identity Resolution Verification
- [ ] Anonymous → Known merge: web session + OTP verify → один User Profile в Amplitude
- [ ] Cross-device: web login → mobile login (той самий телефон) → один User Profile
- [ ] `device_id` зберігається при app reinstall / browser clear cookies (Amplitude cookie / AsyncStorage)
- [ ] Logout не розриває профіль (Amplitude не підтримує unmerge — OK)

#### 3. Funnel Accuracy (End-to-End Tests)
| Funnel | Expected Steps | Validation |
|--------|----------------|------------|
| Acquisition | `page_view` → `cta_booking_click` → `booking_started` | > 80% `cta_booking_click` мають `booking_started` в 30хв |
| Auth | `auth_phone_submitted` → `auth_otp_verified` | Drop-off < 20% (SMS delivery) |
| Booking | `booking_started` → `booking_confirmed` | Overall conversion > 15%, по кроках — в нормі |
| Payment | `booking_payment_initiated` → `booking_payment_succeeded` | Success rate > 95% (excl. user abort) |
| Retention | `appointment_completed` (visit 1) → `booking_started` (visit 2) | RepeatBookingRate (ANL-009) tracked correctly |

#### 4. Server-Client Deduplication
- [ ] `booking_confirmed`: client + server → одна подія в Amplitude (дедуп по `insert_id`)
- [ ] `appointment_completed`: client (barber app) + server (domain event) → одна подія
- [ ] `payment_captured`: client (payment success) + server (webhook) → одна подія
- [ ] Перевірка в Amplitude Event Segmentation: unique events by `insert_id` = total sent / 2 (для дубльованих)

#### 5. KPI Dashboard Readiness (phase 14 — ANL-001…010, ANL-ADM-01…06)
- [ ] Amplitude Dashboard «Founder KPI» створено з charts:
  - Revenue Per Day (ANL-001) — daily line chart, by location
  - Chair Occupancy (ANL-002) — daily/weekly, by chair/barber
  - Avg Ticket (ANL-003) — daily, by barber/service
  - No-Show Rate (ANL-004) — daily, by barber
  - Conversion Rate (ANL-005) — daily, by entry_point
  - Discount Leakage (ANL-006) — by discount type, by promo code
  - Cancellation Rate (ANL-008) — daily, by barber
  - Repeat Booking Rate (ANL-009) — weekly, by barber
  - Chair Hour Revenue (ANL-010) — daily, by chair/barber
- [ ] Фільтри: period (day/week/month/custom), location, barber
- [ ] Tooltip з формулою + порівняння до попереднього періоду (▲/▼)
- [ ] Near-real-time: «сьогодні» оновлюється кожні 15 хв, «вчора» — фінальний

#### 6. Operational Dashboards
- [ ] **Marketing**: Acquisition funnel, CAC by `entry_point`/`utm_source`, LTV by cohort
- [ ] **Barber Efficiency**: Appointments/hour, No-show rate, Walk-in %, Avg service duration, Reference attach rate
- [ ] **Waitlist**: Join → Offer → Accept conversion, Time to accept, Queue length by config
- [ ] **Growth**: Loyalty engagement (progress viewed → free visit used), Referral funnel (shared → signup → first visit → reward), AI adoption (upload → generation → attach)
- [ ] **Gift Certificates**: Sold vs Redeemed, Breakage rate, Liability balance

#### 7. Alerting & Monitoring
- [ ] Amplitude Alert: `booking_confirmed` daily count < P10 (пिछлі 30 днів) → Slack #alerts
- [ ] Amplitude Alert: `payment_failed` rate > 5% → Slack #alerts
- [ ] Amplitude Alert: `appointment_no_show` rate > 15% → Slack #alerts
- [ ] Amplitude Alert: Outbox `failed` events > 0 → Slack #alerts (via backend metric)
- [ ] Data freshness: `event_time` lag < 5 хв (p95) для server-side подій

#### 8. Launch Sign-off
- [ ] Tech Lead review: таксономія, код, архітектура
- [ ] Founder demo: Dashboard walkthrough, funnel deep-dive
- [ ] Legal/Privacy sign-off: Consent flow, PII scan, DSAR tested, EU residency
- [ ] Go/No-Go decision documented в `docs/launch/amplitude-signoff.md`

### Acceptance Criteria

- [ ] 100% подій з реєстру (T-4576) реалізовані і проходять валідацію
- [ ] Жодних критичних багів в ідентифікації (duplicate users, lost merge)
- [ ] Всі 10 KPI метрик (ANL-001…010) розраховуються коректно з Amplitude даних (перевірка проти DB)
- [ ] Dashboard доступний ролі `admin`, не видимий `barber`/`client`
- [ ] Алерти налаштовані і тестовані (спричинені тестовими даними)
- [ ] Sign-off документ підписаний Tech Lead + Founder

## Why

Запуск без валідації = сліпі дані. Amplitude — джерело правди для бізнес-розділень (marketing, operations, finance). Помилки в подіях = неправильні рішення по цінах, маркетингу, штатному розкладу.

## Sources

- roadmap.md phase 14 (ANL-001…010, ANL-ADM-01…06 — жорстка вимога v1)
- acceptance-criteria/08-analytics-dashboard.md
- T-4576 (таксономія), T-4587 (server forwarding), T-4588 (privacy)
- docs/launch/checklist.md (загальний чеклист запуску)

## Done

- [ ] Automated validation script: `pnpm analytics:validate` (grep events, check schema, PII scan)
- [ ] Manual QA: E2E тест повного шляху (guest → booking → payment → visit → review) → перевірка в Amplitude Live
- [ ] Dashboard screenshots в `docs/launch/amplitude-dashboard-{date}.png`
- [ ] Alert test results в `docs/launch/amplitude-alerts-test.md`
- [ ] Sign-off: `docs/launch/amplitude-signoff.md` з підписами

## Risks

- [ ] **Time pressure**: валідація потребує часу — починати паралльно з фазою 8 (billing), не в останній день
- [ ] **Data discrepancies**: Amplitude vs DB mismatch > 5% — розслідування може зайняти дні. Mitigation: server-side = source of truth, client-side = enrichment
- [ ] **Amplitude limits**: MTU (Monthly Tracked Users) на плані — Verify квоти перед запуском
- [ ] **Schema changes post-launch**: версіонування подій (`_v2`) + backward compatibility 90 днів