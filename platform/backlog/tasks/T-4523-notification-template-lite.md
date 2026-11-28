# T-4523 · Notification Text Editing (lite, pre-v1)

- **Stage**: M2 (phase 7) · **Tags**: backend, notifications · **Complexity**: middle · **Depends on**: T-080, T-3100, T-4507
- **StoryPoints**: 5

## What

Abstraction "notification text as runtime template", allowing the owner to change messages without code: event (new booking, cancellation, reminder, payment, waitlist, review) → template subject, placeholders (`{barber}`, `{time}`, `{link}`), 2 languages (uk/en). Storage — network config + location override; default = hardcoded T-080 texts. Admin screen "Notifications" (event list, template editor, preview with real data). Scope boundary: this is **lite** for v1; full notification center with queues/statistics is T-3100 (M5).

## Why

T-080 ("Ukrainian templates") — texts in code; T-3100 ("Templates with i18n, admin edit fields") is in M5 — after launch. There is a gap between them: v1 launches with fixed texts that the owner cannot fix (brand tone, phone number, locale nuances). This is a basic barbershop operational request, cheap to extract before launch.

## Sources

- `backlog/tasks/T-080-notifications-push.md` (current template texts)
- `backlog/tasks/T-3100-notification-center.md` (scope boundary — full center)
- `apps/api/src/notifications/README.md` (events, phase gates)
- `docs/admin-screens.md` §settings

## Done

- [ ] Event templates with placeholders, defaults = current T-080 texts
- [ ] Admin screen with event list and preview; location override
- [ ] Extensible placeholders; Tests for unknown placeholder; `pnpm docs:validate` green

## Risks

- [ ] Duplicate with T-3100 — scope clearly documented (missing: statistics, A/B, broadcast queues)
- [ ] Invalid placeholder in production text — render validation in preview
