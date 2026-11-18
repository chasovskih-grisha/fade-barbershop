# Класифікація даних і утримання (`shared/retention`, T-4490)

Політика — таблиця `RETENTION_RULES`: набір даних → класифікація → TTL.
Новий набір додається одним рядком; воркер і аудит читають таблицю.

| Набір | Класифікація | TTL | Що видаляється |
|-------|--------------|-----|----------------|
| `otp_challenges` | personal | 7 днів | використані/прострочені OTP-хеші |
| `sessions` | personal | 30 днів | відкликані та прострочені сесії |
| `notification_records` | personal | 90 днів | журнал доставки (одержувач = PII) |

- **Воркер**: `RetentionPurgeWorker`, інтервал `RETENTION_PURGE_INTERVAL_MS`
  (дефолт 24 год, `0` — вимкнути), `RETENTION_PURGE_DISABLED=true` — повністю
  вимкнути в середовищі. У тестах автостарт вимкнено.
- **Legal hold**: `RETENTION_LEGAL_HOLD=sessions,notification_records` —
  набір не чиститься, але в аудиті лишається `held: true` (судові справи).
- **Пост-перевірка**: після `deleteMany` воркер рахує залишок прострочених
  рядків (`remainingExpired`); ненульове значення = сигнал, що політика не
  покриває новий стан рядка.
- **Аудит**: таблиця `RetentionPurge` (dataset, cutoff, purged,
  remainingExpired, held, ranAt) — хто/коли/скільки, без PII. Перегляд:
  `SELECT * FROM "RetentionPurge" ORDER BY "ranAt" DESC LIMIT 20;`.
- **Runbook**: (1) `pnpm --filter api db:migrate` — таблиця аудиту нова;
  (2) перевірити `/health` після старту (воркер не блокує boot);
  (3) перший прогін — вручну `PurgeExpiredData.execute()` або чекати добу;
  (4) якщо `remainingExpired > 0` — додати умову до `remainingExpired` і
  `purge` відповідного набору, інакше TTL «не діє» для нового статусу.
