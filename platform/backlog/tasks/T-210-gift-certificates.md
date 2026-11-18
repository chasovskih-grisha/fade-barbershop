# T-210 · Certificates: Sale, Redemption, Receipts, Breakage

- **Stage**: M4 (phase 20) · **Tags**: backend, high-risk · **Complexity**: senior · **Dependencies**: T-091, T-092, T-093
- **StoryPoints**: 8

## What

ADR 0013: certificate — **payment form, not price**; online sale (`/gift`, card) and on-site (cash/POS); code immediately + SMS/push; on-site redemption (full/partial, remainder balance tracking); expiration and breakage revenue recognition.

## Why

Gift certificates are a key revenue driver and liability accounting item.

## Sources

- ADR 0013; T-091…093

## Done

- [ ] Certificate generation and purchase flow (online + POS)
- [ ] Redemption logic supporting partial use and remainder balance
- [ ] Breakage accounting rules and expiration tracking
- [ ] Fiscal receipt integration for certificate purchase and redemption

## Risks

- [ ] **Double spending / concurrency**: certificate code used simultaneously at two locations — strict database locking and transaction guarantees.
