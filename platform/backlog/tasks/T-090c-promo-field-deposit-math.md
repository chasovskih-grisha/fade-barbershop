# T-090c · Promo field + deposit math (2/12)

- **Stage**: M2 (phase 8) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-090b, T-091
- **StoryPoints**: 2

## What

Promo code field with instant validation (DSC-WEB-01…03) in the booking flow; deposit math — 10 UAH rounding (PAY-ADM-09) together with T-091.

## Why

Slice 3/3 of parent T-090: UI field and deposit integration are done together with the payment flow, not separately.

## Sources

- `DSC-WEB-01…03`; `PAY-ADM-09`
- `booking-flow-tests.md` (screen 5: cap + deposit rounding together)

## Done

- [ ] Promo code field with instant validation works in the flow
- [ ] 10 UAH deposit rounding matches T-091 (shared tests)

## Dependencies

- T-091 (deposit flow)
