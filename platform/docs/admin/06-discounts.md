# Admin Panel — Discounts Domain

## Purpose
Management of all types of discounts: promo codes, discount rules, and VIP client discounts. Handles creation, activation/deactivation, rule configuration, and statistics. Core business rule: combined discount cap of 30% across all discount types (DSC-003).

## Pages & Features
- **Promo Codes List** (`DSC-ADM-01…06`)
  - **Layout**: Header + "Create promo code" → Filter bar (Status: All / Active / Inactive; Type: % / Sum) → Table
  - **Columns**: Code, Type (% / UAH), Value, Validity (start / end), Usage (`n/limit`), Status (badge), Actions (Edit, Activate/Deactivate)
  - **Empty state**: "No promo codes yet — create first."
  - **Deactivate** → confirmation: "Code will stop working for new appointments. N already used codes will not change." (`DSC-001`)

- **Promo Code Form** (`DSC-ADM-01`)
  - **Fields**: Code (text, uppercase, required, unique — server-side; case-insensitive, spaces ignored), Type (select % / Fixed amount), Value (number, %: 1–100; UAH: > 0), Validity (start date / end date, "end" > "start"), Usage limit (number or "unlimited", ≥ 0), Applicability (radio: All services / Selected services + multiselect), Active (toggle)
  - **Validation**: Server-side unique check; "end" > "start"; hours not relevant
  - **Applicability**: Optional; if selected, multiselect of specific services

- **Discount Rules List** (`DSC-ADM-02`)
  - **Layout**: Table with columns: Condition (e.g., "First visit", "Non-peak: Mon–Thu 10:00–13:00"), Value (% / UAH), Active (toggle), Actions (Edit, Activate/Deactivate)
  - **Form**: Condition (select: First visit / Non-peak hours); for non-peak: days checkbox Mon–Sun + hours From/To; Value (% / UAH); Active
  - **Validation**: Warning on duplicate condition ("Such condition already exists"); hours "From" < "To"
  - **Change impact**: Does not affect existing appointments (`DSC-001`) — confirm-banner: "Change applies only to new appointments."

- **VIP Discount on Client Card** (`DSC-ADM-03`)
  - **Field**: VIP discount (% / UAH) on client profile card (see Clients CRM §6.2)
  - **Change**: Logged (who, when, reason)
  - **Combination note**: VIP combines only with promo code, total cap 30% (DSC-003)

- **Discount Statistics** (`DSC-ADM-04, DSC-ADM-06`)
  - **Layout**: Filters (Location, Period, Discount type) → Summary cards (Total discount, Application count, Average discount) → Tables:
    - By promo codes: code, usage, total discount
    - By rules: condition, application count
    - By location: total discount for period
  - **Data source**: `AppliedDiscounts` on appointments (not current settings) — statistics do not change when rules are modified (`DSC-001`)
  - **Default cap**: 30% total discount — configurable in "Settings" (`DSC-ADM-06`)

## API Endpoints
Promo codes and discount rules are managed through the NestJS API `discounts` module. Based on the codebase:

- `POST /admin/discounts/promo-codes` — Create new promo code
- `GET /admin/discounts/promo-codes` — List promo codes with filters
- `PATCH /admin/discounts/promo-codes/:id` — Update promo code (active toggle, etc.)
- `POST /admin/discounts/promo-codes/:id/deactivate` — Deactivate promo code
- `GET /admin/discounts/rules` — List discount rules
- `POST /admin/discounts/rules` — Create discount rule
- `PATCH /admin/discounts/rules/:id` — Update discount rule
- `GET /admin/discounts/statistics` — Discount statistics (location, period, type filters)

## DTOs (from acceptance criteria and code analysis)
- `CreatePromoCodeDto`: code, type (% / fixed), value, validity_start, validity_end, usage_limit, applicability (selected services), active
- `UpdatePromoCodeDto`: same fields as create (partial update)
- `DiscountRuleDto`: condition, value, active
- `DiscountStatisticsDto`: total_discount, application_count, average_discount, breakdown_by_type, breakdown_by_location

## Business Rules
- **Promo code**: unique code, case-insensitive, spaces ignored; type % (1–100) or fixed UAH (> 0); validity period with "end" > "start"; optional usage limit (≥ 0); optional applicability to specific services
- **Discount rule**: condition "First visit" or "Non-peak hours"; for non-peak: days Mon–Sun + hours From/To; value % (1–100) or UAH (> 0); active toggle
- **VIP discount**: on client card; combinable only with promo code; total cap 30% across all discount types (DSC-003)
- **Combined cap 30%**: sum of all applied discounts (promo + VIP + rule discounts) cannot exceed 30% of `AgreedPrice`; any excess is capped at 30% (DSC-003)
- **Statistics**: based on `AppliedDiscounts` snapshots stored at appointment time; changing rules does not retroactively change past appointments
- **Deactivation**: promo code stops working for new appointments; existing uses preserved; rule deactivation same principle

## Permissions
- `admin` role only (v1)
- Direct URL access without role → 403
- Location scoping for statistics (manager sees own location only in phase 9+)

## Development Notes
- Promo code uniqueness: server-side check, case-insensitive, spaces normalized
- Discount rule condition uniqueness: warning on duplicate, not hard block
- Value validation: % is 1–100, fixed UAH is > 0
- Combined cap 30% enforced at booking time: any discount combination that exceeds 30% is capped; UI shows warning
- Statistics computed from `AppliedDiscounts` array on each appointment; not recomputed on rule change
- UI: confirm-banner on rule change references "N appointments with old price will not change"
- Applicability (promo codes): optional multiselect of services; if not selected, applies to all

## Important Edge Cases
- Changing a discount rule does not affect already-booked appointments; confirmation banner references count
- Combined 30% cap: if cart/total discounts would exceed 30%, the excess is silently capped; no error shown to user
- Promo code with "unlimited" usage: limit field shows "No limit"; actual count tracked server-side
- VIP discount: if applying both VIP + promo + rule, total cannot exceed 30%; UI may show breakdown
- Discard statistics: reflects historical data; does not update when rules change — this is intentional per `DSC-001`

## Links to Related Documentation
- `docs/acceptance-criteria/04-admin-management.md` (DSC-ADM-01…06)
- `docs/acceptance-criteria/07-discounts.md` (full discount mechanism)
- `docs/ubiquitous-language.md` (PromoCode, DiscountRule, ClientDiscountLevel, AppliedDiscount, FinalPrice, RevenueLeakage)
- `products.md` (§7 — discounts, VIP, combined cap 30%)
- `docs/roadmap.md` (phases 13 — discounts, 25 — public reviews synergy)
- `docs/adr/` (ADR 0007 — free visit price 0; ADR 0003 — discount mechanisms)
- `docs/admin-screens.md` (§7 — discounts)