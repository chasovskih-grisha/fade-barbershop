# T-4481 · Installment payment in shop

- **Stage**: M5 (phase 10) · **Tags**: backend, shop, finance · **Complexity**: middle · **Depends on**: T-275, T-4436
- **StoryPoints**: 8

## What

Installment plan for shop products (T-275): "installments" provider (partner payment organization) via card, without re-entering data; plan screen (amount/period/rate) at checkout, client limit check by provider, standard receipt (T-4434), provider payment status in log. Limitations: not for all categories, minimum amount.

## Why

Items > average check (2-3K cream) are rarely bought together; installments increase purchases (required by CLT-01), financial risk is on the provider.

## Sources

- online-shop.md; billing README; T-275 (shop payment), installment provider rules

## Done

- [ ] Installment initialization at checkout; limit check; standard receipt
- [ ] Provider payment status updates (in log with T-4404)
- [ ] Cancellation/refund (T-4470) works with installments (test)

## Risks

- [ ] **Financial liabilities**: variable amount not confirmed by provider → "wait for confirmation" block
