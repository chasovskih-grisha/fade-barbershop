# T-4587 · Backend Event Forwarding & User Identity Resolution

- **Stage**: M3 (parallel with phases 4–8) · **Tags**: backend, analytics, integration, data-quality · **Complexity**: middle · **Depends on**: T-4575, T-4576, T-4579, T-4581
- **StoryPoints**: 8

## What

Server-side forwarding of critical events to Amplitude to guarantee 100% delivery, user identification (identity merge), processing events that happen exclusively on the server (webhooks, cron, domain events).

### Architecture

**1. Amplitude Server Client (`apps/api/src/analytics/infrastructure/amplitude.client.ts`)**
- Wrapper around `@amplitude/analytics-node`
- Methods: `track(event: ServerEvent)`, `identify(userId, userProperties)`, `groupIdentify(groupType, groupId, properties)`
- Automatic addition of `insert_id` = `${event_name}_${entity_id}_${timestamp}` for idempotency
- Batch API (Amplitude Batch Event Upload) — accumulation of 100 events or 5s flush

**2. Outbox Publisher (`apps/api/src/analytics/infrastructure/amplitude.outbox-publisher.ts`)**
- Table `amplitude_outbox` (Prisma): `id`, `event_name`, `event_json`, `user_id`, `device_id`, `insert_id`, `status` (pending/sent/failed), `retry_count`, `created_at`, `sent_at`
- Domain event handlers (in `analytics/application/handlers/`) write to outbox in the same transaction as business logic (ADR 0009)
- Worker (cron every 30s or BullMQ) reads `pending`, sends batch, updates status
- Retry: exponential backoff (1m, 5m, 15m, 1h), max 5 retries → `failed` → dead letter table + alert

**3. Identity Resolution Service (`apps/api/src/analytics/application/identity-resolution.service.ts`)**
- `resolveIdentity(context: { userId?, deviceId?, phoneHash? }): { user_id?, device_id? }`
- Priority: `user_id` (authorized) > `device_id` (anonymous) > `phone_hash` (fallback for cross-device)
- On `verifyOtp` success: call `amplitude.identify(userId, { $device_id: deviceId })` for merge
- On logout: do not unmerge (Amplitude does not support it), simply stop sending `user_id`

**4. Domain Event Handlers (auto-forward critical events)**

| Domain Event | Amplitude Event | Properties Source |
|--------------|-----------------|-------------------|
| `scheduling.AppointmentBooked` | `booking_confirmed` (server duplicate) | Appointment aggregate snapshot |
| `scheduling.AppointmentConfirmed` | `appointment_confirmed_by_barber` | Appointment |
| `scheduling.AppointmentStarted` | `appointment_started` | Appointment |
| `scheduling.AppointmentCompleted` | `appointment_completed` + `loyalty_free_visit_granted?` + `referral_first_visit_completed?` | Appointment + projections |
| `scheduling.AppointmentNoShowed` | `appointment_no_show` | Appointment |
| `scheduling.AppointmentCancelled` | `appointment_cancelled` | Appointment + cancellation policy snapshot |
| `scheduling.AppointmentRescheduled` | `appointment_rescheduled` | Appointment (old/new slots) |
| `billing.PaymentCaptured` | `payment_captured` | Payment + Appointment |
| `billing.PaymentRefunded` | `payment_refunded` | Payment |
| `loyalty.FreeVisitGranted` | `loyalty_free_visit_granted` | LoyaltyState |
| `discounts.DiscountApplied` | `discount_applied` | Visit snapshot |
| `gift-certificates.CertificateSold` | `gift_certificate_purchased` | Certificate |
| `gift-certificates.CertificateRedeemed` | `gift_certificate_redeemed` | Certificate + Visit |
| `gift-certificates.CertificateExpired` | `gift_certificate_expired` | Certificate |
| `crm.ReferralSignup` | `referral_signup` | ClientProfile |
| `crm.ReferralRewardEarned` | `referral_reward_earned` | ReferralRecord |

### Acceptance Criteria

