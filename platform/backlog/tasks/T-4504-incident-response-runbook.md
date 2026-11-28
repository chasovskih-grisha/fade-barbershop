# T-4504 · Incident Response Plan + Tabletop

- **Stage**: M0 (phase 0) · **Tags**: devops, security, process · **Complexity**: junior · **Depends on**: T-300, T-4204
- **StoryPoints**: 5

## What

Written incident plan: roles (oncall/communicator/owner), channels (status.fade T-4487, alerts T-4204), severity matrix, recovery procedures (backup T-300, masks, rollback), compliance notifications; periodic tabletop (simulation review). Contacts/schedule in repo and accessible to all.

## Why

First incident without a plan = chaos and wasted time; a practiced scenario (restore/review) is cheaper than a real outage.

## Sources

- observability.md; security-hardening.md; T-300 (backup), T-4204 (alerts), T-4487 (status)

## Done

- [ ] Incident plan (roles/severity/steps) in repo; accessible to everyone
- [ ] Tabletop run (at least once) with report
- [ ] Integration with status page/alerts kept up to date

## Risks

- [ ] **Outdated plan**: update steps after every stack change (reminder procedure in CI)

## Re-verified at 91202f68

`node scripts/agent-gate.mjs claim --seat devops --task T-4504` would refuse: the row depends on T-300
(`horizontal.md:15` → `review`) and T-4204 (`m5.md:240` → `todo`). T-300's review commit `8f86fb7d`
adds one file, `infra/OPTIMIZATION_REPORT_devops.md`, so `qaTask` cannot find a plan test in it. The
tabletop itself is a human session with a written report, not a code path. Unblocks when T-300 and
T-4204 close and the tabletop is actually run.
