# T-4580 · Client Cabinet / My Visits Analytics (Web + Mobile)

- **Stage**: M3 (phase 3 — кабінет, phase 6 — mobile) · **Tags**: frontend, analytics, retention · **Complexity**: junior · **Depends on**: T-4575, T-4576, T-4578
- **StoryPoints**: 5

## What

Трекінг дій клієнта в кабінеті (web `/account*`) та вкладці «Мої візити» / «Профіль» (mobile). Retention метрики: Повторний запис, Loyalty progress, Referral sharing, Review submission.

### Події (згідно T-4576)

| Подія | Тригер | Властивості |
|-------|--------|-------------|
| `client_profile_viewed` | Відкриття `/account` (web) або таб «Профіль» (mobile) | `user_id`, `has_preferences`, `loyalty_visits_count`, `loyalty_free_visits_earned` |
| `client_profile_updated` | Збереження імені / вподобань | `fields_changed` (array: name, preferences), `preferences_length` |
| `client_appointments_viewed` | Відкриття `/account/appointments` (web) або таб «Мої візити» (mobile) | `upcoming_count`, `past_count`, `filter_tab` (upcoming/past/waitlist) |
| `client_appointment_detail_viewed` | Тап по картці візиту → розгорнута картка | `appointment_id`, `status`, `service_name`, `barber_name`, `location_code`, `has_reference`, `has_comment` |
| `client_deposit_paid` | Успішна оплата депозиту з картки візиту | `appointment_id`, `amount`, `payment_method`, `final_price` |
| `client_balance_paid` | Успішна оплата решти після візиту | `appointment_id`, `amount`, `payment_method`, `deposit_paid` (boolean) |
| `client_appointment_rescheduled` | Підтвердження перенесення (модалка) | `appointment_id`, `old_slot_start`, `new_slot_start`, `old_barber_id`, `new_barber_id`, `deposit_transferred` (boolean) |
| `client_appointment_cancelled` | Підтвердження скасування (діалог) | `appointment_id`, `cancellation_reason` (client_initiated, schedule_change, other), `deposit_refunded` (boolean), `hours_before_start` (int) |
| `client_review_submitted` | Submit форми відгуку (завершений візит) | `appointment_id`, `rating` (1-5), `has_text` (boolean), `text_length`, `photos_count` (0-3) |
| `client_review_edited` | Редагування відгуку в межах 30 днів | `appointment_id`, `rating_changed` (boolean), `text_changed` (boolean) |
| `client_review_deleted` | Видалення відгуку | `appointment_id`, `was_published` (boolean) |
| `client_loyalty_progress_viewed` | Відображення блоку лояльності (X/7) | `current_visits`, `visits_to_free`, `free_visits_earned_total` |
| `client_free_visit_granted` | Нарахування безкоштовного візиту (push/в кабінеті) | `free_visit_number` (7, 14, 21...), `trigger_appointment_id` |
| `client_free_visit_used` | Запис з використанням безкоштовного візиту | `appointment_id`, `free_visit_number`, `service_name`, `barber_name` |
| `client_referral_code_shared` | Клік «Поділитися» реферальним кодом | `share_channel` (native, copy_link, sms, email, messenger), `referral_code` |
| `client_referral_signup_viewed` | Відкриття екрану «Мої запрошення» | `invites_sent`, `invites_accepted`, `invites_completed`, `total_rewards_earned` |

### Імплементація

**Web (`apps/web/src/app/account/`):**
- `ClientCabinetAnalyticsProvider` в `layout.tsx` (account layout)
- Хук `useClientAnalytics()` — обгортає `amplitude.track`
- `page.tsx` (профіль): `client_profile_viewed` при mount, `client_profile_updated` в onSave
- `appointments/page.tsx`: `client_appointments_viewed` при mount, `client_appointment_detail_viewed` при розгортанні картки
- Дії в картці візиту: deposit/balance paid, reschedule, cancel, review — викликають відповідні треки
- Loyalty блок: `client_loyalty_progress_viewed` при render (якщо phase 11А ввімкнена)
- Referral: `client_referral_code_shared` при клік шарінгу, `client_referral_signup_viewed` при відкритті вкладки

**Mobile (`apps/mobile/(client)`):**
- Аналогічно в табах «Мої візити» (§4) і «Профіль» (§5) з `client-screens.md`
- Push notifications: при тапі по push про візит/оплату/генерацію — `client_appointment_detail_viewed` з `source: push`

### Acceptance Criteria

- [ ] Всі 17 подій стріляють на web (перевірка в Amplitude Live)
- [ ] Всі 17 подій стріляють на mobile
- [ ] `client_appointment_cancelled` має `hours_before_start` для аналізу late cancellations
- [ ] `client_review_submitted` має `rating`, `has_text`, `photos_count`
- [ ] Loyalty події (`*_granted`, `*_used`) стріляють тільки коли phase 11А активна
- [ ] Referral події стріляють тільки коли phase 21 активна
- [ ] Retention cohort в Amplitude: `client_appointment_detail_viewed` → `booking_started` (повторний запис)

## Why

Retention metrics: повторний запис, loyalty engagement, referral viral coefficient, review rate. Дані для win-back кампаній (phase 18) та KPI дашборду (ANL-009 RepeatBookingRate).

## Sources

- web-cabinet-screens.md §2-3 (профіль, візити, дії)
- client-screens.md §4-5 (Мої візити, Профіль)
- booking-flow.md (reschedule/cancel з кабінету)
- roadmap.md phase 11 (loyalty), phase 21 (referral), phase 12 (reviews)

## Done

- [ ] `ClientCabinetAnalyticsProvider` в `apps/web/src/app/account/layout.tsx`
- [ ] `useClientAnalytics` хук в `apps/web/src/lib/analytics/client.ts`
- [ ] Profile: `client_profile_viewed`, `client_profile_updated`
- [ ] Appointments list: `client_appointments_viewed`, `client_appointment_detail_viewed`
- [ ] Appointment actions: `client_deposit_paid`, `client_balance_paid`, `client_appointment_rescheduled`, `client_appointment_cancelled`
- [ ] Reviews: `client_review_submitted`, `client_review_edited`, `client_review_deleted`
- [ ] Loyalty: `client_loyalty_progress_viewed`, `client_free_visit_granted`, `client_free_visit_used`
- [ ] Referral: `client_referral_code_shared`, `client_referral_signup_viewed`
- [ ] Mobile: аналогічні події в `(client)` табах

## Risks

- [ ] **Duplicate events**: web + mobile — однаковий `user_id`, Amplitude deduplicates по `insert_id` (appointment_id + action)
- [ ] **Review window**: 30 днів — `client_review_submitted` тільки для завершених візитів у вікні
- [ ] **Free visit logic**: `client_free_visit_used` — Verify, що `is_free_visit: true` в `booking_confirmed` (T-4579)