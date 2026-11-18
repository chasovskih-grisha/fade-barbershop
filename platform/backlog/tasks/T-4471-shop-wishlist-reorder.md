# T-4471 · Client Wishlist + Reorder

- **Stage**: M5 (phase 10) · **Tags**: backend, shop, client · **Complexity**: junior · **Depends on**: T-274, T-276
- **StoryPoints**: 3

## What

In the shop: client wishlist (list of items), "reorder" button (from the last order — availability check, cart assembly), push notification for items returning to stock for the wishlist. Data linked to the client (T-032), synchronized with the cabinet.

## Why

Products like shampoos that clients buy periodically make reordering almost default; the wishlist removes "forgot what I bought".

## Sources

- online-shop.md; T-274 (catalog), T-276 (cart), T-032 (client)

## Done

- [ ] Wishlist and "reorder" in the cabinet; cart is assembled from available items
- [ ] In-stock push notification (from T-080), no spam
- [ ] Unit test "reorder with unavailable SKU"

## Risks

- [ ] **Availability error**: reorder shows unavailable items as available — engine check required (T-271)
