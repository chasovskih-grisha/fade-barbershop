# T-4805 · GDPR Right-to-Be-Forgotten & PII Anonymization Pipeline

- **Stage**: M4 · **Tags**: backend, security, compliance · **Complexity**: senior · **Depends on**: T-010, T-050
- **StoryPoints**: 8

## What

Implement a comprehensive GDPR-compliant data erasure and PII anonymization pipeline allowing clients to request complete account deletion and data purging ("Right to be Forgotten").

- Automated erasure workflow: anonymizing client profile name, phone number, and email in `ClientProfile` and `Identity` tables while preserving anonymized aggregate appointment stats for financial ledger integrity.
- Purging user-uploaded AI haircut photos and consent records from MinIO storage buckets (ADR 0018).
- Admin audit log entry recording deletion requests and execution status without storing plaintext PII.

## Why

Regulatory compliance with GDPR and local consumer protection laws requires secure, verifiable mechanisms to permanently erase customer personal data upon request.

## Sources

- `platform/docs/security-hardening.md`
- ADR 0018 (MinIO storage), ADR 0005 (Identity)

## Done

- [ ] API endpoint for client data deletion request with OTP verification
- [ ] Background worker executing cascading PII anonymization across `Identity`, `ClientProfile`, and auth tokens
- [ ] Automated deletion of associated MinIO object files (AI photos, uploads)
- [ ] Compliance report generation for administrators verifying successful data purge

## Risks

- [ ] **Referential integrity**: Ensuring financial records and tax receipts remain intact while stripping customer PII.

## Implementation plan

Paths:
- apps/api/src/identity/privacy/domain/erasure-policy.ts
- apps/api/src/identity/privacy/domain/erasure-policy.spec.ts
- apps/api/src/identity/privacy/application/run-erasure.spec.ts
- apps/api/src/identity/privacy/application/request-erasure.spec.ts

Checks:
- `pnpm --filter @fade/api exec jest apps/api/src/identity/privacy/domain/erasure-policy.spec.ts apps/api/src/identity/privacy/application/request-erasure.spec.ts apps/api/src/identity/privacy/application/run-erasure.spec.ts`

## Implementation notes

- apps/api/prisma/migrations/20261215000000_add_account_erasure/migration.sql
- apps/api/prisma/schema.prisma
- apps/api/src/identity/privacy/application/erasure.fakes.ts
- apps/api/src/identity/privacy/application/erasure.ports.ts
- apps/api/src/identity/privacy/application/request-erasure.spec.ts
- apps/api/src/identity/privacy/application/request-erasure.ts
- apps/api/src/identity/privacy/application/run-erasure.spec.ts
- apps/api/src/identity/privacy/application/run-erasure.ts
- apps/api/src/identity/privacy/domain/erasure-policy.spec.ts
- apps/api/src/identity/privacy/domain/erasure-policy.ts
- apps/api/src/identity/privacy/infrastructure/erasure.adapters.ts
- apps/api/src/identity/privacy/infrastructure/erasure.anonymize.ts
- apps/api/src/identity/privacy/infrastructure/erasure.controller.ts
- apps/api/src/identity/privacy/infrastructure/erasure.store.types.ts
- apps/api/src/identity/privacy/infrastructure/erasure.worker.ts
- apps/api/src/identity/privacy/infrastructure/prisma-erasure.store.ts
- apps/api/src/identity/privacy/privacy.module.ts

## QA

- `pnpm --filter @fade/api exec jest apps/api/src/identity/privacy/domain/erasure-policy.spec.ts apps/api/src/identity/privacy/application/request-erasure.spec.ts apps/api/src/identity/privacy/application/run-erasure.spec.ts` exit 0
