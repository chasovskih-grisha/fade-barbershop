# Admin Panel — Shared Sections

## Authentication & Authorization

### Authentication Mechanism
1. **Login**: `POST /admin/auth/login` with `{username, password}`
   - Credentials validated against database
   - On success: sets HTTP-only cookie `admin` domain `.fade.com.ua`

2. **Session**: Cookie-based authentication
   - Cookie name from `SESSION_COOKIE_NAME` config
   - Domain: `.fade.com.ua` (covers all subdomains: website, shop, admin, API)
   - Single session per user (SSO principle — one login covers all touchpoints)

3. **Me endpoint**: `GET /admin/auth/me`
   - Reads session cookie
   - Validates token hash
   - Checks `session.channel === 'admin'`
   - Returns user `{id, phone, role}`

4. **Logout**: `POST /admin/auth/logout`
   - Clears the admin cookie; clears session everywhere (website, shop, admin)

### Authorization (Role-Based)
- **v1**: Single role `admin` (founder/owner)
  - Full access to all admin screens and API endpoints
  - UI hides elements, but API always checks permissions

- **Future (phase 9+)**: Additional roles
  - `location_manager`: Manages own location only (filters by StaffAssignment)
  - `barber`: Limited mobile mirror access (does not login to admin; uses mobile app)
  - `client`: Own data only (mobile cabinet; no admin access)

### Access Control Principles
- **UI hides, API verifies**: Interface may show buttons, but API rejects unauthorized commands
- **Direct URL access without role → 403**
- **Location scoping**: `StaffAssignment`/manager assignment filters data by location
- **Passwordless for clients**: Users login via phone+OTP (separate from admin)

### Cookie Structure
- Domain: `.fade.com.ua`
- One cookie session covers: website, shop, admin, API
- Logging out admin clears session everywhere

## API Conventions

### Base URL
- Admin API: `http://localhost:13002` (Next.js) — serves the admin panel
- Public API: `http://localhost:13000` (NestJS) — serves all business domains

### Authentication
- All admin-protected endpoints require session cookie `admin` (set on login)
- Cookie sent automatically via `credentials: include` in fetch/Axios
- `GET /admin/auth/me` validates session and returns current user
- Endpoints under `/admin/` prefix are admin-protected; `/api/` or root endpoints are public or role-scoped

### Standard Response Format
- Success: `{ data: T, success: true }` or direct data object
- Error: `{ error: string, code: string, success: false }`
- Validation errors: `{ field: string, message: string }` per field — displayed inline in UI

### Error Handling
- UI: banner with error message + "Retry" button for API errors
- Validation: error next to field in forms (Ukrainian language); inline, not modal
- 401 → redirect to login; 403 → show "Access denied"; 404 → not found
- Network errors: retry button; offline handling not primary concern (web app assumed online)

### Pagination (for list endpoints)
- Common pattern: `GET /admin/locations?page=1&perPage=20&filter=...`
- Response: `{ items: T[], total: number, page: number, pages: number }`
- Default perPage: 20; max: 100

### Filtering & Search
- Query params for: status, location, period, search term
- Example: `GET /admin/clients?status=active&location=CLT-01&search=Ivan`
- Server-side validation of filter values; invalid filters → 400

### HTTP Methods
- `GET` — List or retrieve (idempotent, cacheable where applicable)
- `POST` — Create; also used for actions: `POST /admin/barbers/:id/deactivate`, `POST /admin/bookings`, `POST /admin/discounts/promo-codes`, etc.
- `PATCH` — Partial update
- `DELETE` — Rare; used for soft-delete/logic (e.g., cancel reservation, deactivate)

### Rate Limiting
- Admin endpoints subject to rate limiting (per IP or per admin user); specifics in API gateway config; typical: 100 requests/minute per admin session

## Shared UI Components

### Component Library (`@fade/ui`)
All admin UI components are imported from the shared `@fade/ui` package. Key components used across admin panels:

