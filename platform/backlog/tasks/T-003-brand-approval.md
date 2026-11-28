# T-003 · Brand Name Approval (Launch Gate)

- **Stage**: M0 (phase 0) · **Tags**: devops · **Complexity**: — · **Depends on**: none

## What

Approve brand name. Decision made (2026-09-16): FADE — brand/FADE_FINAL_STATUS.md, platform brand/fade-platform.md, production kit brand/fade_01_kit/.

## Why

Launch v1 checklist gate: name affects store bundle ids, domain, and styling — after starting phase 6 (mobile) changing the name becomes drastically more expensive.

## Sources

- roadmap.md v1 checklist (phase 0: "Brand name approved"); name FADE — brand/FADE_FINAL_STATUS.md

## Done

- [x] Name approved by founder (FADE, 2026-09-16) and recorded: brand/FADE_FINAL_STATUS.md
- [ ] TM check and filing for registration — open, high priority (decision 2026-09-21: first TM, then fade.ua)
- [x] Domain fade.com.ua registered by founder (2026-09-21)
- [ ] Domain fade.ua — deliberately postponed until TM certificate (decision 2026-09-21): .UA second-level zone is registered only on the basis of a TM certificate — the registry requirement itself protects against hijacking (without someone else's TM "FADE" nobody can take the domain)

## TM — Practical Plan (Brief)

1. Database search Ukrnoivi before filing (verifying marks in class 44 — "barbershop/hairdressing services").
2. Nice classes: 44 — services (core); classes 3 (cosmetics) and 35 (retail) — add before full shop launch, not now.
3. Filing fixes priority from application date — review is lengthy (up to ~2 years), but rights to fade.ua and brand protection start with filing.
4. After receiving certificate — registration fade.ua (UA Domains, requirement: certificate with name identical to domain) + social media handles. Handles @fade* — without TM, register in parallel with filing (open item T-003).
- [ ] Social media handles registered — open

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain Events**: subscriptions are idempotent (pattern ADR 0009/0016)
