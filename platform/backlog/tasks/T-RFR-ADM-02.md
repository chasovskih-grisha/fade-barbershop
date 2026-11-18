# T-RFR-ADM-02 · Referral List

- **Stage**: M6 (phase 40) · **Tags**: admin, crm, analytics · **Complexity**: middle · **Depends on**: T-220, T-4554
- **StoryPoints**: 5

## What

Referral list (RFR-ADM-02 from `docs/admin-screens.md` §13.2):
- Table: Friend | Referrer | Registration Date | Status (booked / completed visit) | Reward (status, accrual date) | Actions.
- Filters: by reward status (all / pending / accrued / revoked), by period, by location.
- Referral revocation: confirmation with reason, mandatory log (RFR-005).

## Why

Allows admin to track referral effectiveness and revoke suspicious or outdated entries.

## Sources

- `docs/admin-screens.md` §13.2 (RFR-ADM-02)
- `docs/referrals.md` (ADR 0014)
- T-220 (referral attribution)
- T-4554 (referral program extension)
