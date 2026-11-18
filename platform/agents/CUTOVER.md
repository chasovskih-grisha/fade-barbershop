# Antigravity cutover

The live schedules are the nine automations in `agents/roles/*/automations/`. Model is Flash Lite (`flash_lite`). Prompts are rendered from git. A hyphenated `flash-lite` flag is not that tier: Antigravity treats an unknown id as Flash.

```bash
pnpm agents:validate
pnpm agents:render --install
```

`--install` writes `~/.gemini/config/sidecars/<id>/sidecar.json`, registers each sidecar in `~/.gemini/config/config.json`, and moves previous `fade-*` directories (and `ade-automation-conductor`, if present) to `~/.gemini/config/sidecars-retired/2026-11-16/`. It also adds a detached worktree at `~/.gemini/worktrees/fade-barber/platform/<automation>` from `origin/stage` and sets that sidecar's project folder to the worktree. The scheduled command is `scripts/agent-preflight.mjs` in that worktree. `--install` copies `hooks/pre-push` into the repo git hooks directory and each worktree, so a push to `stage` cannot mark a task `review` or `done` without the gate's evidence. A copy of the previous config is `~/.gemini/config/config.sidecars-backup-2026-11-16.json`. The `swarm/swarm_board` entry stays.

Do not edit a prompt inside Antigravity. Change the markdown, then render again.

Retired ids:

- ade-automation-conductor
- fade-accessibility-compliance
- fade-admin-task-implementaton
- fade-analytics-conversion-intelligence
- fade-api-integration
- fade-app-implementer
- fade-automation-conductor
- fade-barber-productivity-capacity
- fade-booking-engine-optimization
- fade-comprehensive-issue-resolution
- fade-content-management
- fade-customer-acquisition-retention
- fade-customer-experience
- fade-daily-brand-excellence-creative-direction
- fade-database-schema-optimization
- fade-design-system-guardian
- fade-development
- fade-development-backlog-expansion
- fade-devops-infrastructure
- fade-ecosystem-health-orchestrator
- fade-email-template-design-enhancement
- fade-i18n-localization
- fade-implement-mobile-app-backlog-task
- fade-improve-expand-database-fixtures
- fade-logging-monitoring
- fade-loyalty-membership
- fade-marketing-experience-visual-effects-brand-impact
- fade-no-show-cancellation-protection
- fade-notification-messaging
- fade-payment-billing-gateway
- fade-performance-security-audit
- fade-qa-reliability-testing
- fade-refactor-applications-to-be-fully-data-driven
- fade-reputation-competitive-intelligence
- fade-revenue-pricing-optimization
- fade-translate-backlog-tasks
- fade-website-design-ux
- fade-website-visual
