# T-4436 · Apple Pay / Google Pay

- **Stage**: M2 (phase 5) · **Tags**: mobile, payments, integration · **Complexity**: middle · **Depends on**: T-091, T-275, T-4433
- **StoryPoints**: 5

## What

Express payment via Apple Pay / Google Pay (App Store / Play account-token through payment provider T-092) for booking, deposit, and shop checkout flows. Web payment page (T-4335 / T-4435) + mobile NHS (T-4433 consumed during provider interaction if supported). Domain verification and self-payment setup in the provider console.

## Why

Mobile clients should not have to enter card details on every screen; Apple Pay / Google Pay is the standard for purchase conversion (an online shop requirement in T-275+shop).

## Sources

- billing README; online-shop.md; client-screens (payment); T-275 (shop)

## Done

- [ ] Apple/Google Pay checkout in booking and shop flows (3DS fallback)
- [ ] Provider failure handling without losing the booking (retry pool)
- [ ] Domain / merchant configuration documented in runbook

## Risks

- [ ] **Device limits**: test 1 to 3 retry attempts without duplicate charges (idempotency key)
