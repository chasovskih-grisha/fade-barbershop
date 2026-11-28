# T-270g · Shop Payment Integration

- **Stage**: M4 (phase 22) · **Tags**: shop, billing, frontend · **Complexity**: senior · **Depends on**: T-270, T-275
- **StoryPoints**: 8

## What

Integration of online payment gateways for the online shop (checkout payment flow, webhook handling, payment status updates, refund handling, receipt generation).

## Why

Customers need a seamless and secure way to pay for products online during shop checkout.

## Sources

- `docs/online-shop.md`
- `docs/acceptance-criteria/01-billing-payments.md`

## Done

- [ ] Payment gateway SDK integrated
- [ ] Checkout payment flow implemented
- [ ] Webhooks for payment confirmation handled securely

## Risks

- [ ] **Webhook reliability**: handling out-of-order or duplicate webhook events from payment providers.
