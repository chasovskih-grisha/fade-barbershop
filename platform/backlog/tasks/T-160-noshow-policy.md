# T-160 · No-show: auto-fixation, deposit retention, threshold

- **Stage**: M4 (phase 16) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-042, T-094, T-080
- **StoryPoints**: 5

## What

NSH-001…007: auto-fixation 15 min after slot (event `AppointmentNoShowed` — already exists), manual mark by barber (NSH-BAR-01 — already in T-083); deposit retained (payment transition does not occur); push to client neutral; rate by barbers/channels (NSH-005, ANL expansion); rule "2 no-shows in 90 days → full prepayment" (admin settings, manual removal NSH-ADM-01…03; removal → refund PAY-005b).

## Sources

- `NSH-001…007`, `NSH-BAR/ADM-*`; `admin-screens.md` §8 (no-show settings); scheduling README (lifecycle)

## Done

- [ ] Auto-fixation and threshold work; revocation with refund — with log
- [ ] No-show rate in dashboard broken down by channel

## Risks

- [ ] **Policy is snapshotted at record time** (PAY-ADM-09): policy change is not retroactive
