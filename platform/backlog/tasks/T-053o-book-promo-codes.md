# T-053o · Book Promo Codes

- **Stage**: M4 (phase 18) · **Tags**: frontend, promo, marketing · **Complexity**: middle · **Depends on**: T-050, T-090
- **StoryPoints**: 8

## What

Promo codes for bookings: creation in admin panel (code, discount % or fixed amount, validity dates, usage limit per user / total limit, applicable services/barbers), validation during booking checkout (API + UI error messages), calculation of final price, recording usage in booking/payment metadata, analytics (total revenue generated, usage count).

## Why

Marketing campaigns need promo codes to drive bookings and track channel ROI.

## Sources

- marketing/campaigns.md; T-050/090 (booking flow, payments)

## Done

- [ ] Admin CRUD for promo codes
- [ ] Checkout validation and discount application
- [ ] Usage tracking and limits enforcement
- [ ] Unit & integration tests

## Risks

- [ ] **Double application**: promo codes must not be stackable unless explicitly permitted
