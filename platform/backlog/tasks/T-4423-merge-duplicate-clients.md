# T-4423 · Merge Duplicate Clients

- **Stage**: M2 (phase 5) · **Tags**: backend, crm, high-risk · **Complexity**: senior · **Depends on**: T-060, T-046
- **StoryPoints**: 8

## What

Duplicate detectors (phone/client check-in, email, normalized names) with candidate matching in the CRM interface; drop-model merge **with event history**: merging two clients rebinds IDs, visits and events merge into the canonical account, atomic merge unit-of-work, and reconciliation audit; "≡" never overwrites past visits, only wraps the old ID into canonical (ADR 0009).

## Why

Clients book twice (e.g., walk-in phone + partner booking) → loyalty program (T-140) fails to consolidate points, messaging duplicates notifications, and reports are skewed. Merge is a one-time data operation with high risk.

## Sources

- crm README; ADR 0009 (substitution idempotency); T-140 (loyalty on canonical client)

## Done

- [ ] Detectors and candidates with "merge/keep separate" in admin UI
- [ ] Atomic merge transaction; complete event history for merged client
- [ ] Test suite run: loyalty/discounts/reviews are not lost after merge

## Risks

- [ ] **Points drift**: loyalty merged without consolidation results in lost card balances; business decision (sum vs max) resolved in open-decision #12
