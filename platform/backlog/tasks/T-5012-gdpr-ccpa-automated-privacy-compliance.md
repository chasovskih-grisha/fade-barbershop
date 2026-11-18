---
id: T-5012
title: "Automated GDPR/CCPA Privacy Compliance & Data Subject Request Portal"
status: todo
sp: 8
priority: high
category: security, compliance, legal, backend
phase: 50
milestone: M10
source: "docs/security-hardening.md, crm README, architecture.md"
adr: [0017, 0024]
screens: ["admin-screens.md", "web-cabinet-screens.md"]
---

# T-5012: Automated GDPR/CCPA Privacy Compliance & Data Subject Request Portal

## Overview

With international clients and privacy regulations (GDPR, CCPA, and Ukrainian personal data protection laws), clients have legal rights to request complete data exports (Article 15) and complete account deletion/anonymization (Right to be Forgotten). Manual fulfillment of data requests is error-prone and non-compliant.

This task implements an automated privacy compliance portal and secure data export/anonymization pipeline that compiles all user appointments, payment history, CRM notes, and uploaded photos into an encrypted downloadable package or executes irreversible cryptographic anonymization.

## Scope

- **Self-Service Privacy Dashboard**: Client cabinet portal (`T-4543`) enabling users to request data export or account deletion with OTP confirmation.
- **Automated Data Aggregator**: Backend job aggregating records across PostgreSQL, Redis cache, object storage (photos), and analytics event logs.
- **Cryptographic Anonymization Pipeline**: Safely scrubbing PII (name, phone, email, AI consultation photos) while preserving anonymized financial ledger entries for tax compliance.
- **Retention & Disposal Cron**: Automated cleanup jobs enforcing data retention limits (`T-4490`).

## Acceptance Criteria

1. Data export archives (JSON/PDF) generated and emailed securely within 1 hour of request.
2. Account deletion/anonymization executes idempotently across all database tables without violating foreign key constraints or accounting integrity.
3. Full audit logging of all Privacy requests and compliance fulfillment actions for regulatory auditability.
