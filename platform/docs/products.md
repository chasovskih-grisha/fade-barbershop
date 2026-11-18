# Products

Three client products + API. Brand name in stores and on domain appears when we approve name in `brand/`.

## 1. Site — `apps/web`

Network public site **and client cabinet**. Goal: trust, SEO, content, booking, same account as in app.

Client entry: **phone number + SMS OTP** (ADR 0005). No password. Barber and admin don't log in here.

### Public pages

| Route | Content |
|---------|--------|
| `/` | Hero, concept, booking CTA, nearest location |
| `/locations` and `/locations/{code}` | Network points, map, schedule, chairs |
| `/services` | Menu and prices (from `catalog`) |
| `/barbers` | Masters (no personal data beyond needed) |
| `/blog` and `/blog/{slug}` | Articles (`content`) |
| `/login` | Phone → SMS code |

### Client cabinet (after OTP)

| Route | Content |
|---------|--------|
| `/account` | Profile: name, phone, preferences |
| `/account/appointments` | My visits: reschedule, cancel |
| `/booking` | Booking via `scheduling` (when context ready) |
| `/account/messages` | Chat with barber (when `messaging` exists) |

Goods store — separate app on `shop.fade.com.ua` with **same auth** (one session on `.fade.com.ua`, ADR 0017; `my.fade.com.ua` not done — one cabinet, `/account`): `docs/online-shop.md`.

Interface language: Ukrainian. Multilingual not in v1.

Blog — not landing and not separate product. Same `Article` from `content`: on site — SSR, unique URL, sitemap, Open Graph; in app — strip and article screen. Editing only in admin.

Blog readable **without login** (both on site and in app).

Analytics (GA4 / Meta Pixel) stays on site: article view, booking CTA, successful OTP, phone click.

## 2. Founder admin — `apps/admin`

Separate app (separate domain, separate session). Not hide behind `/admin` on marketing site.

### Sections (plan)

| Section | Context | Why |
|--------|----------|--------|
| Locations | `locations` | Open point, schedule, chairs |
| Staff | `identity` + `locations` | Barbers, roles, location assignment |
| Calendar | `scheduling` | Whole network / filter by location / barber |
| Clients | `crm` | Cards, history, notes |
| Services | `catalog` | Menu, prices by locations |
| Blog | `content` | Drafts, publication, tags |
| Payments | `billing` | Statuses, Checkbox receipts (when connect) |
| Settings | — | Domain, integrations, notifications |

Founder — single `admin` role in v1. Separate "location manager" — when second point and delegation appear.

## 3. Mobile app — `apps/mobile`

One Expo project → iOS and Android. One binary. After login — role shell.

### Client

- Onboarding: same phone + OTP as on site (one `User`). Apple / Google — later, as binding
- Blog: strip and article (same publications as on site; without separate login)
- Location choice
- Booking: service → [mode "Father + son"] → barber → slot
- My visits: confirm, reschedule, cancel
- Chat with visit barber
- Profile: name, phone, preferences
- Reminders (push)

### Barber

- Day/week calendar (own slots)
- Client card: history, preferences, notes
- Chat with client
- Visit status: confirm, start, complete, no-show
- Blog (reading, same `content`)
- Own availability (windows, days off) — if delegated from admin; otherwise schedule set by founder

Barber **doesn't** see network finances, other locations (if not assigned), other chats.

### Common

- Push via Expo Notifications
- Blog via `content` API, not local markdown files in app
- Offline: day calendar cached; chat — send queue; articles — last strip cache; after network truth — API

## What not a separate product

- Separate blog site or RSS-only app — blog is web and mobile section
- Telegram booking bot — not in v1 scope (notifications may go to Telegram later via `notifications`)
- Separate "location site" — one site, many `/locations/{code}`
