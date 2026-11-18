# T-4807 · Container Vulnerability Scanning & Secret Detection Gate in CI

- **Stage**: M0 · **Tags**: devops, security, ci · **Complexity**: middle · **Depends on**: T-002
- **StoryPoints**: 5

## What

Integrate automated container image vulnerability scanning (Trivy) and static secret detection (Gitleaks) into the GitHub Actions CI/CD pipeline (`platform/infra/ci` or workflow files).

- Scan Dockerfiles (`infra/*.Dockerfile`) and built container images for critical/high CVE vulnerabilities before deployment.
- Block PRs and commits containing accidental hardcoded secrets, API keys, or private certificates.
- Automated Slack/Telegram notification alerts on security scan failures.

## Why

Ensure zero vulnerable dependencies or exposed credentials reach staging or production environments.

## Sources

- `platform/docs/security-hardening.md`
- `platform/docs/engineering-principles.md`

## Done

- [ ] Trivy image scanner integrated into CI pipeline for all Dockerfiles
- [ ] Gitleaks pre-commit hook and CI check configured for secret detection
- [ ] Failure threshold configured to block builds on high/critical CVEs
- [ ] Security scan report artifact generated on every CI run

## Implementation plan

Paths:
- infra/security-scan.sh

Checks:
- bash infra/security-scan.sh

## Risks

- [ ] **False positives**: Managing CVE exemptions and vulnerability patch turnaround times.

## Implementation notes

- infra/security-scan-report.json
- infra/security-scan.sh
