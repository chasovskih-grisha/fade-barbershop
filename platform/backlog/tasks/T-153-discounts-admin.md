# T-153 · Admin Discounts Management

- **Stage**: M3 (phase 5) · **Tags**: admin, backend, crm · **Complexity**: middle · **Depends on**: T-150, T-090
- **StoryPoints**: 5

## What

Admin interface and backend logic for managing discounts (DSC-001…005):
- Creating and editing discount rules: percentage or fixed amount, applicability (services, products, categories, clients, first visit, birthday), validity period, usage limits (total and per client).
- Promo codes management: generation, activation/deactivation, tracking usage count and total discount amount.
- Validation: overlap rules, maximum cumulative discount cap (e.g. max 30% per DSC-003).

## Why

Marketing campaigns and loyalty retention require flexible, centrally managed discount rules without hardcoding.

## Sources

- `docs/admin-screens.md` (Discounts section), DSC-001…005 rules, T-090 (agreed price / discounts core)

## Done

- [ ] Admin CRUD for discounts and promo codes
- [ ] Validation rules (caps, date ranges, usage limits)
- [ ] Integration with booking and shop checkout flow
- [ ] Audit logging for discount modifications
