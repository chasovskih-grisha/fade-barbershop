# T-4476 · Shop Order Statuses

- **Stage**: M5 (phase 10) · **Tags**: backend, shop, client · **Complexity**: junior · **Depends on**: T-274, T-272
- **StoryPoints**: 5

## What

End-to-end order statuses (created/paid/reserved/assembled/fulfilled/returned/cancelled) with change history for both clients (client portal/shop) and operators: what happened and what to expect. Status update notifications via communication channels (T-080/T-4431). Integration with inventory reserves (T-4469).

## Why

Orders without statuses are a "black box" for shop operations; expected delivery and fulfillment dates reduce customer support overhead.

## Sources

- online-shop.md; T-274, T-272, T-4469; notifications (status)

## Done

- [ ] Statuses with audit history in client portal + notifications (channel preference)
- [ ] Manual or automated operator status updates (payment/inventory)
- [ ] State transition unit tests (invalid transitions blocked)

## Risks

- [ ] **Payment after cancellation**: cancelling a paid order automatically triggers a refund (T-4470) in test suite
