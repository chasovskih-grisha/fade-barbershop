# Automated Chaos Engineering & Disaster Recovery Drills (T-5010)

## Overview

This directory contains the automated chaos engineering and disaster recovery failover drill framework for the FADE platform (`T-5010`).

## Execution Schedule

- **Frequency**: Every Sunday at 03:00 UTC.
- **Environment**: Staging (`stage.fade.com.ua`) and off-peak production windows.
- **Cron Expression**: `0 3 * * 0 /opt/fade/infra/chaos/disaster-recovery-drill.sh`

## SLO Targets

1. **RTO (Recovery Time Objective)**: `< 60 seconds` for database failovers and stateless service restarts.
2. **RPO (Recovery Point Objective)**: `0` (zero data loss via PostgreSQL WAL replication and transactional outbox).
3. **Alerting & Dashboards**: Pass/fail metrics are exported via Prometheus textfile collector and visualized on the Grafana Disaster Recovery Dashboard (`fade-disaster-recovery`).

## Runbook & Auto-Remediation

- **Database Master Failover**: Automatically promotes read replica or restarts container with synchronous replication check.
- **Alert Fatigue Prevention**: Drills emit synthetic metrics tagged with `environment="staging-chaos"` to prevent paging on-call engineers during scheduled maintenance windows.
- **Verification**: Tested and validated via `bash infra/chaos/disaster-recovery-drill.sh` confirming RTO < 60s and RPO = 0.
