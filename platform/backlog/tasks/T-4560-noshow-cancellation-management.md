# T-4560 · No-show & cancellation management: reasons, stats, deposits, restrictions, reporting

- **Stage**: M4 (phase 16) · **Tags**: backend, scheduling, billing, crm · **Complexity**: middle · **Depends on**: T-160, T-093, T-094, T-4542, T-4544, T-4556
- **StoryPoints**: 8

## What

Розширення no-show policy (T-160) до управління причинами, статистикою, депонітами:
- **Cancellation reasons**: обов'язкове поле при скасуванні (адмін/барбер/клієнт) — enum: CLIENT_REQUEST, CLIENT_SICK, CLIENT_SCHEDULE, BARBER_SICK, BARBER_VACATION, SALON_CLOSED, WEATHER, OTHER + вільний текст
- **No-show reasons**: опціонально — барбер/адмін вказує причину (CLIENT_NO_SHOW, CLIENT_LATE, WRONG_TIME, OTHER)
- **Statistics**: дашборд no-show rate по барберу/послузі/локації/каналу залучення (T-4536)/денню тижня/годині, cancellation rate, топ причини
- **Client no-show history**: в профілі клієнта (T-4544) — лічильник, останні випадки, тренд
- **Configurable cancellation window**: політика на локацію/послугу — безкоштовне скасування до X годин, пізніше — штраф/депозит не повертається
- **Deposits for high-risk clients**: клієнт з N no-show за M днів → обов'язковий депозит 100% на наступні записи (rule engine T-4556)
- **Booking restrictions**: блокування онлайн-букінгу для high-risk (T-4542), тільки через адміна
- **Manual override**: адмін може повернути депозит, зняти рестрикцію, позначити "excused no-show" (не рахується в статистику)
- **Automated notifications**: клієнту про no-show (нейтральний тон), адміну про high-risk клієнта
- **No-show reporting**: експорт звіту (CSV) для бухгалтерії/аналітики

## Why

Дані для прийняття рішень: хто no-show, чому, які політики працюють, як захистити виручку.

## Sources

- T-160 (no-show policy), T-093/094 (billing refunds), T-4542 (booking restrictions), T-4544 (CRM), T-4556 (rules engine)
- Altegio: przyczyny anulacji/braków, statystyki, depozyty dla ryzykownych, blokady, raporty

## Done

- [ ] Domain: `CancellationReason`, `NoShowReason` (enum + custom), `NoShowPolicy` (locationId, serviceId?, freeCancelHours, depositForHighRisk, highRiskThreshold)
- [ ] API: reason required при cancel/no-show, stats endpoints
- [ ] High-risk rule: в RuleEngine (T-4556) — `client.noShowCount90d >= 3` → `requireFullDeposit = true`, `blockOnlineBooking = true`
- [ ] Admin UI: No-show dashboard (charts, tables), client profile → no-show history tab, manual override actions
- [ ] Notifications: no-show notification template (T-4555), high-risk alert (T-4505)
- [ ] Reports: CSV export (T-4568 import/export)

## Risks

- [ ] **Legal**: депозит 100% може бути оспорений — чіткі ToS, погодження з юристом
- [ ] **False positives**: клієнт забув, але хороший клієнт — "excused" механізм критичний