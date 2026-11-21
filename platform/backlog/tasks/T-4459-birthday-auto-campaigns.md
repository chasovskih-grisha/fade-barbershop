# T-4459 · Birthdays: Auto-Campaigns

- **Stage**: M4 (phase 8) · **Tags**: backend, campaigns, finance · **Complexity**: junior · **Depends on**: T-180, T-032, T-080
- **StoryPoints**: 3

## What

Customer birthday (date in CRM): auto-offer N days prior (discount configuration, prioritization channel) — messages via channels (SMS/email/push) with a call to action, logic "do not send twice a year", disabled for clients without marketing consent. Date verification question (can be manually edited in admin, audit).

## Why

Classic retention channel; customer expects greeting + discount; automation is almost cost-free after T-180/CAD.

## Sources

- campaigns.md; T-180 (campaign rules), T-032/080 (surfaces/channels); FDB loyalty

## Done

- [ ] Birthday auto-campaign with configured discount and channels
- [ ] Limit "1 per year/client"; marketing consent is respected
- [ ] Test on date verification and edge cases (February 29)

## Risks

- [ ] **"Dead" date**: unconfirmed date (client) — show "unconfirmed" in log, no auto-offer without consent