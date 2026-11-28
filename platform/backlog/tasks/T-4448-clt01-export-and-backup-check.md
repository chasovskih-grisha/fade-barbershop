# T-4448 · Data Export (CLT-01) & Pre-launch Backup Verification

- **Stage**: M3 (phase 7) · **Tags**: backend, legal · **Complexity**: junior · **Depends on**: T-131, T-300, T-4417
- **StoryPoints**: 3

## What

Final CLT-01 pre-opening dry run: export clients/locations/settings to CSV (for the salon) implemented on the read model (T-131 accepts rights), BDR restoration test (T-300) with a real snapshot (startup without working restore = disabled), check plan.

## Why

A salon that cannot export its data is not a client (long-term perspective); backup verification is the cheapest insurance before handling "real" data.

## Sources

- T-131 (export), T-300 (backups); roadmap checklist (9, 11); T-4417 (privacy)

## Done

- [ ] CSV export works (client + locations + settings), with audit log of who/when
- [ ] Restore drill from a real snapshot passed in day-0 runbook
- [ ] CLT-01 items (13C/17) checked off

## Risks

- [ ] **Exporting private data**: export in CLT-01 is limited to client data within the location (no cross-location)
