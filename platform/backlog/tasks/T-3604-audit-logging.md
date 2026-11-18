# T-3604 · Audit Logging

- **Stage**: M5 (phase 30) · **Tags**: backend, security, devops · **Complexity**: middle · **Depends on**: T-2400, T-300
- **StoryPoints**: 12

## What
Audit log: admin panel actions (CRUD, role changes, exports), data access (PII viewing), authorization events (login, MFA, password change), API calls (sensitive endpoints), immutable storage (append-only), 7-year retention, SIEM integration (Elastic/Splunk), anomaly alerts.

## Why
Forensics. Compliance. Internal threat detection. Incident investigation.

## Sources
- docs/audit-logging.md — phantom 2026-09-22: file never existed; source accepted at task start
- ISO 27001 Annex A.12

## dependencies
> Slices are created at task start; individual subtask files are created then if needed.
