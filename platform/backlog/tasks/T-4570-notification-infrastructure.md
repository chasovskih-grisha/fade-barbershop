# T-4570 · Notification infrastructure: centralized events, triggers, templates, channels, preferences, history

- **Stage**: M2 (phase 7) · **Tags**: backend, notifications, platform · **Complexity**: senior · **Depends on**: T-080, T-3100, T-4202, T-4203, T-4217, T-4218, T-4431, T-4555
- **StoryPoints**: 13

## What

Centralized notification infrastructure (unifying T-080, T-3100, T-4202, T-4203, T-4217, T-4218, T-4431, T-4555):
- **Event-driven architecture**: domain events (`AppointmentBooked`, `AppointmentRescheduled`, `PaymentCompleted`, `ClientRegistered`, `LoyaltyPointsEarned`, `MembershipExpiring`, `WaitlistSlotOffered`, `NoShowRecorded`, `GiftCardPurchased`, `ReferralQualified`) → NotificationEngine
- **Triggers**: configured rules (JSON Logic, T-4556) — which event → which template → which channels → which recipients
- **Conditions**: filters (client.segment, appointment.source, payment.amount > X, client.preferences.channel.SMS = true)
- **Templates**: T-4555 (centralized, versioned, multi-channel, variables, preview, test send)
- **Channels**: SMS, Email, Push (Expo/Web), In-App (Notification Center T-3100), Telegram, Viber, WhatsApp (T-4431/4555)
- **Delays**: immediate, scheduled (cron), relative (2h before appointment), digest (daily/weekly summary)
- **Retries**: exponential backoff per channel, max attempts, fallback chain (SMS → Push → Email)
- **Scheduling**: BullMQ/Redis scheduled jobs, timezone-aware (IANA TZ, T-4488)
- **Delivery status**: PENDING, SENT, DELIVERED, FAILED, BOUNCED, OPENED, CLICKED — webhook callbacks from providers
- **Failure handling**: DLQ, alerting (T-4505), manual retry UI, suppress duplicate attempts for the same template/client within an hour
- **User preferences**: T-4218 (granular comm prefs) — opt-in/out by channels and categories (transactional/marketing/reminders)
- **Consent**: GDPR (T-4417) — marketing consent mandatory, transactional — legitimate interest
- **Unsubscribe**: one-click (email), push permission management, landing page `/preferences`
- **Notification history**: full log (T-4565 audit) — search by client/template/channel/status/date

## Why

A single place for all notifications — no duplicated logic across features, easy addition of channels, delivery control.

## Sources

- T-080 (notifications), T-3100 (notification center), T-4202/4203 (infra), T-4217 (compliance), T-4218 (prefs), T-4431 (viber/telegram), T-4555 (communications)
- Canvas: "Push, delivery, preferences, and fallback channels need one owner; WhatsApp delivery is missing"
- Altegio: notification center, templates, channels, schedule, delivery statuses, preferences, history

## Done

- [ ] Domain: `NotificationEvent` (eventType, payload), `NotificationTemplate` (key, channel, subject, body, variables, version), `Notification` (recipientId, templateKey, channel, status, payload, sentAt, deliveredAt, error, idempotencyKey)
- [ ] Engine: event listener → evaluate triggers → render template → enqueue per channel (BullMQ)
- [ ] Channel adapters: SMTP (Email), SMPP/HTTP (SMS), Expo Push, Web Push, Telegram Bot API, Viber Bot API, WhatsApp Business API
- [ ] Preference check: before enqueue → `CommunicationPreference.canSend(recipientId, channel, category)`
- [ ] Retry/fallback: policy in template config, circuit breaker for providers
- [ ] Admin UI: Template Manager, Trigger Rules Builder, Delivery Dashboard (real-time), DLQ Explorer
- [ ] Client cabinet: Notification Center (T-3100) + Preferences (T-4218)
- [ ] Analytics: delivery rates by channel/template, open/click rates, bounce rates, cost per channel

## Risks

- [ ] **Channel costs**: SMS/WhatsApp — budget alerts (T-4505), per-client daily limits
- [ ] **Template sprawl**: governance — naming convention, ownership, review process