| Component | Purpose | Used in Domains |
|-----------|---------|-----------------|
| `Sidebar` | Main navigation vertical bar | All pages |
| `Header` | Location filter, admin name, logout | All pages |

Adaptive behaviour of the sidebar (icon rail, burger, Sheet drawer) at 320/768/1024px,
side by side with the pre-adaptive version: [sidebar-responsive.html](sidebar-responsive.html).
| `Table` / `THead` / `TBody` / `TR` / `TH` / `TD` | Data tables | Locations, Barbers, Services, Clients, Payments, etc. |
| `StatusPill` | Status badge (active/inactive/pending) | Almost all domains |
| `Button` | Action buttons (primary/secondary/variant) | All forms and lists |
| `TextField` | Input fields with label | All forms |
| `StatusPill` | Colored status badge | MNG-ADM-01, MNG-ADM-02, MNG-ADM-05, etc. |
| `Tabs` / `TabItem` | Tabbed interfaces | Services page (MNG-ADM-10), Dashboard (ANL-ADM) |
| `Badge` | Tone-variant badges (accent, error, warning, etc.) | Locations status, Discounts type, etc. |
| `Select` | Dropdown select | Categories, applicability, filters |
| `Toggle` | Switch button for boolean flags | Active/inactive toggles across domains |
| `Table` with filter bar | List pages with filter-bar + table | Most list domains |
| `Modal` | Confirmation modals, forms, complex workflows | Schedule conflicts, deactivate confirmations, refund modals, etc. |
| `StatusPill` | Status badges (booked, confirmed, completed, cancelled, no-show) | Calendar, payments |
| `Loader` / `Skeleton` | Loading states instead of tables | Empty/states and loading |
| `AlertBanner` | Error/success banners (API failures, confirmations) | All domains |

### Form Patterns
- **Two-section forms**: (1) Entity data, (2) Domain-specific editor (hours, schedule, pricing matrix)
- **Confirmation dialogs** for destructive actions: deactivate, delete, cancel, refund
- **Inline validation** with Ukrainian error messages next to fields
- **Submit states**: disabled + spinner during API call; "Retry" on failure

### Empty States
- All list pages have empty state with message + CTA (Create button, onboarding link)
- Visual style: illustrated or icon + text + primary action button
- Consistent across domains, themed via design tokens

### Loading States
- Skeleton screens replace tables during data fetch
- Full-page loader for initial page load
- Button spinner during form submit

## Development Guidelines

### General Principles (from `docs/engineering-principles.md`)
- **One aggregate per transaction**: No cross-aggregate updates in single DB transaction; use events for cross-context communication
- **Between contexts — events, not shared entities**: Domains communicate via domain events, not directly sharing DB tables or entities
- **Client depends on `packages/contracts`**, not internal API domain: CRM client, web, mobile all use shared contracts DTOs
- **Commands in domain language**: `book`, `confirm`, `reschedule`, not `setStatus`; use use-case commands
- **After UI implementation — verify in browser/simulator, not just screenshots**: Visual regression + functional testing
- **Code with test pyramid**: unit on domain, functional on use case, e2e on GWT scenarios; coverage gates CI — red build below line
- **Review code against engineering principles** so strictly, as against acceptance criteria — via `docs/review-checklist.md` checklist
- **New screens — with design-system tokens**: hex/px forbidden in screens; missing component — extend `packages/ui`, don't hack locally in screen
- **LOC < 100**: target; temporarily is not accepted — linter gate, not preference
- **Don't mock what has fake port**: `FakeOtpSender`, `FakeAcquiringGateway`, `FakeAiGenerationGateway` (engineering-principles.md)

