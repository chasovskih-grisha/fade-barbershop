# ADR 0010. `haircut-ai` and `loyalty` don't introduce own prices for client

- Status: accepted
- Date: 2026-09-09

## Context

Question: do `haircut-ai` (AI haircut selection) and `loyalty` (bonus "every 7th visit") carry own prices or payments, to which price snapshot pattern would apply (ADR 0006 — `AgreedPrice`, ADR 0007 — `FinalPrice` after discounts)?

Analysis:

- **`haircut-ai`** — client price **absent**. Generation free for client and limited by **limits** (3 per day, AI-ADM-03), not payment. Generation cost — internal OPEX (payment to external provider via ACL, ADR 0008), not modeled as price in domain.
- **`loyalty`** — own price **absent**. `FreeVisit` = 0 ₴ — this is **`FinalPrice` zeroing** (ADR 0007, LYL-004), not separate price. "Cost" of free visit for business — derived from `AgreedPrice` snapshot (internal accounting/statistics), not client price.

Conclusion: price snapshot not needed for these contexts **because nothing to fix**. But boundary must be fixed so future changes don't introduce price "quietly", outside known pattern.

Alternatives (consciously not doing now): paid AI tariff (premium generations), paid loyalty program/subscription.

## Decision

- **Only price path to client**: `catalog` (`Price` by location) → `scheduling` (`AgreedPrice`, ADR 0006) → `discounts` (`FinalPrice`, ADR 0007) → `billing` (Payment/receipt, PAY-001/002). **No other context introduces prices.**
- `haircut-ai` and `loyalty` **without own prices**: `haircut-ai` — limits instead of payment; `loyalty` — `FinalPrice` zeroing instead of separate price.
- **Future client payment** (paid AI tariff, loyalty subscription etc.) introduced **only via existing model**: new service in `catalog` (or new price-bearing context) + snapshot at booking per ADR 0006 + discounts per ADR 0007. No separate "price in air" created; such decision formalized by **new ADR**, not quiet field in context.
- Internal cost (AI provider, free visit cost) — **operational accounting**, not client price; not modeled as `Price` in domain.

## Consequences

- Question "is ADR needed about prices in `haircut-ai`/`loyalty`" closed: not needed, because no prices; this ADR fixes boundary and answer to future.
- Future paid features fall into known pattern (snapshot), without price model migration.
- Statistics of "cost" of free visits and AI generations — from operational data, not from `Price`.
