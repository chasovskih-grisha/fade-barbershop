# T-RFR-ADM-03 · Suspicious Referrals Review (Anti-Abuse)

- **Stage**: M6 (phase 40) · **Tags**: admin, security, crm, backend · **Complexity**: middle · **Depends on**: T-220, T-4554, T-4583
- **StoryPoints**: 5

## What

Suspicious referrals review (RFR-ADM-03 from `docs/admin-screens.md` §13.3):
- Suspicious patterns: shared phones of referrer/referral, registration series from the same device (if available), referral no-show series.
- Manual list review with filters by location, period, suspicion type.
- Referral revocation with mandatory log (RFR-005) and reason.
- Loyalty integration to detect repeat abuse attempts.

## Why

Protection of the referral program against fraud and fake referrals.

## Sources

- `docs/admin-screens.md` §13.3 (RFR-ADM-03)
- `docs/referrals.md` (ADR 0014)
- T-220 (referral attribution)
- T-4554 (referral program extension)
- T-4583 (loyalty-referral analytics)
