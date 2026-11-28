# T-4552 · Gift cards: digital/physical, balance, expiry, partial redeem, transfer, reporting

- **Stage**: M4 (phase 20) · **Tags**: backend, billing, marketing · **Complexity**: middle · **Depends on**: T-210, T-211, T-4456, T-4549
- **StoryPoints**: 8

## What

Extension of gift certificates (T-210/211/4456) to full gift cards:
- **Digital gift card**: code (UUID/short code), QR, balance, validity period, design (templates), instant delivery via email/SMS/push
- **Physical gift card**: plastic card with magnetic stripe/QR, activation upon sale (POS), numbering, batches
- **Purchase flow**: web/mobile/admin — selection of denomination/amount, design, recipient (email/phone), payment (T-4549), code generation
- **Balance tracking**: `GiftCard` (code, initialAmount, currentBalance, currency, expiresAt, status: ACTIVE/EXPIRED/REVOKED)
- **Partial redemption**: redemption by partial amount, remaining balance is saved, redemption history
- **Expiry management**: configurable validity period (default 1 year), auto-expiration, notifications 30/7/1 days before (T-080)
- **Transfer/gift**: client can transfer a gift card to another client (new code generated, old revoked) — optional
- **Breakage reporting**: unredeemed balances after expiration — revenue recognition (accounting)
- **Sales reporting**: cards sold, amount, redeemed, breakage, average gift card check
- **Admin bulk actions**: generation of physical card batches, code export for printing

## Why

Gift certificates are a significant sales channel (holiday seasons). Digital + physical, partial redemption, breakage.

## Sources

- T-210/211 (gift certificates), T-4456 (certificate redemption), T-4549 (payments), T-080 (notifications)
- Altegio: electronic/physical gift cards, partial usage, balance, validity, breakage

## Done

- [ ] Domain: `GiftCard` (code, initialAmount, balance, expiresAt, status, purchaserClientId, recipientClientId?, designTemplate)
- [ ] Purchase use case: payment → code generation → recipient notification (T-3100)
- [ ] Redemption: during visit payment (T-4549) — code validation, balance, validity → deduction → balance update
- [ ] Partial redeem: support in `ProcessPayment` (gift card as one of the methods)
- [ ] Expiry job: daily — EXPIRED status, breakage event, notification
- [ ] Transfer: `TransferGiftCard` use case (new code, old revoked, audit log)
- [ ] Admin UI: cards list, filters, bulk export, breakage report
- [ ] Client cabinet: my gift cards, balance, redemption history, "Gift" button

## Risks

- [ ] **Code guessing**: short codes — rate limiting on validation, long UUIDs for digital
- [ ] **Accounting**: breakage = revenue — synchronization with accounting (T-4216)
