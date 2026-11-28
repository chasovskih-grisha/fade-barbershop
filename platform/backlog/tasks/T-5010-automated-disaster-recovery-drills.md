---
id: T-5010
title: "Automated Chaos Engineering & Disaster Recovery Failover Drills"
status: review
sp: 8
priority: high
category: devops, security, reliability, sres
phase: 50
milestone: M10
source: "docs/observability.md, docs/slo.md, security-hardening.md"
adr: [0003, 0015]
screens: ["admin-screens.md"]
---

# T-5010: Automated Chaos Engineering & Disaster Recovery Failover Drills

## Overview

High availability and strict SLOs (`T-4204`, `slo.md`) require continuous validation of infrastructure resilience. Relying on manual disaster recovery tests leads to undocumented failure modes during real outages.

This task implements automated chaos engineering experiments (using LitmusChaos / custom chaos scripts) in staging and off-peak production environments, simulating database master failover, Redis cluster partition, payment gateway timeouts, and API container crashes to verify automated self-healing and zero-data-loss failover.

## Scope

- **Chaos Experiment Suite**: Automated weekly tests injecting network latency, pod kills, DB connection pool exhaustion, and regional DNS switchover.
- **RTO & RPO Automated Measurement**: Scripts measuring Recovery Time Objective (RTO) and Recovery Point Objective (RPO) during simulated disasters against defined SLO targets.
- **Grafana & Alertmanager Validation**: Ensuring alerts fire correctly andPagerDuty/Telegram incident channels receive actionable diagnostics without alert fatigue.
- **Runbook & Auto-Remediation Playbooks**: Documenting automated remediation scripts and self-healing Kubernetes controllers.

## Acceptance Criteria

1. Automated chaos drills run successfully in staging environment every Sunday at 03:00 UTC.
2. System achieves RTO < 60 seconds and RPO = 0 for database failovers and stateless service restarts.
3. Comprehensive resilience dashboard live in Grafana with historical pass/fail drill metrics.

## Gate evidence (T-6008)

`agent-gate qa` cannot finish this row: chaos drills are executed against staging Kubernetes, which
does not exist in this repository, so no executable `Checks:` command can be named. The review commit
(`review: T-5010`) touched only `infra/chaos/README.md`, so the gate also finds no test file to prove
the plan against. Blocking dependency: a staging cluster plus LitmusChaos and Grafana — an account and
pipeline, not code in `platform/`.
