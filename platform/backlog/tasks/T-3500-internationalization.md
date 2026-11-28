# T-3500 · Third+ Languages, RTL, and Pseudolocalization

- **Stage**: M6 (phase 40) · **Tags**: frontend, quality · **Complexity**: senior · **Depends on**: T-4613
- **StoryPoints**: 20

## What

Expanding the existing localization to a third+ language (specifically `pl`, `de`) and maturing it:

- **`pl` and `de`**: interface catalogs, content translations as rows in the same `Translation` table (T-4613a), `hreflang` expands dynamically (list of locales, not hardcoded `uk`/`en`);
- **plugin dictionaries** — translation of external terms (Stripe, Checkbox) without leaking into the interface;
- **pseudolocalization** in CI (artificial long strings with accented characters) — catches button and card overflows before actual translation, not after;
- **RTL-ready architecture** — checks that UI is not bound to `left`/`right` (logical properties), otherwise the first `ar`/`he` will require rewriting all screens;
- **fallback chains** (`pl` → `uk`) — rule that a missing locale does not crash, but shows `uk` with a fair indicator (like T-4613a for content).

## Why

`uk` + `en` cover the foreign client request (2026-09-29 decision). The rest is market preparation where clients and employees with other languages might appear, and for OEM firms working with Polish/German clients. This is **not** a v1 blocker and should not be one.

## Sources

- **ADR 0053** (locale schema, fallback; `hreflang` from list, not manual), Unicode CLDR
- T-4613 (+a–d) — second language, switcher, content translation, SEO; T-4612a — package and gate
- `docs/design-system.md` (UX policies, logical properties instead of `left`/`right`), `docs/design-system.md` §Typography
- docs/roadmap.md §Out of scope: `pl`/`de`/RTL remain under a separate decision

## dependencies
> Slices are separated at task start; individual subtask files are created then if needed. Review the 20 SP estimate at start: currently stated without a specific list of languages, actual scope is determined by the `pl`/`de` decision.
