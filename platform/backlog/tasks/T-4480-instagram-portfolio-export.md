# T-4480 · Instagram Portfolio Export

- **Stage**: M5 (phase 10) · **Tags**: backend, portfolio, integrations · **Complexity**: middle · **Depends on**: T-190, T-191, T-4477
- **StoryPoints**: 8

## What

Published portfolio works (T-190/191/4477) can be push candidates to Instagram: image generation (card with photo, service name), posting queue, manual admin approval before publishing (preview), Instagram platform rules and rate limits. Integration via Graph API with secure token persistence.

## Why

Instagram is a primary channel for barbershops; automated work reporting turns accumulated portfolios into a storefront without manual labor.

## Sources

- portfolio README; T-190/191/4477; Instagram Graph API (platform guidelines)

## Done

- [ ] Post card / queue with manual approval workflow; publishing execution
- [ ] Rate limits (max N/day), error handling and logging
- [ ] Secure token storage (no secrets in code)

## Risks

- [ ] **Token expiration**: automated renewal workflow without breaking queue processing (Graph API)
