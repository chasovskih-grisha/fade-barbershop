# ADR 0007. Discounts applied and fixed at booking (`AppliedDiscounts`)

- Status: accepted
- Date: 2026-09-09

## Context

Three discount types: **promo codes** (client enters code at booking), **automatic rules** (first visit, off-peak hours, days of week), **VIP level** of client (stands on card in `crm`). All affect sum client pays. ADR 0006 fixes `AgreedPrice` at booking; discounts must fix similarly — otherwise change of code/rule/level after booking changes bill of existing visit, violating payment predictability (`MNG-ADM-13` semantics).

Alternatives:

1. **Calculate discounts at payment/read time** — rule change affects old visits; client bill becomes unpredictable.
2. **Calculate and fix at booking** — like `AgreedPrice`: client sees final sum before confirmation, and it's unchanged.

## Decision

Context **`discounts`** — system of truth for **definitions** (`PromoCode`, `DiscountRule`, `ClientDiscountLevel`). At booking `scheduling` calculates applicable discounts via `discounts` and stores on `Appointment` list **`AppliedDiscounts`** — snapshot: `{ type, source (ID), amount (UAH) }`.

- `Appointment` = `ServiceId` + `AgreedPrice` + `AppliedDiscounts[]`; **`FinalPrice`** = `AgreedPrice` − Σ `AppliedDiscounts` ≥ 0. Payment and receipt — `FinalPrice` (extends ADR 0006: "visit price" — final sum after discounts).
- **Discount policy (decision, DSC-003)**: only **VIP level + promo code** stack; automatic rules — single most beneficial and don't combine; total discount ≤ **cap 30%** of `AgreedPrice` (configurable by admin).
- **Loyalty free visit** (`LYL-004`): priority — `FinalPrice = 0`, discounts not applied and don't stack with bonus.
- **Promo code**: validation at `book` (exists, active, not expired, limit not exhausted); usage counted at `book`; visit cancellation returns limit.
- Change/disable of code, rule or VIP level after booking **doesn't change** `AppliedDiscounts` of existing visits.

## Consequences

- Admin can safely edit discounts: old visits unchanged, `FinalPrice` stable.
- Discount statistics and code audit calculated from `AppliedDiscounts` on visits.
- Stack decision fixed (VIP + promo code, cap 30%). Policy change later — config change, without data migration: `AppliedDiscounts` already stores each applied discount separately.
