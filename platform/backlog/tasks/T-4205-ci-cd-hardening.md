# T-4205 · Захист CI/CD-пайплайна

- **Stage**: M5 (phase 30) · **Tags**: devops, security, infra · **Complexity**: senior · **Depends on**: T-001, T-002, T-303
- **StoryPoints**: 25

## What
Пайплайн: **Build** — multi-arch (amd64/arm64), SBOM (CycloneDX), кеш залежностей; **Tests** — unit (Jest/Vitest/Pytest), інтеграційні (Testcontainers), e2e (Playwright/Cypress), контрактні (Pact), performance (k6 smoke); **Безпека** — SAST (CodeQL/SonarQube), DAST (OWASP ZAP), dependencies (Trivy/Grype/Dependabot), контейнери (Trivy/Hadolint), secrets (TruffleHog/Gitleaks), ліцензії (FOSSA); **Deploy** — canary (Argo Rollouts/Flagger, 5%→25%→100%), blue-green, прев'ю-середовища на feature-гілки (PR envs), автоматичний rollback при порушенні SLO, ручне підтвердження для prod; **Supply chain** — SLSA Level 3, підписання sigstore/cosign, provenance, attestations.

## Why
Безпечний, швидкий, надійний delivery. Security gates не пускають вразливості. Canary = zero-downtime. SBOM = compliance.

## Sources
- docs/ci-cd.md — фантом 2026-09-22: файл ніколи не існував; джерело приймається на старті задачі
- SLSA / sigstore / Argo CD / Argo Rollouts
- GitHub Actions / GitLab CI

## dependencies
> Слайси виділяються при старті задачі; окремі файли підзадач створюються тоді ж за потреби.
