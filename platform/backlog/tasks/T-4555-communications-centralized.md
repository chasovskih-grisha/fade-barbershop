# T-4555 · Communications: centralized templates, channels (SMS/Email/Telegram/Viber/WhatsApp/Push/In-app)

- **Stage**: M2 (phase 7) · **Tags**: backend, notifications, integration · **Complexity**: senior · **Depends on**: T-080, T-3100, T-4217, T-4218, T-4431, T-4301, T-4400
- **StoryPoints**: 13

## What

Centralized communications system (replacement for hardcoded messages in features):
- **Channels**: SMS (T-4301/4400), Email (T-4408), Telegram (T-4431), Viber (T-4431), WhatsApp (adapter — P0), Push (Expo, T-080), In-app (Notification Center, T-4557)
- **Templates**: Twig/Jinja2-like templates with variables (`{{client.name}}`, `{{appointment.time}}`, `{{barber.name}}`, `{{promo.code}}`), versioning, preview, testing
- **Transactional messages**: booking confirmation, rescheduled, cancelled, reminder (24h/2h), starting soon, completed, payment confirmation, refund, membership purchased/expiring, gift card purchased/received, loyalty reward, referral reward
- **Marketing messages**: birthday, win-back, rebooking reminder, promotion, new service, membership promo, loyalty campaign, referral campaign
- **Delivery logic**: retry (exponential backoff), fallback (SMS → Push → Email), deduplication (not same message twice per hour)
- **User preferences**: T-4218 (granular comm prefs) — opt-in/out by channels and message types
- **Consent management**: GDPR (T-4417), marketing consent, transactional consent (legitimate interest)
- **Unsubscribe**: one-click unsubscribe in email/push, landing page for preference management
- **Notification history**: delivery log (SENT/DELIVERED/FAILED/BOUNCED), viewing in admin and client cabinet

## Why

Single place for all messages — easy to change texts, add channels, control delivery, audit.

## Sources

- T-080 (notifications), T-3100 (notification center), T-4217 (compliance), T-4218 (granular prefs), T-4431 (viber/telegram), T-4301/4400 (SMS)
- Canvas P0: "WhatsApp delivery adapter — close the gap between T-4218 preferences and actual channel delivery"
- Altegio: szablony komunikatów, kanały (SMS, Email, Telegram, Viber, WhatsApp, Push), historia dostaw, zgody

## Done

- [ ] Domain: `NotificationTemplate` (key, channel, subject, body, variables[], version), `Notification` (clientId, templateKey, channel, status, payload, sentAt, deliveredAt, error)
- [ ] Template engine: rendering with safe variable substitution, fallback locale (uk/ru)
- [ ] Channel adapters: SMS (T-4301), Email (T-4408), Push (Expo), Telegram/Viber (T-4431), WhatsApp (new adapter — P0)
- [ ] Delivery service: queue (BullMQ/Redis), retry policy, fallback chain, idempotency key
- [ ] Preference integration: check `CommunicationPreference` before sending (T-4218)
- [ ] Admin UI: Template Manager (CRUD, preview, test send), Delivery Log (search, filter, retry failed)
- [ ] Client cabinet: Notification Center (T-3100) + Preferences management
- [ ] WhatsApp adapter: Business API (template approval), webhook for delivery statuses

## Risks

- [ ] **WhatsApp approval**: templates require pre-moderation by Meta — dev process with test number
- [ ] **Channel costs**: SMS/WhatsApp cost money — limits per client/day, budget alerts (T-4505)
