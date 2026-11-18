# T-4469 · Shop Product Reserve → In-Salon Sale

- **Stage**: M5 (phase 10) · **Tags**: backend, shop, inventory · **Complexity**: middle · **Dependencies**: T-271, T-272, T-4434
- **StoryPoints**: 5

## What

Link between online store order and physical sale: product reserve on order, in-salon sale (scanner) writes off from reserve, cancellation returns to stock (T-271), receipts separated (online vs. fiscal cash register).

## Why

Prevents selling items in the salon that are already reserved online.

## Sources

- T-271 (shop lite reserve), T-272 (inventory), T-4434 (fiscal)

## Done

- [ ] Order reserves stock immediately
- [ ] POS scanner recognizes online order reserve
- [ ] Cancellation restores stock correctly
- [ ] Receipts account for reserve status

## Risks

- [ ] **Race conditions**: online order and in-salon checkout at the exact same moment — stock locking / transaction isolation.
