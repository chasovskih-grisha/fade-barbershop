# T-4459 · Birthdays: Auto-Campaigns

- **Stage**: M4 (phase 8) · **Tags**: backend, campaigns, finance · **Complexity**: junior · **Depends on**: T-180, T-032, T-080
- **StoryPoints**: 3
- **Status**: review

## What

Customer birthday (date in CRM): auto-offer N days prior (discount configuration, prioritization channel) — messages via channels (SMS/email/push) with a call to action, logic "do not send twice a year", disabled for clients without marketing consent. Date verification question (can be manually edited in admin, audit).

## Why

Classic retention channel; customer expects greeting + discount; automation is almost cost-free after T-180/CAD.

## Sources

- campaigns.md; T-180 (campaign rules), T-032/080 (surfaces/channels); FDB loyalty

## Done

- [x] Birthday auto-campaign with configured discount and channels: `campaigns/domain/birthday-campaign.ts` (`DEFAULT_BIRTHDAY_CAMPAIGN_CONFIG`: `leadDays` 7, `discountPercent` 15, `validDays` 14, channels `sms|email|push`, `timeZone` Europe/Kyiv) and `renderBirthdayOffer` (discount + expiry date, one text for every channel)
- [x] Limit "1 per year/client"; marketing consent is respected: `birthdayFingerprint(clientId, year)` in the delivery log, plus suppression reasons `no_marketing_consent`, `date_unconfirmed`, `no_birthday`, `outside_window`, `already_offered`, `campaign_disabled`
- [x] Test on date verification and edge cases (February 29): 15 tests; 29.02 clamps to 28.02 in non-leap years (and stays 29.02 in leap years), local-timezone date parts, window/rollover, dedupe across years, invalid dates and `leadDays`/discount/channel validation
- [x] Admin surface: `GET admin/campaigns/birthday/preview`, `POST .../run`, `GET .../history`, `POST .../clients/:clientId/date` (verify/edit date, `by` required, audit entry with `from`/`to`)
- [x] Manual date verification with audit: `verifyBirthdayDate` + `BirthdayCampaignService.verifyDate` records who/when/what changed and marks the date confirmed

## Risks

- [x] **"Dead" date**: unconfirmed date (client) — show "unconfirmed" in log, no auto-offer without consent (`date_unconfirmed` suppression + audit journal)
- [x] Deterministic clock (`BIRTHDAY_CAMPAIGN_CLOCK`) and explicit `now`/`at` on every route — no wall-clock reads in tests

## Deferred

- Real delivery adapters for SMS/email/push (T-032/T-080): `RecordingBirthdayCampaignGateway` records sends so the flow is testable; swapping the provider is the only change needed.
- Prisma persistence for deliveries/audit: no birthday-campaign tables in `prisma/schema.prisma` yet, so `InMemoryBirthdayCampaignLog` backs the ports (same precedent as T-4459 siblings).
- Client source from CRM: `InMemoryBirthdayCampaignClients` stands in for the client read model (birthday, consent, confirmation flag).
- Scheduling (cron/daily sweep) and the admin campaign screen with charts — separate cards (T-180 scheduler, admin UI).
