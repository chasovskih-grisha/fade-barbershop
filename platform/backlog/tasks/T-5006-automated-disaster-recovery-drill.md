# T-5006 · Automated Disaster Recovery Drill & Point-in-Time Recovery Pipeline

- **Stage**: M3 (phase 0) · **Tags**: devops, infra, reliability, security · **Complexity**: senior · **Depends on**: T-4448, T-4204b, T-3600
- **StoryPoints**: 8

## What

- Implement automated daily point-in-time recovery (PITR) verification pipelines testing PostgreSQL WAL archiving and backup restoration in an isolated staging namespace.
- Build automated data integrity checks comparing restored database state against expected schema invariants and cryptographic checksums.
- Create automated runbooks and pager alerts for backup verification failures or replication lag spikes.
- Provide a Grafana disaster recovery status dashboard tracking RPO (Recovery Point Objective) and RTO (Recovery Time Objective) metrics.

## Why

Unplanned outages or data corruption incidents require bulletproof recovery guarantees. Automated continuous testing of backups ensures RPO < 5 minutes and RTO < 30 minutes in production.

## Sources

- `platform/infra/README.md`, `platform/docs/slo.md`, T-4448, T-4204b

## Status

**Todo**

## Done

- [ ] Automated daily backup restoration cron job configured in CI/CD pipeline
- [ ] Database checksum verification and invariant assertion test suite implemented
- [ ] PagerDuty / Telegram alert integration for backup verification failures deployed
- [ ] DR readiness metrics exposed on Grafana reliability dashboard
