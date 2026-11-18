# T-4581 · Barber Mobile App Analytics (Walk-in, Calendar, Client Card)

- **Stage**: M4 (phase 7 — барбер у mobile, phase 15 — walk-in) · **Tags**: frontend, analytics, operations · **Complexity**: middle · **Depends on**: T-4575, T-4576, T-4578
- **StoryPoints**: 5

## What

Трекінг дій барбера в mobile app: walk-in створення, календар, зміна статусів візиту, картка клієнта, нотатки. Операційні метрики для KPI дашборду (no-show rate, chair occupancy, walk-in share).

### Події (згідно T-4576)

| Подія | Тригер | Властивості |
|-------|--------|-------------|
| `barber_calendar_day_viewed` | Відкриття календаря дня (таб 1) | `date`, `appointments_count`, `chairs_occupied_now` (0-2) |
| `barber_calendar_week_viewed` | Відкриття календаря тижня (таб 2) | `week_start`, `total_appointments`, `avg_daily_occupancy` |
| `barber_walkin_started` | Клік FAB «Walk-in» (календар дня) | `chairs_available` (1-2), `current_time_iso` |
| `barber_walkin_created` | Submit форми walk-in → API 201 | `appointment_id`, `service_id`, `service_name`, `price`, `is_new_client` (boolean), `client_phone_provided` (boolean), `party_mode?` |
| `barber_walkin_started_service` | Клік «Почати» на walk-in візиті (status: confirmed) | `appointment_id`, `time_to_start_min` (від створення до старту) |
| `barber_walkin_completed` | Клік «Завершити» → status: completed | `appointment_id`, `duration_min` (actual), `has_reference`, `has_comment` |
| `barber_walkin_paid_on_site` | Клік «Оплачено на місці» (готівка/POS) | `appointment_id`, `amount`, `payment_method` (cash, card_pos) |
| `barber_appointment_confirmed` | Клік «Підтвердити» (booked → confirmed) | `appointment_id`, `deposit_paid` (boolean), `client_name` |
| `barber_appointment_started` | Клік «Почати» (confirmed → in_progress) | `appointment_id`, `delay_min` (so scheduled vs actual start) |
| `barber_appointment_completed` | Клік «Завершити» (in_progress → completed) + підтвердження | `appointment_id`, `duration_min`, `has_reference`, `has_comment`, `is_party_leg` (boolean) |
| `barber_appointment_no_show` | Клік «Позначити no-show» + підтвердження | `appointment_id`, `minutes_after_slot` (int), `was_auto_no_show` (boolean) |
| `barber_client_card_viewed` | Тап на блок клієнта в картці візиту → повна картка | `client_id`, `client_since_date`, `total_visits_with_barber`, `has_preferences`, `notes_count` |
| `barber_client_note_added` | Submit «Add нотатку» в картці клієнта | `client_id`, `note_length`, `visit_id_context?` |
| `barber_schedule_edited` | Збереження графіку (phase 22, з дозволом адміна) | `week_start`, `windows_added`, `windows_removed`, `holidays_added`, `conflicts_blocked` (boolean) |
| `barber_push_received` | Отримання push (новий запис, скасування, перенесення, AI ready) | `push_type` (new_booking, cancellation, reschedule, ai_ready, waitlist_offer), `appointment_id?` |

### Імплементація

**Mobile (`apps/mobile/(barber)`):**
- `BarberAnalyticsProvider` в root layout `(barber)/_layout.tsx`
- Хук `useBarberAnalytics()` в `src/lib/analytics/barber.ts`
- Календар (§2): `barber_calendar_day_viewed`/`week_viewed` при mount/focus
- Walk-in (§1): FAB click → `barber_walkin_started`, form submit → `barber_walkin_created`, статус кнопки → `barber_walkin_started_service`, `barber_walkin_completed`, `barber_walkin_paid_on_site`
- Картка візиту (§4): статус кнопки → `barber_appointment_confirmed/started/completed/no_show`
- Картка клієнта (§4.3): відкриття → `barber_client_card_viewed`, додавання нотатки → `barber_client_note_added`
- Графік (§5): збереження → `barber_schedule_edited`
- Push handler (Expo Notifications): `barber_push_received` при отриманні (foreground/background)

**Web Admin (опціонально, для паралельних дій):**
- Аналогічні події з префіксом `admin_` (T-4582)

### Acceptance Criteria

- [ ] Всі 15 подій стріляють на mobile (barber role)
- [ ] `barber_walkin_created` має `is_new_client`, `client_phone_provided`
- [ ] `barber_appointment_completed` має `duration_min`, `has_reference`, `has_comment`
- [ ] `barber_appointment_no_show` має `minutes_after_slot`, `was_auto_no_show`
- [ ] `barber_client_card_viewed` має `total_visits_with_barber` (для аналізу retention по барберу)
- [ ] Push події фіксують тип і `appointment_id` для зв'язку з дією
- [ ] Amplitude Dashboard: "Barber Efficiency" — appointments per hour, no-show rate, walk-in %, avg service duration

## Why

Операційні метрики барбера: no-show rate (ANL-004), chair occupancy (ANL-002), walk-in conversion, service duration accuracy. Дані для KPI дашборду (phase 14) та performance reviews.

## Sources

- barber-screens.md §1-4 (walk-in, календар, картка візиту, картка клієнта)
- roadmap.md phase 7 (барбер у mobile), phase 15 (walk-in), phase 14 (analytics ANL-004, ANL-002)
- acceptance-criteria/09-walk-in-booking.md (WALK-BAR-*)
- acceptance-criteria/08-analytics-dashboard.md (ANL-002, ANL-004)

## Done

- [ ] `BarberAnalyticsProvider` в `apps/mobile/(barber)/_layout.tsx`
- [ ] `useBarberAnalytics` хук в `apps/mobile/src/lib/analytics/barber.ts`
- [ ] Calendar: `barber_calendar_day_viewed`, `barber_calendar_week_viewed`
- [ ] Walk-in: `barber_walkin_started`, `barber_walkin_created`, `barber_walkin_started_service`, `barber_walkin_completed`, `barber_walkin_paid_on_site`
- [ ] Appointment status: `barber_appointment_confirmed`, `barber_appointment_started`, `barber_appointment_completed`, `barber_appointment_no_show`
- [ ] Client card: `barber_client_card_viewed`, `barber_client_note_added`
- [ ] Schedule: `barber_schedule_edited` (phase 22)
- [ ] Push: `barber_push_received`
- [ ] Amplitude charts: Barber Efficiency dashboard

## Risks

- [ ] **Offline**: mobile може бути офлайн — чергування подій (Amplitude offline queue) + sync при online
- [ ] **Duplicate no-show**: авто no-show (cron) + ручне барбером — `was_auto_no_show` флаг для розрізнення
- [ ] **Party appointments**: `is_party_leg` + `barber_appointment_completed` фіксує ногу; `AppointmentPartyCompleted` — окремо (server-side, T-4587)
- [ ] **Timezone**: `date`/`week_start` в часовому поясі барбера (local), не UTC