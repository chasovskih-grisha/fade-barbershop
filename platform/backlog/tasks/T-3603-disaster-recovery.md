# T-3603 · Disaster Recovery (DR)

- **Stage**: M6 (phase 40) · **Tags**: devops, infra, security · **Complexity**: senior · **Depends on**: T-002, T-303
- **StoryPoints**: 20

## What
Disaster Recovery: RPO < 1 hour (Postgres PITR), RTO < 4 hours (multi-region restoration), quarterly restore drills, restoration runbook, chaos engineering to verify resilience.

## Why
Bounce-back after a disaster within agreed timeframes. Loss of barbershop data (appointments, payments) — direct losses and network reputational risks.

## Sources
- T-002 (infrastructure: Postgres/Redis/MinIO), T-300 (monitoring and backups), T-303 (staging/prod)
- `docs/engineering-principles.md` (quality gates)
## dependencies

> Slices are created at task start; individual subtask files are created then if needed.
## Checklist
- [ ] Postgres PITR (WAL archive, RPO < 1 hour)
- [ ] Multi-region restoration, RTO < 4 hours
- [ ] Restoration runbook (step-by-step, with roles)
- [ ] Quarterly restore drills (test on copy)
- [ ] Chaos engineering: Postgres/Redis/MinIO failure scenarios
