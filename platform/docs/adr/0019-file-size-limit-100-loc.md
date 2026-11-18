# ADR 0019: File size limit — target LOC < 100

- Status: accepted
- Date: 2026-09-14
- Contexts: all `apps/` and `packages/`, `docs/engineering-principles.md` (rule owner), T-001 (linter from first day)

## Context

"Single responsibility per file" rule without measure doesn't work: files grow by one `if` and commit, and on first deadline appears 400-line service nobody dares to split. For monolith with ~16 contexts this main mechanism to turn "well-structured" into legacy. Founder set target limit explicitly: **< 100 lines per file** — must fix as automatically verifiable rule, not review wish.

## Decision

### 1. Target < 100 lines of code, red build over limit

- ESLint `max-lines` with `skipBlankLines: true, skipComments: true` (code lines counted) — **error at > 100**. Rule enabled from first day (T-001), together with related limits from `engineering-principles.md`: cyclomatic complexity ≤ 10 (`complexity`), function parameters ≤ 3 (`max-params`).
- Rule suppression (`eslint-disable-next-line max-lines`) allowed only with justification in comment nearby — without it review doesn't pass. No "can't at all" threshold: honest exception possible, but always named and visible.
- Exceptions from check list (explicit in config): generated code (Prisma client, codegen), `*.d.ts`, lock files, test snapshots. Markdown documentation rule doesn't apply — about code.

### 2. Limit held by domain language separation, not splitting for counter

- 100 lines — one aggregate or VO, one use case, one controller with DTO in adjacent file, one screen component. Not harshness, but size fitting one review screen.
- Signal "file grew" means: look inside for second class or second use case — not exile code to helper dumps. Inflated abstractions for counter forbidden same as long files (anti-patterns in `engineering-principles.md`).
- Shared mutable state — shared file: if two "small" files constantly change together and have no sense without each other, this one file, split in half; caught by review.

## Consequences

- Positive: review fits screen; navigation and code search more precise; file growth over limit — early signal of project disorder, not "refactor sometime"; narrow files purposefully tested (pyramid in `engineering-principles.md`).
- Negative / cost: more files and explicit re-exports (acceptable: cheaper than legacy); Nest decorators and DTO classes push limit — convention: controller separate, DTO/validators/mappers — adjacent files.
- Rule ≠ goal: if honest decision objectively doesn't fit (e.g., tabular data matrix), take suppression with justification comment, not artificial splitting.

## Considered alternatives

1. **No limit, only review** — rejected: subjective limit doesn't restrain growth; exactly from "review will look" start files at 400+.
2. **Softer limit 200** — rejected: at 200 "second class" hides as unnoticeably as at 400; 100 keeps file on one screen.
3. **Strict 50** — rejected: Nest decorators, DTO and typed handlers don't fit honestly; mass suppressions would devalue rule.
4. **Only warn** — rejected: warnings nobody reads — path to disabled linter. Gate from first day cheaper than "clean later".
