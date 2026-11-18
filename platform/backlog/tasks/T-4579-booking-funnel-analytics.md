# T-4579 · Booking Funnel Analytics (Multi-step Flow Web + Mobile)

- **Stage**: M3 (phase 4 — scheduling, паралельно з фазою 3/6) · **Tags**: frontend, analytics, conversion · **Complexity**: middle · **Depends on**: T-4575, T-4576, T-4578, T-041
- **StoryPoints**: 8

## What

Повний трекінг воронки запису (6-7 кроків) на web (`/booking`) і mobile (`(client)/booking/*`). Кожен крок = подія з властивостями для аналізу drop-off, конверсії по сегментах, A/B тестування.

### Події (згідно T-4576)

| Подія | Крок | Тригер | Ключові властивості |
|-------|------|--------|---------------------|
| `booking_started` | 0 | Вхід на `/booking` або deep-link `/booking?location=CODE` | `entry_point` (direct, cta_hero, cta_location, cta_service, cta_barber, deep_link, qr_code), `location_code?`, `utm_*` |
| `booking_location_selected` | 0 | Клік «Обрати» локації | `location_code`, `location_name`, `chairs_count` |
| `booking_service_selected` | 1 | Вибір послуги + клік «Далі» | `service_id`, `service_name`, `category`, `price`, `duration_min`, `is_party_package` (boolean) |
| `booking_party_mode_selected` | 1б | Вибір режиму (father-son) + «Далі» | `party_mode` (sequential/parallel), `total_duration_min`, `total_price` |
| `booking_barber_selected` | 2 | Вибір барбера / «Будь-який» / «Будь-які два» + «Далі» | `barber_id` (null = any), `barber_name`, `is_any_barber` (boolean), `is_parallel_two_barbers` (boolean) |
| `booking_slot_selected` | 3 | Вибір слота + «Далі» | `slot_start_iso`, `slot_end_iso`, `barber_id`, `barber_name`, `days_ahead` (int), `is_preferred_time` (boolean) |
| `booking_reference_selected` | 4 | Вибір sources референсу + «Далі» | `reference_source` (ai_gallery, upload, none), `reference_id?`, `ai_variant_id?`, `has_comment` (boolean), `comment_length` |
| `booking_promo_applied` | 5 | Успішна валідація промокоду (інлайн) | `promo_code`, `discount_type` (percent/fixed), `discount_amount`, `discount_percent`, `final_price_after` |
| `booking_promo_failed` | 5 | Помилка промокоду | `promo_code`, `error_code` (invalid, expired, limit_exceeded, not_applicable) |
| `booking_confirmed` | 5 | Клік «Підтвердити» / «Сплатити депозит» → API 201 | `appointment_id`, `appointment_number`, `final_price`, `deposit_amount`, `deposit_percent`, `is_free_visit` (boolean), `loyalty_visit_number?`, `payment_method?` |
| `booking_payment_initiated` | 5 | Redirect до еквайрингу / відкриття платіжного віджета | `appointment_id`, `amount`, `currency`, `payment_gateway` |
| `booking_payment_succeeded` | 5 | Успішний callback від еквайрингу / webhook | `appointment_id`, `transaction_id`, `amount`, `payment_method`, `gateway_response_code` |
| `booking_payment_failed` | 5 | Помилка оплати / timeout | `appointment_id`, `error_code`, `error_message`, `retry_available` (boolean) |
| `booking_abandoned` | Any | Вихід з флоу без завершення (beforeunload / tab close / back navigation) | `last_completed_step` (0-5), `time_in_flow_sec`, `abandon_reason` (navigation, close, timeout, error) |

### Імплементація

**Web (`apps/web/src/app/booking/`):**
- Створюємо `BookingAnalyticsProvider` (context) в `page.tsx` — зберігає стан воронки (`currentStep`, `stepData`, `startTime`)
- Хук `useBookingAnalytics()` — `trackStep(stepName, props)` + автоматичний `booking_abandoned` в `useEffect` cleanup
- Кожен `Step` компонент (ServiceStep, BarberStep, SlotStep, CommentStep, SuccessStep) викликає `trackStep` при переході «Далі»
- Promo код: `track('booking_promo_applied'/'booking_promo_failed')` в onChange/onBlur
- Оплата: `booking_payment_initiated` перед redirect, `booking_payment_succeeded/failed` в success/error callbackах
- `booking_confirmed` — в `SuccessStep` при mount (appointment створено)

**Mobile (`apps/mobile/(client)/booking/*`):**
- Аналогічна архітектура з `BookingAnalyticsContext` в Expo Router layout
- Кожен screen — виклик `trackStep` при натисканні «Далі»
- Deep link handling: `booking_started` з `entry_point: deep_link`

**Funnel Analysis в Amplitude:**
- Funnel: `booking_started` → `booking_location_selected` → `booking_service_selected` → `booking_barber_selected` → `booking_slot_selected` → `booking_reference_selected` → `booking_confirmed`
- Segment by: `entry_point`, `location_code`, `service_category`, `is_party_package`, `is_free_visit`, `device_type` (web/mobile)
- Conversion window: 30 хв (типова сесія запису)

### Acceptance Criteria

- [ ] Усі 14 подій стріляють на web (перевірка в Amplitude Live)
- [ ] Усі 14 подій стріляють на mobile (перевірка в Amplitude Live)
- [ ] `booking_abandoned` фіксує вихід на кожному кроці з правильним `last_completed_step`
- [ ] `entry_point` коректно визначений для всіх сценаріїв входу
- [ ] `booking_confirmed` має `appointment_id`, `final_price`, `is_free_visit`
- [ ] Payment події (`*_initiated/succeeded/failed`) стріляють коректно
- [ ] Funnel в Amplitude показує drop-off по кроках з сегментацією

## Why

Booking funnel — головна конверсійна воронка бізнесу. Drop-off анализ по кроках → UX покращення. Сегментація по `entry_point` → marketing ROI.

## Sources

- booking-flow.md (кроки 0–5, wireframes, стани)
- client-screens.md (mobile booking — той самий flow)
- products.md §1/§3 (запис через сайт і додаток)
- T-4403 (GA4 funnel events — переносимо в Amplitude)

## Done

- [ ] `BookingAnalyticsProvider` + `useBookingAnalytics` в `apps/web/src/app/booking/`
- [ ] Інтеграція в ServiceStep, BarberStep, SlotStep, CommentStep, SuccessStep (web)
- [ ] Mobile: аналогічний context + інтеграція в screens
- [ ] Promo код tracking (applied/failed)
- [ ] Payment tracking (initiated/succeeded/failed)
- [ ] Abandonment tracking (beforeunload/cleanup)
- [ ] Amplitude Funnel створено з правильними кроками

## Risks

- [ ] **Race conditions**: паралельні події (наприклад, швидкий клік «Далі» двічі) — використовувати `insert_id` = `appointment_id` + `step_name` для ідемпотентності
- [ ] **Payment redirect**: web → externall gateway → back. `booking_payment_succeeded` може прийти через webhook (server-side) — дублювати в T-4587
- [ ] **Party mode**: father-son має додатковий крок 1б — флгечити в подіях (`is_party_package`, `party_mode`)
- [ ] **Free visit (loyalty)**: 7-й візит безкоштовно — `is_free_visit: true`, `final_price = 0`, payment події не стріляють