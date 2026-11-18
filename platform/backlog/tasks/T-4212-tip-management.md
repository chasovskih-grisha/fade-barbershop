# T-4212 · Tip Management

- **Stage**: M5 (phase 22) · **Tags**: backend, payments, payroll · **Complexity**: middle · **Depends on**: T-090, T-120
- **StoryPoints**: 8

## What

Tip management system: tipping during online booking or post-service payment (preset percentages 5%, 10%, 15% or custom amount), split payouts to barber (tip goes 100% to the specific barber minus processing fee if applicable), reporting in barber cabinet (tips earned per day/week/month), integration with payroll calculation (T-120).

## Why

Cashless tipping is standard in modern service businesses; barbers expect transparent tracking and payout of their tips.

## Sources

- docs/payroll.md; T-090 (payments), T-120 (payroll)

## Done

- [ ] Tip selection UI in booking and POS payment
- [ ] Backend routing of tips to barber balance
- [ ] Barber cabinet tip reports
- [ ] Integration with payroll calculation

## Risks

- [ ] **Taxation of tips**: ensure legal compliance regarding tip reporting and taxation in target jurisdictions
