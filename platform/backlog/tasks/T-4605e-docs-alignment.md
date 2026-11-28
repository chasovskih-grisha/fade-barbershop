# T-4605e · Documentation and specifications alignment with new convention (3/19)

- **Stage**: M6 (phase 40) · **Tags**: backend, architecture, quality · **Complexity**: middle · **Depends on**: T-4605a
- **StoryPoints**: 3

## What

Slice 5/5 of epic T-4605. **Documentation must follow the exact same convention as code** — otherwise the next endpoint (T-250, T-4553, T-4558) will bring `Dto` into the code along with this epic, and everything will have to be repeated. Specifications are especially dangerous here: most types named in them **are not implemented yet**, meaning this is not a description of existing code, but a request for future code — and they will dictate the names.

Linter gate is a separate slice **T-4605d**.

### Measured 2026-09-28 (15 files)

**1. Type names — 38 mentions, 32 unique, 11 files in `docs/admin/`** (rename per table T-4605a):

| File | Mentions | File | Mentions |
|------|----------|------|----------|
| `14-shop.md` | 5 | `04-calendar.md` | 3 |
| `03-services.md` | 5 | `02-barbers.md` | 3 |
| `12-referrals.md` | 4 | `01-locations.md` | 3 |
| `06-discounts.md` | 4 | `10-gallery.md` | 2 |
| `13-payments.md` | 3 | | |
| `11-gift-certificates.md` | 3 | | |
| `09-campaigns.md` | 3 | | |

**2. Word "DTO" as a concept rather than a type name — 3 files** (rephrase):

- `docs/admin/08-waitlist.md:42` — section header `## DTOs (inferred)` → `## Request/Response (inferred)`
- `docs/admin/05-clients.md:32` — "Client profile DTO includes: …" → "Client profile response includes: …"
- `docs/admin/16-shared.md:159` — "Domain logic, use-case handlers, DTO validation" → "…request/response validation"

**3. ADR 0019 — 4 mentions, separate decision.** `docs/adr/0019-file-size-limit-100-loc.md` (lines 21, 28, 35) discusses `DTO` as a concept ("single controller with DTO in adjacent file", "Nest decorators and DTO classes push against limit — convention: controller separate, DTO/validators/mappers in adjacent files"). Problem: if T-4605a decides to rename the `dto/` folder (open question #5), **the convention specified in it will break** — meaning part of the approved ADR becomes incorrect. Approved ADRs are not rewritten retroactively: either a line amend is needed, or a new ADR explicitly revoking this specific point and removing the rule from `dto/`. This is a decision, not a mechanical edit — it must be recorded in T-4605a along with point #5.

**4. Three files with zero mentions — need additions, not renames.** Currently zero `Dto` mentions in `docs/engineering-principles.md`, `docs/review-checklist.md`, `docs/ubiquitous-language.md` (verified):

- `docs/ubiquitous-language.md` → section "Forbidden synonyms in code": Add `Dto` / `Input` / `Result` / `Body` → `Request` / `Response` / `Payload` by role. **This is the primary place**: here the convention becomes part of the domain dictionary, not a private backend agreement.
- `docs/engineering-principles.md` → briefly describe the three-suffix rule and linter gate (ADR from T-4605a) so the next developer does not reinvent the convention.
- `docs/review-checklist.md` → review point: "boundary types named by role (`*Request`/`*Response`/`*Payload`), not `*Dto`; rule from T-4605a Done".

Context READMEs and code READMEs have no DTO mentions — no changes needed.

## Why

A specification is an order for code. If `docs/admin/01-locations.md` specifies `CreateLocationDto`, then the developer writing T-4553 per this spec will create `CreateLocationDto` — and the convention spreads at a moment when no one followed it because they were taught by this very file. Documentation here is not support, but the **source** of convention.

## Sources

- `docs/ubiquitous-language.md` ("Forbidden synonyms in code" — expanded)
- `docs/engineering-principles.md` (ADR 0019 — strict gates, naming style)
- `docs/review-checklist.md`
- `docs/adr/0019-file-size-limit-100-loc.md` (deprecates along with `dto/` item)
- T-4605a (rename map)

## Done

- [ ] 38 mentions of type names in 11 files `docs/admin/*.md` fixed per table T-4605a; zero new `Dto` added in specs
- [ ] Three conceptual mentions rephrased (`08-waitlist.md`, `05-clients.md`, `16-shared.md`)
- [ ] `docs/ubiquitous-language.md`: "Forbidden synonyms" has a line about `Dto`/`Input`/`Result`/`Body` with the three-suffix rule
- [ ] `docs/engineering-principles.md`: rule and link to linter gate (T-4605d) added
- [ ] `docs/review-checklist.md`: review point on boundary type names present
- [ ] ADR 0019: decision recorded — amend or new ADR; `docs/adr/` has no text contradicting the approved decision
- [ ] CI gate failing on `Dto` in `docs/**/*.md` (along with linter gate T-4605d)
- [ ] `pnpm docs:validate` green

## Risks

- **Spec editing looks like "just text" — and gets postponed.** The cheapest way to wreck an Epic: do b/c/d, leave docs for later. Therefore specs are extracted into a separate Slice with its own Done, rather than "plus-to-linter".
- **ADR 0019 rots unnoticed.** No one notices that the approved decision now has an empty convention. Solved by explicit amend/ADR in T-4605a, not silence.
- **Additions to `ubiquitous-language.md` affect other tasks.** A new forbidden synonym is a change for all code, not just DTOs. Verify the rule doesn't conflict with terms already in "Network"/"Money".

## Dependencies

- T-4605a (rename map; decision on `dto/` folder and encoding ADR 0019 amend)
- T-4605d (shared CI gate on `Dto` in code and `docs/`)
