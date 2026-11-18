# T-4513 · Web: Public Page States (loading/empty/error/offline)

- **Stage**: M1 (phase 3) · **Tags**: frontend, design · **Complexity**: middle · **Depends on**: T-030, T-4507, T-4506
- **StoryPoints**: 5

## What

State pattern for public web pages (T-030, T-032, T-033, T-034):
- **loading** — skeletons instead of spinner (T-4507g? → Skeleton in `@fade/ui`, part of T-4507 series)
- **empty** — catalog/blog empty: ExplainEmpty + CTA (Instagram inquiry / feedback), non-layout breaking
- **error** — AlertBanner with Retry (T-4507c), page does not crash
- **offline** — `navigator.onLine` message, cached content without repeated requests
- **inactive location** — explicit state "location temporarily not accepting bookings" instead of 404

## Why

Audit findings: pages without skeletons "blink" with empty layout, catalog empty state is not described, locations with `isActive=false` have no UI solution. Without these patterns, phase 3 screens (T-030) catch "skeleton blinking" and fragmented state handling.

## Sources

- `docs/ux-guidelines.md` §States (loading/empty/error/offline table)
- `docs/design-system.md` §Components (Skeleton/EmptyState/AlertBanner — in T-4507 series)
- `docs/web-screens.md` (phase 3 pages, catalog/blog)

## Done

- [x] Location page: inactive location shows explicit state (not 404) with CTA
- [x] Catalog: Skeleton → list; empty → EmptyState+CTA (list of locations; blog — T-031)
- [x] API error: AlertBanner with Retry, page alive
- [x] `navigator.onLine` message
- [x] Content cache: `fetchJson(..., { revalidate })` + ISR 5 min for blog (`BLOG_REVALIDATE_SEC`, T-031); operational screens remain `no-store`

**Result (2026-09-28).** States implemented as a type rather than scattered conditions: `apps/web/src/lib/api/loadable.ts` — `LoadableList<T>` (`ok | empty | error | notFound`) and `LoadableItem<T>` (without `empty`), constructors `ok/okList/empty/failed/notFound`; `lib/api/http.ts` — `fetchJson`/`ApiFailure`/`loadList`/`loadItem`: SSR takes absolute API URL (`WEB_API_URL` → `API_ORIGIN` → `LOCATION_API_URL` → `localhost:13000`), 404 → `notFound`, 5xx/drop → `error`, never throws on server.

**UI Blocks** (`apps/web/src/app/components/states/`): `ErrorState`, `RetryAction`, `LocationListSkeleton`, `OfflineBanner`.

**Inactive Location.** `GetLocationDetailsHandler` returns `{ location, inactive }` instead of 404.

**Blog (T-031, 2026-09-28).** Blog page states implemented with the same pattern.
