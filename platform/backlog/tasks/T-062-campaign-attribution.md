# T-062 · InviteCode/ReferredBy and CampaignSent Fact

- **Stage**: M2 (phase 5) · **Tags**: backend · **Complexity**: junior · **Depends on**: T-060
- **StoryPoints**: 3

## What

`InviteCode` on profile (referral link source), `ReferredBy` on friend's first registration (last touch, 30 days, immutable — ADR 0014); `CampaignSent` event in `crm` (communication fact — anti-spam WNB-006 and ROI WNB-007).

## Why

Attribution and communication tracking for referral program and marketing campaigns.

## Sources

- **ADR 0014**; WNB-007; crm README (terms, event)

## Done

- [ ] Attribution recorded immutably
- [ ] `CampaignSent` written and read for future campaigns

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