- [ ] `AmplitudeServerClient` Implemented with batch and retry
- [ ] Outbox publisher works: event in outbox → sent in < 1 min
- [ ] Dead letter queue + alert (Slack/email) on > 5 retries
- [ ] Identity merge: `verifyOtp` → `amplitude.identify` → check in Amplitude User Lookup
- [ ] All 18 domain events forwarded to Amplitude with correct properties
- [ ] Duplication of client-side events (booking_confirmed, appointment_completed) have identical `insert_id` for dedup
- [ ] Load test: 1000 events/sec → < 5% failure rate, latency < 2s

## Why

Client-side analytics are unreliable (AdBlock, ITP, network errors, app kill). Server-side forwarding guarantees delivery of payment, visit completion, and no-show events. Identity merge unites anonymous web traffic with mobile sessions.

## Sources

- roadmap.md phase 14 (analytics — read-model on events)
- ADR 0009 (transactional outbox pattern)
- ADR 0005 (identity merge by phone)
- acceptance-criteria/08-analytics-dashboard.md (ANL-001…010 — all metrics from server events)
- T-4403 (server validation: booking event in DB = source of truth)

## Done

- [ ] `AmplitudeServerClient` in `apps/api/src/analytics/infrastructure/amplitude.client.ts`
- [ ] `AmplitudeOutboxPublisher` + Prisma model `AmplitudeOutbox`
- [ ] Worker (cron/BullMQ) to flush outbox
- [ ] `IdentityResolutionService` with `identify` merge on OTP verify
- [ ] Domain event handlers for 18 events (one per context: scheduling, billing, loyalty, discounts, gift-certificates, crm)
- [ ] `insert_id` generation for deduplication with client-side
- [ ] Integration test: full path booking → payment → complete → check in Amplitude

## Risks

- [ ] **Event ordering**: outbox guarantees at-least-once, not ordering. Amplitude sorts by `timestamp` — correct `event_time` is important (domain event timestamp, not processing time)

## Audit 2026-11-24

Reopened. The forwarding skeleton is real: `AmplitudeOutbox`, the 18-type map,
HTTP transport, worker, retry/dead-letter store and unit tests exist. But
`IdentityResolutionService` and the OTP-verify `identify` merge are absent, there
is no full path integration test, and the failure path records an audit log rather
than the promised external alert. The task-level Done list is otherwise checked only
by implementation notes, not by end-to-end evidence.
- [ ] **Schema drift**: domain event schema changes — versioning in `event_json._schema_version`, handler adapts
- [ ] **PII leak**: domain events contain phone/email — service must sanitize before sending (only user_id/UUID)
- [ ] **Costs**: Amplitude MTU (Monthly Tracked Users) — server events count too. Filter health-check/ping events

## Implementation plan

Paths:
- apps/api/src/analytics/domain/amplitude-events.ts
- apps/api/src/analytics/domain/amplitude-events.spec.ts
- apps/api/src/analytics/application/forward-analytics-events.spec.ts
- apps/api/src/analytics/infrastructure/amplitude-http.transport.spec.ts

Checks:
- `pnpm --filter @fade/api exec jest apps/api/src/analytics/domain/amplitude-events.spec.ts apps/api/src/analytics/application/forward-analytics-events.spec.ts apps/api/src/analytics/infrastructure/amplitude-http.transport.spec.ts`

## Implementation notes

- apps/api/prisma/migrations/20261216000000_add_amplitude_outbox/migration.sql
- apps/api/prisma/schema.prisma
- apps/api/src/analytics/application/amplitude.ports.ts
- apps/api/src/analytics/application/forward-analytics-events.spec.ts
- apps/api/src/analytics/application/forward-analytics-events.ts
- apps/api/src/analytics/domain/amplitude-events.spec.ts
- apps/api/src/analytics/domain/amplitude-events.ts
- apps/api/src/analytics/infrastructure/amplitude-http.transport.spec.ts
- apps/api/src/analytics/infrastructure/amplitude-http.transport.ts
- apps/api/src/analytics/infrastructure/analytics-forwarding.worker.ts
- apps/api/src/analytics/infrastructure/analytics.module.ts
- apps/api/src/analytics/infrastructure/prisma-amplitude.store.ts

## QA

- `pnpm --filter @fade/api exec jest apps/api/src/analytics/domain/amplitude-events.spec.ts apps/api/src/analytics/application/forward-analytics-events.spec.ts apps/api/src/analytics/infrastructure/amplitude-http.transport.spec.ts` exit 0
