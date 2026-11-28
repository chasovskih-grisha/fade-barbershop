# `@fade/web` — public site, blog and quick-booking

Next.js 15 App Router application serving `fade.com.ua`: the storefront, the public
catalog, the blog, the client cabinet and quick-booking. Server-side data comes from
`apps/api`; nothing here owns business rules.

## Stack

- Next.js App Router, React 18, TypeScript (strict), Tailwind CSS.
- Design system: `@fade/design-tokens` (tokens), `@fade/ui` (components),
  `@fade/brand-assets` (logos). Hex and px values in screens are forbidden — a missing
  component is added to `packages/ui`, not crafted locally.
- Contracts: `@fade/contracts` for request and response shapes; `zod` validates them.
- Locales: `uk` (default, no prefix) and `en` (`/en/...`) via `next-intl`.

## Routes

| Path | Screen |
|------|--------|
| `/` | Storefront home |
| `/services`, `/locations`, `/barbers` | Public catalog |
| `/booking` | Quick-booking flow (location → service → barber → slot → comment → payment) |
| `/account` | Client cabinet: bookings, devices, phone change |
| `/blog`, `/blog/{slug}`, `/blog/tag/{tag}` | Editorial blog |
| `/login` | Phone + OTP sign-in |
| `/gift`, `/referral-booster`, `/reputation`, `/support`, `/winback` | Retention surfaces |
| `/widget` | Embeddable booking widget |
| `/api/*` | Route handlers used by the app itself |

## Quick-booking has no separate application

Quick-booking lives in `src/app/booking` of this app. There is no `apps/book` and no
`book.fade.com.ua` host: the canonical URLs are `fade.com.ua/booking` and
`fade.com.ua/booking/{location-code}` (ADR 0017, revision 2026-10-01; backlog journal
2026-10). A short host, if ever needed, is a redirect to these URLs, not an application.

## Structure

- `src/app` — routes, layouts, route-level state and the flow hooks.
- `src/app/components` — screen-level components shared across routes (shell, states,
  analytics trackers, consent); `src/components` holds the embeddable widget.
- `src/lib` — API clients and browser helpers; one module per API area.
- `src/i18n.ts`, `src/routing.ts`, `middleware.ts` — locale negotiation and prefixes.
- `e2e` — Playwright scenarios; `__tests__` next to the code — Jest + Testing Library.

## Scripts

```sh
pnpm --filter @fade/web dev        # next dev on port 13001
pnpm --filter @fade/web test       # jest
pnpm --filter @fade/web typecheck  # tsc --noEmit
pnpm --filter @fade/web lint       # next lint
```
