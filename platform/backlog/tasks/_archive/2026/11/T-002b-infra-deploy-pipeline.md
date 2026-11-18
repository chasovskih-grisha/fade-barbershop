# T-002b · Deploy Pipeline (5/11)

- **Stage**: M0 (phase 0) · **Tags**: infra, devops · **Complexity**: middle · **Depends on**: T-002a
- **StoryPoints**: 5

## What
Configure deploy-пайплайн staging/prod: Docker build, push, deploy. Staging for testing, prod for real traffic. Secrets and backups outside repo.

## Why
Final steps for deploy (T-303). Staging — for testing before prod.

## Sources
- `docs/roadmap.md` (deploy)
- ADR 0017/0018 (domains/SSL)

## Done
- [x] Deploy Pipeline configured
- [x] Staging і прод separate

## dependencies