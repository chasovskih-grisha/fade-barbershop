# T-3100 · Notification Center

- **Stage**: M6 (phase 40) · **Tags**: backend, integration, high-risk · **Complexity**: senior · **Depends on**: T-080
- **StoryPoints**: 25

## What
Unified notification center: email (SMTP/SendGrid), SMS (Twilio/RetailCRM), push (FCM/APNs), in-app. Templates with i18n, admin editing periods, queue with retry/backoff, delivery tracking, unsubscribe/preferences.

## Why
All channels in one place. Consistent UX. Admin manages templates without code. Delivery tracking for analytics.

## Sources
- ADR 0005/0016 (notification ports; source of truth: README notifications)
- `notifications/README.md`

## dependencies
> Slices are allocated at task start; individual subtask files are created then if needed.
