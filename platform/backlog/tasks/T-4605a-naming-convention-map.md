# T-4605a · Naming Convention and Rename Mapping (3/19)

- **Stage**: M6 (phase 40) · **Tags**: backend, architecture · **Complexity**: middle · **Depends on**: —
- **StoryPoints**: 3

## What

Slice 1/5 of epic T-4605. Prior to any mechanical renaming, establish the rule and compile a **complete table of "old name → new name"** for all 29 unique names (38 declarations) plus the `packages/contracts` convention. Close 6 open questions from the parent task with decisions recorded in an ADR. The result is a document according to which b/c/d/e are executed without subjective judgment; if a developer makes decisions during renaming, the epic will fracture even further.

No mechanical code in this slice — only decisions, the mapping table, and a gate verifying that the rule is non-contradictory.

## Why

Renaming affects four applications and five packages. If each context decides independently whether it is a `Request` or `Response`, or `Payload` vs `Request`, the outcome will be a worse convention than `Dto`: confusion that is hard to spot during reviews because each decision looks locally logical. Six questions (`SlotRequestRequest` collision, nested types, fate of `*Input`/`*Result`, `*ErrorBody`, `dto/` folder, `Payload` boundary) are precisely where "correct" is not unambiguous.

## Sources

- `docs/engineering-principles.md`, `docs/ubiquitous-language.md`
- T-4605 (section "Open Questions")
- Inventory from T-4605 (measured 2026-09-28)

## Done

- [ ] ADR created: three-suffix rule, `Payload` boundary, decisions on all 6 open questions
- [ ] Rename mapping table complete: 29 names from `apps/api` + 9 from `apps/web` + 14 from `packages/contracts`, with old name, file, new name, category, and a one-sentence rationale for each
- [ ] Rule checked for contradictions: no new name reads ambiguously in context (no `XRequestRequest`, no `Response`/`Payload` pair for the same body)
- [ ] `Payload` category has initial candidates from upcoming tasks (T-3102, T-3100, T-092/T-093, T-050, T-2001) — otherwise the suffix remains dead
- [ ] Commit plan fixed: one commit per context, `git mv` to preserve file history

## Mapping (Draft for ADR Population)

**`apps/api` — Requests** (body/query entering the API):

| Old | New |
|------|-------|
| `CreateLocationDto` | `CreateLocationRequest` |
| `UpdateLocationDto` | `UpdateLocationRequest` |
| `CreateBarberDto` | `CreateBarberRequest` |
| `UpdateBarberDto` | `UpdateBarberRequest` |
| `CreateServiceDto` | `CreateServiceRequest` |
| `UpdateServiceDto` | `UpdateServiceRequest` |
| `SetPriceDto` | `SetPriceRequest` |
| `CreateBookingDto` | `CreateBookingRequest` |
| `BookSlotDto` | `BookSlotRequest` |
| `CreateAppointmentPartyDto` | `CreateAppointmentPartyRequest` |
| `DraftArticleDto` | `DraftArticleRequest` |
| `UpdateArticleDto` | `UpdateArticleRequest` |
| `SlotRequestDto` | `SlotQueryRequest` ← Question 1 (suffix collision) |

**`apps/api` — Responses** (leaving the API):

| Old | New |
|------|-------|
| `LocationDto` (2 declarations: booking, locations) | `LocationResponse` |
| `BarberDto` (2 declarations: booking, identity) | `BarberResponse` |
| `ServiceDto` | `ServiceResponse` |
| `AvailableSlotDto` | `AvailableSlotResponse` |
| `ArticleDto` | `ArticleResponse` |
| `ArticleSummaryDto` | `ArticleSummaryResponse` |
| `NearestLocationDto` | `NearestLocationResponse` ← Question 2 (envelope element) |
| `NearestLocationsResponseDto` | `NearestLocationsResponse` |

**`apps/api` — Payloads / Domain objects / Errors**:

| Old | New | Notes |
|------|-------|-------|
| `ReviewPayload` | `ReviewPayload` | Kept (`Payload` category) |
| `ErrorResponseDto` | `ErrorResponse` | Standard error body |

## Risks

- [ ] **Scope creep**: turning naming rules into a refactoring of business logic itself.

## Implementation plan

Deliverables (no mechanical rename — that is T-4605b…e):

- `docs/adr/0055-dto-naming-convention.md` — the three-suffix rule, the `Payload`
  boundary, and decisions on all 6 open questions.
- `docs/dto-rename-map.md` — the complete old→new table (48 names in `apps/api`,
  10 in `apps/web`, 31 in `packages/contracts`) plus the commit plan.
- `scripts/validate-docs/check-rename-map.mjs` — contradiction gate for the table.
- `scripts/validate-docs/test/check-rename-map.test.mjs` — its unit tests.
- `docs/ubiquitous-language.md` — the forbidden synonyms; `docs/review-checklist.md` —
  the review item; `docs/adr/README.md` — the ADR row.

Checks:
- `node --test scripts/validate-docs/test/check-rename-map.test.mjs`
- `pnpm docs:validate`
- `pnpm docs:test`
