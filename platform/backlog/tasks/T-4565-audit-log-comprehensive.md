# T-4565 · Comprehensive audit log: appointments, clients, payments, settings, permissions, inventory

- **Stage**: M4 (phase 16+) · **Tags**: backend, security, audit, compliance · **Complexity**: senior · **Depends on**: T-3604, T-4216, T-4496, T-4534, T-4544, T-4549, T-4561
- **StoryPoints**: 13

## What

Єдиний аудит-трейл для всіх критичних дій (об'єднання T-3604 admin/PII audit, T-4216 financial ledger, T-4496 integrity checks):
- **Tracked entities & actions**:
  - Appointments: created, status_changed, rescheduled, cancelled, restored, price_changed, discount_applied, barber_changed, service_changed, note_added
  - Clients: created, updated, archived, merged, tags_changed, consent_changed, blacklisted, imported
  - Barbers: created, schedule_changed, commission_changed, deactivated, vacation_added
  - Payments: created, authorized, captured, refunded, failed, method_changed, split_modified
  - Memberships: purchased, paused, resumed, cancelled, renewed, used
  - Gift cards: purchased, redeemed, transferred, expired, balance_adjusted
  - Loyalty: points_earned, points_spent, points_expired, points_adjusted, tier_changed
  - Inventory: received, sold, consumed, written_off, adjusted, transferred
  - Settings: pricing_changed, policy_changed, schedule_changed, permissions_changed, integration_configured
  - Permissions: role_assigned, role_revoked, permission_granted, permission_revoked
- **Audit entry**: timestamp, actor (userId, role, ip), entityType, entityId, action, before (JSON), after (JSON), correlationId (для зв'язку ланцюжка дій)
- **Storage**: partitioned table по entityType + month, retention 7 років (legal), архівація в холодне сховище (S3/MinIO)
- **API**: `GET /audit?entityType=&entityId=&actorId=&from=&to=` з пагінацією, фільтрами
- **Admin UI**: Audit Explorer — пошук, фільтри, детальний перегляд before/after (diff), експорт CSV
- **Integrity checks**: T-4496 — щоденні перевірки (рядків в audit = очікувані події, none пропусків в correlationId)

## Why

Безпека, розслідування інцидентів, комплаєнс (GDPR, фінанси), довіра даним.

## Sources

- T-3604 (admin/PII audit), T-4216 (financial audit trail), T-4496 (nightly integrity), T-4534 (appointment history), T-4544 (client audit), T-4549 (payment tracking), T-4561 (inventory movements)
- Canvas: "Admin/PII audit, financial ledger, and integrity checks are distinct domains; do not collapse them"
- Altegio: dziennik zdarzeń, historia zmian, audyt finansowy, audyt PII, ślad inspekcji

## Done

- [ ] Domain: `AuditLog` (partitioned), `AuditEntry` interface, correlationId generator (UUID v7)
- [ ] Interceptor/Aspect: автоматичне логування в use cases / controllers (декоратор `@Audited(entityType, action)`)
- [ ] Before/After capture: для update — завантаження старого стану перед зміною
- [ ] Storage: Postgres partitioning (pg_partman), архівація в MinIO (Parquet) після 1 року
- [ ] API: search, filter, export (CSV/JSON)
- [ ] Admin UI: Audit Explorer з diff view (JSON diff), saved searches
- [ ] Integrity job: щоденно — перевірка лічильників подій vs audit entries, alert при розбіжності (T-4505)
- [ ] GDPR: right to access → експорт audit log клієнта (T-4571 privacy)

## Risks

- [ ] **Performance**: запис audit на кожний request — асинхронно (outbox pattern), batch inserts
- [ ] **Storage growth**: 7 років * млн подій/місяць = TB — партіціонування + архівування + стиснення критично