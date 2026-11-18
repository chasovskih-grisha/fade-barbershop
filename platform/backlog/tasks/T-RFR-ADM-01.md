# T-RFR-ADM-01 · Referral Program Settings

- **Stage**: M6 (phase 40) · **Tags**: admin, crm, marketing · **Complexity**: middle · **Depends on**: T-220, T-4554
- **StoryPoints**: 5

## What

Referral program settings (RFR-ADM-01 from `docs/admin-screens.md` §13.1):
- Referral discount (%), referrer reward (%/amount), reward validity period (90 days), attribution window (30 days), "program enabled" toggle.
- Validation: discount 0–100%, reward 0–100% or fixed amount, terms 1–90 days, attribution 1–30 days.
- Settings change updates policy for new referrals without affecting existing ones.

## Why

Unified referral program settings for the entire network with enable/disable capability.

## Sources

- `docs/admin-screens.md` §13.1 (RFR-ADM-01)
- `docs/referrals.md` (ADR 0014)
- T-220 (referral attribution)
- T-4554 (referral program extension)
