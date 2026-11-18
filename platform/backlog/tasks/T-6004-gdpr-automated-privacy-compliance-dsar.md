# T-6004 · Automated GDPR & CCPA Data Anonymization, Retention, and Subject Access Request Portal

- **Stage**: M3 (phase 0) · **Tags**: security, privacy, backend, compliance · **Complexity**: senior · **Depends on**: T-002, T-4805
- **StoryPoints**: 8

## What

Build an automated privacy compliance subsystem that handles Data Subject Access Requests (DSAR), right-to-be-forgotten cascading anonymization across PostgreSQL tables, object storage, and audit logs, and automatic data retention expiry enforcement. Provide a self-service client portal option to export or delete account data.

## Why

Legal compliance with European privacy standards and consumer protection regulations for digital platforms handling biometric and payment data.

## Acceptance Criteria

1. Automated background worker runs daily to purge expired records according to data retention policies.
2. DSAR export generates a complete encrypted JSON archive of client personal data within 1 hour of request.
3. Anonymization routine correctly scrubs PII from appointments, CRM profiles, and chat logs while preserving transactional accounting integrity.

## Implementation plan

Paths:
- apps/api/src/retention

Checks:
- pnpm --filter api test apps/api/src/retention/gdpr-compliance.spec.ts

## Implementation notes

- apps/api/src/retention/domain/gdpr-compliance.service.ts
- apps/api/src/retention/gdpr-compliance.spec.ts

## QA

- `pnpm --filter api test apps/api/src/retention/gdpr-compliance.spec.ts` exit 0
