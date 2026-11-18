# T-4534 · Appointment status history & audit trail

- **Stage**: M1 (phase 4) · **Tags**: backend, scheduling, audit · **Complexity**: middle · **Depends on**: T-042, T-042b
- **StoryPoints**: 5

## What

Розширення життєвого циклу Appointment (T-042) повною історією змін статусів та полів:
- Автоматичне логування кожної зміни статусу (pending → confirmed → arrived → in_progress → completed/no_show/cancelled)
- Зберігання актора (admin/barber/client/system), timestamp, попереднє/нове значення
- Історія зміни барбера, послуг, тривалості, ціни, нотаток
- API для отримання історії запису (admin/barber/client залежно від прав)
- UI в адмінці та кабінеті барбера: вкладка "Історія" на картці запису

## Why

Повний аудит-трейл для розслідування конфліктів, аналітики no-show, compliance. Вимагається для T-4216 (фінансовий аудит) і T-4496 (нічні перевірки).

## Sources

- T-042 (appointment lifecycle), T-4216 (financial audit trail), T-4496 (nightly integrity checks)
- Altegio: historia zmian statusu, historia edycji wizyty

## Done

- [ ] Доменна подія `AppointmentStatusChanged` з полями actor, oldStatus, newStatus, reason
- [ ] Проекція `AppointmentHistory` (read model) в scheduling або окремий контекст
- [ ] API `GET /appointments/{id}/history` з пагінацією
- [ ] UI: вкладка історії в адмінці (T-4528) та barber mobile (T-083)
- [ ] migration існуючих записів (backfill з outbox подій)

## Risks

- [ ] **Обсяг даних**: історія росте швидко — партиціонування по appointment_id + архівування
- [ ] **Права доступу**: клієнт бачить лише свою історію, барбер — свої записи, адмін — все

## Implementation plan

Paths:
- apps/api/src/scheduling

Checks:
- pnpm --filter api test appointment-status-history.spec.ts

## Implementation notes

- apps/api/src/scheduling/domain/appointment-status-history.spec.ts

## QA

- `pnpm --filter api test appointment-status-history.spec.ts` exit 0
