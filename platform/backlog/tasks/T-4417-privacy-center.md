# T-4417 · Client Privacy Center (Self-Service GDPR)

- **Stage**: M1 (phase 3) · **Tags**: backend, frontend, legal · **Complexity**: middle · **Depends on**: T-032, T-070, T-3601
- **StoryPoints**: 5

## What

Cabinet section (web + mobile): personal data export (machine-readable format), account deletion request with cooldown period (T-3601 requirement), consent management (newsletters/push/persisting), request processing log for compliance.

## Why

T-3601 provides legal framework; without self-service center, support requests overwhelm staff, and audit "where is consent?" cannot be closed manually. This is the first client-visible GDPR element.

## Sources

- web-cabinet-screens.md; T-3601 (GDPR axis); security-hardening.md

## Done

- [ ] Export and account deletion work (web + mobile, with cooldown period)
- [ ] Consent management affects marketing pools (consumed by T-180, T-4431)
- [ ] Audit log matching support requirements

## Risks

- [ ] **Deletion vs loyalty**: points on deleted account set to zero/expired (policy in open-decision) — text in UI and test