### Admin-Specific Guidelines
- **All mutations via API, not Prisma from admin**: Admin panel forms → API endpoints; no direct Prisma queries from admin code
- **Hours schedule cross-checked against location OpeningHours**: Save blocks or warns if barber schedule exceeds location hours (MNG-ADM-09)
- **Chair active status excludes from scheduling**: Inactive chairs not counted in available slots
- **Code uniqueness enforced server-side**: Location code, promo code, phone number uniqueness
- **Deactivated items hidden from new flows**: Deactivated location/barber/certificate not shown in new booking/issuance
- **Price snapshotted at booking**: `AgreedPrice` frozen at appointment creation; price changes afterward don't affect existing appointments
- **Combined discount cap 30%**: DSC-003; enforced at booking time; UI may show warning if exceeded
- **UI hides, API verifies**: Matrix in `products.md` §2 is not only visibility; each command server-side checks role + location scoping

### Code Conventions
- **TypeScript**: All admin panel code; strict mode; no `any` where possible; proper types for DTOs
- **Component composition**: UI components composed from `@fade/ui`; page-specific logic in page files; no UI logic in shared components unless generic
- **Naming conventions**: camelCase for variables/functions; PascalCase for components; UPPER_SNAKE_CASE for constants; lowercase for enum values where applicable
- **Error handling**: Try/catch in async functions; specific error types caught; generic fallback for unexpected errors
- **Environment-specific config**: `SESSION_COOKIE_NAME`, `DEFAULT_COOKIE_CONFIG`, `DEV_MODE` flags; not hardcoded

### Testing Guidelines
- **Unit tests**: Domain logic, use-case handlers, DTO validation; `spec.ts` alongside source or in `__tests__`
- **Functional tests**: API endpoint testing with test data; integration of admin forms → API → response
- **E2e tests**: GWT (Given-When-Then) scenarios; full user flows: login → create location → create barber → create service → book appointment
- **Coverage gates**: CI fails if coverage below threshold (typically 80%); new code must not reduce coverage
- **Test data**: use test fixtures; don't rely on production data in tests; test OTP sender is console (`OTP_PROVIDER=console`)

### Domain-Driven Design Notes (from `docs/bounded-contexts.md`)
- **Bounded contexts**: Locations, Scheduling, CRM, Discounts, Billing, Loyalty, Feedback, Portfolio, GiftCertificates, Referrals, Shop — each with own model, DB schema, API
- **No shared entities across contexts**: User is shared (identity), but ClientProfile, Barber, Location are context-specific; no cross-context DB tables
- **Events for communication**: `AppointmentCreated`, `PaymentCaptured`, `LoyaltyFreeVisitGranted`, `DiscountApplied`, `GiftCertificateRedeemed`, `ReferralCompleted` — published via outbox, consumed by other contexts
- **Aggregates root**: Location, Barber, Appointment, ClientProfile, GiftCertificate — each with own lifecycle and invariants
- **Read models**: Projections for KPI dashboard, waitlist, statistics; built from events; denormalized for read performance

### Common Pitfalls to Avoid
- Don't implement business logic in UI components — move to use cases/services
- Don't use Prisma directly from admin — go through API endpoints (even local dev proxy)
- Don't hardcode coordinate or phone formats — use validation DTOs and server-side checks
- Don't forget location scoping when filtering data — UI may show all, but API must filter by `StaffAssignment`
- Don't combine discount types beyond 30% cap — enforced at booking; UI should warn but not block (v1 behavior)
- Don't deactivate location/barber/certificate without confirmation referencing counts — confirmation modals required
- Don't change pricing without "applies only to new appointments" banner — confirm-banner pattern
- Don't mock fake ports in production code — use real integrations or feature flags

## Links to Related Documentation
- `docs/engineering-principles.md` — full principles, test pyramid, review checklist
- `docs/bounded-contexts.md` — domain boundaries, events, aggregates
- `products.md` — role matrix, overall architecture, screen access matrix
- `docs/adr/` — architecture decision records for technical decisions
- `docs/review-checklist.md` — code review checklist (principles + AC)
- `docs/design-system.md` — design tokens, forbidden hex/px in screens, component library
- `AGENTS.md` — this file; development platform guidelines