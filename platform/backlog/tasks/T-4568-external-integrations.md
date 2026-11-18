# T-4568 · External integrations: Google, Meta, Telegram, Viber, WhatsApp, SMS, Email, Payments, Accounting, CRM, Webhooks

- **Stage**: M5 (phase 27-28) · **Tags**: integration, backend, experimental · **Complexity**: senior · **Dependencies**: T-090, T-260, T-3102, T-3802, T-4301, T-4400, T-4408, T-4431
- **StoryPoints**: 21

## What

Single external integrations factory (post-v1; each — by business trigger):
- **Google**: Calendar two-way sync (T-260 GBP), Meet link in booking, Gmail OAuth for confirmations
- **Meta**: Instagram/Messenger DM responses, page webhook subscription (after T-260), Lead Ads → client
- **Telegram / Viber**: bots for reminders and booking confirmations (UA profiles, opt-in), T-4431 as single channel gateway
- **WhatsApp**: Business API (adapter P0 — official API instead of unofficial libraries), templates, 24-hour session window
- **SMS / Email**: TurboSMS/AlphaSMS (T-4301, T-4400) + fallback; transactional mail + bounce (T-4408)
- **Payments**: Stripe/liqpay/NBU, webhooks, refund (T-090, T-091)
- **Accounting / bookkeeper**: checks and service journal export (Mofinol/provider or CSV/SOAP) — without direct DB access
- **CRM / marketing**: Bitrix24/amoCRM sync clients and visits (limited, without third party as source of truth — see AGENTS.md), SendGrid/UniSender — mailings via T-4555
- **Webhooks**: outbound for partners — on platform T-4569

Rules for all: port in domain + adapter (engineering-principles.md), circuit breaker, provider rate-limit, health-check, state sync, observability (T-4204), no fake adapters in prod.

## Why

Don't write integration in every feature: common channel gateway, single point for retries, fallback and monitoring.

## Requirement sources

- T-260 (GBP), T-3102 (integrations), T-3802 (webhooks), T-4301/T-4400 (SMS), T-4408 (email), T-4431 (Telegram/Viber)
- notifications README, payments/billing README, AGENTS.md (ban on third-party CRM as truth)
- Altegio: integracje Google/Meta/WhatsApp/Telegram/Viber, płatności, księgowość

## Done

- [ ] `IntegrationRegistry`: integrations registry, state (enabled/disabled/error), config with secret manager
- [ ] Channel adapters by common `MessagingChannel` port (T-4555): SMS, Email, Telegram, Viber, WhatsApp, Push, In-app
- [ ] Google Calendar sync: conflict detection, single-writer rule (T-4540 — sync boundary: ICS export vs OAuth)
- [ ] Meta webhook + Messenger inbox in admin
- [ ] WhatsApp Business adapter with template registry and delivery status
- [ ] Accounting export: checks/journal, format by provider, reconciliation
- [ ] Circuit breaker + retry + dead letter for each external call
- [ ] Health dashboards + alerts on provider error rate/latency (T-4204b)
- [ ] Playwright tests on external sandboxes or contract tests with recorded responses

## Risks

- [ ] **Platform ToS**: Meta/WhatsApp limit templates and 24-hour window — don't rely on free text
- [ ] **Blocking**: provider in booking phase must not block booking — degraded mode with queue
- [ ] **Ban**: no external CRM/bookkeeper becomes source of truth for records and clients
