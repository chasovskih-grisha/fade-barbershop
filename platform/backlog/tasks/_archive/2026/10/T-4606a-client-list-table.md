# T-4606a · Client list: search, filters, sorting, pagination (5/8)

- **Stage**: M3 (phase 14) · **Tags**: backend, frontend, crm, design · **Complexity**: middle · **Dependencies**: T-060, T-061, T-4507, T-4516
- **StoryPoints**: 5

## What

Base of `admin-screens.md` §6.1 screen — that without which CRM section of admin doesn't open.

**Backend**: read model `AdminClientList` in `crm/application` (by `AdminCalendar` pattern in `scheduling/application` — thin controller, request interface with validation without class-validator, domain errors → 400) and `AdminClientsController` in `crm/infrastructure` with `@Controller('admin/clients')` under `AdminSessionGuard`. Data — `ClientProfile` (T-060) + `Visit` read model (T-061) + loyalty progress; **one** query per page, no N+1 (see parent task Risks). Response — `{ items, total, page, pages }` (pattern `docs/admin/16-shared.md` §Pagination); `summary` adds T-4606b.

**Frontend**: `apps/admin/src/app/clients/page.tsx` + "Clients" item in `Sidebar.tsx` (currently no NAV) with route `/clients`; filter bar on `Select` from T-4507 (location, loyalty status), search with debounce, table on `@fade/ui` (`Table`, `Badge`, `ProgressBar`, `StatusPill`) with clickable sorting headers, pagination, row click → `/admin/clients/{id}` (T-4528). Filter/sort/page state — in query (`useSearchParams`), without local state-duplicate.

## Why

Without list there is no working path to client card: in `apps/admin/src/app` no `clients/`, in `Sidebar` — no "Clients" item, and `/admin/clients/*` on backend knows only OTP (T-4409). List — daily owner tool ("who was today", "who wasn't 60 days") and `MNG-ADM-16` gate.

## Requirement sources

- `docs/admin-screens.md` §6.1 (layout, columns, empty state); `docs/admin/05-clients.md` (Client List; §API calls `/crm/clients` — fix to `/admin/clients` by admin surface convention)
- `docs/admin/16-shared.md` §Pagination, §Filtering & Search, §Error Handling (401 → login, 403 → "No access")
- `docs/design-system.md` §Components; T-4507 (Select), T-4516 (Skeleton/EmptyState/AlertBanner), T-4514 (shell)

## Done

- [x] `GET /admin/clients` with `search`/`locationId`/`loyaltyStatus`/`sort`/`order`/`page`/`perPage`
- [x] Invalid `sort`/`order`/`perPage` values → 400; `perPage` limited to 100
- [x] Search by name and by phone (number normalization to E.164)
- [x] One query per page: visit counter, last visit, `3/7` — without N+1 (fixed number of `ClientListReader` port queries)
- [x] Page + Sidebar item; §6.1 columns; sorting by each column
- [x] Filters/sort/page in URL; "Back" doesn't lose state
- [x] States: Skeleton; "No clients yet"; "Nothing found by filters" + "Reset filters"; error + "Try again"
- [x] Unit tests on validation and sorting; functional on handler; e2e on endpoint; admin page tests
- [x] Tokens and `@fade/ui` only; `pnpm docs:validate` green
