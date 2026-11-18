# T-4573 · Data privacy: consent management, GDPR, data export, deletion, retention, audit

- **Stage**: M3 (phase 14) · **Tags**: backend, legal, security, compliance · **Complexity**: middle · **Depends on**: T-3601, T-4217, T-4417, T-4448, T-4449, T-4544, T-4565
- **StoryPoints**: 8

## What

GDPR/Ukrainian law compliance (розширення T-3601/4217/4417/4448/4449):
- **Consent management**: гранулярні згоди (marketing, analytics, transactional, third-party sharing), версіонування, історія змін (T-4565)
- **Marketing consent**: double opt-in (email/SMS/push), easy withdraw (unsubscribe link), запис.timestamp + ip
- **Communication preferences**: T-4218 — канали, категорії, частота, quiet hours
- **Data export (Right to Access)**: `GET /privacy/export` — ZIP з усіма даними клієнта (профіль, записи, платежі, лояльність, gift cards, відгуки, сповіщення, audit log клієнта) — JSON + CSV + README
- **Data deletion/anonymization (Right to Erasure)**: `DELETE /privacy/me` — soft delete (анонімізація PII: name→"Deleted User", phone→hash, email→hash, збереження фінансових записів для бухгалтерії), hard delete — лише за запитом до DPO
- **Privacy audit trail**: лог всіх privacy-дій (export requested, deletion requested, consent changed) в T-4565
- **Sensitive data minimization**: PII (phone, email, DOB) — шифрування at rest (T-3601), поле `encrypted` в DB, доступ лише через сервіс-дешифратор
- **Access control**: RLS policies в Postgres — клієнт бачить лише свої рядки, адмін — з аудитом
- **Data retention rules**: конфігурований TTL по категоріях (appointment history: 7 years, marketing logs: 2 years, analytics events: 3 years, audit log: 7 years), автоматичне архівування/або анонімізація по cron
- **Breach notification plan**: процедура виявлення/оцінки/повідомлення (72г) — документ, не код (T-4504 incident response)

## Why

Юридична відповідальність, довіра клієнтів, уникнення штрафів (GDPR до 4% обертів).

## Sources

- T-3601 (GDPR), T-4217 (compliance communications), T-4417 (privacy center), T-4448/4449 (import/export), T-4544 (CRM), T-4565 (audit)
- Altegio: zgody RODO, eksport danych, usunięcie danych, retencja, audyt prywatności, minimalizacja danych

## Done

- [ ] Consent model: `ConsentRecord` (clientId, purpose: MARKETING/ANALYTICS/TRANSACTIONAL/THIRD_PARTY, status: GRANTED/WITHDRAWN, version, grantedAt, withdrawnAt, ip, userAgent)
- [ ] Privacy API: `POST /privacy/consent`, `GET /privacy/export`, `DELETE /privacy/me` (z DPO approval workflow)
- [ ] Anonymization job: `AnonymizeClientData` — збереження fk для фінансових записів, hash PII, вилучення з search/index
- [ ] Retention policies: таблиця `RetentionPolicy` (entityType, ttlDays, action: ANONYMIZE/DELETE/ARCHIVE), scheduled job
- [ ] Encryption: `pgcrypto` / application-level encryption для phone/email/DOB, key rotation (T-300 secrets)
- [ ] Admin UI: Privacy Center (T-4417) — consents, export button, deletion request (DPO review), retention config
- [ ] Client cabinet: Privacy tab — consents toggles, download my data, request deletion

## Risks

- [ ] **Financial records retention**: податковий кодекс вимагає зберігання чеків 10 років — анонімізація не повинна логувати фінансові дані
- [ ] **Backup retention**: бекапи теж містять PII — політика ротації бекапів (T-300) узгоджена з retention