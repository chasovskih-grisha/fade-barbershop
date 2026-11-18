# ADR 0001. Own platform instead of Altegio as system of truth

- Status: accepted
- Date: 2026-09-07

## Context

Stack had Altegio CRM: booking widget on site, calendar, Telegram notifications. Need own products: site with blog, iOS/Android for clients and barbers (chat + calendar), founder admin panel.

Altegio doesn't provide branded app with chat and network calendar under our rules (2 chairs, investor model, multiple points). Two calendars (ours and Altegio) will diverge.

## Decision

System of truth for bookings, clients and chat — **our API**. Altegio is not core.

**Clarification 2026-09-12:** no third-party CRM and booking apps at all, including transitional Altegio widget. ACL on Altegio not built.

PRRO Checkbox, acquiring Privat/Mono, GA4, Meta Pixel, SMS OTP — remain external (cash register, analytics, login, not CRM). Video surveillance — outside platform. Software OPEX — hosting, Apple Developer, SMS OTP; Google Play — once in CAPEX.

## Consequences

- More development before opening than "site + widget".
- Full control of UX, data and network model.
- Need to close reminders, slots, fiscalization ourselves (via ACL).
- Documents `development/booking/` describe our `scheduling`, not third-party widget.
