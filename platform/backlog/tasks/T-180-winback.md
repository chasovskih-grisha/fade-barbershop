# T-180 · Win-back: Segments, Campaigns, ROI

- **Stage**: M4 (phase 18) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-061, T-062, T-152, T-080
- **StoryPoints**: 5

## What

WNB-001…007: segments (hasn't been for ≥ 60 days, second none, former VIP, loyalty ≥ 4/7) with live preview; one click → regular personal `PromoCode` (1 use per segment client, N days) + push; 30-day anti-spam (from `CampaignSent`); ROI (used/sent + revenue, connection with ANL-006 — `CampaignRoi` metric).

## Sources

- `WNB-001…007`, `WNB-ADM-01…04`; `docs/campaigns.md`; crm/analytics README

## Done

- [ ] Campaign from segment to push works in one click
- [ ] ROI visible in dashboard

## Risks

- [ ] **30-day anti-spam** (WNB-006): sending fact in crm
- [ ] **ROI**: CampaignRoi is calculated, otherwise campaigns are blind
