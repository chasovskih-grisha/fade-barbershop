# T-4614c · Connect auto-deploy stage → prod

- **Stage**: horizontal · **Tags**: devops, infra, high-risk · **Complexity**: middle · **Dependencies**: T-4614, T-4614a, T-303, T-4531, ADR 0052
- **StoryPoints**: 5

## Blocker

Pipeline registered and deploys nowhere.

- `.github/workflows/deploy.yml` listens to successful CI on push to `stage` and `main`, then calls Coolify.
- ADR 0051 (revision 2026-11-11) dropped Coolify: prod is Docker Compose over SSH on the GMHost VPS, and `stage` does not deploy a remote host. This workflow still calls Coolify.
- If `COOLIFY_WEBHOOKS` empty, step writes notice and exits **0**. Green CI looks like successful deploy.
- Branch protection on `stage` and `main` not enabled. Direct push to `main` bypasses CI (backlog journal 2026-10-01).

VPS, DNS, SSL and environment secrets this task doesn't create. It closes when `deploy.yml` on `main` SSHs to the VPS and runs Compose, and a push to `stage` does not pretend to deploy.

## What

Agents commit directly to `stage` (no feature branches and feature PR, ADR 0052). Push to `stage` runs CI and does not deploy a remote host (ADR 0051). Only pull request — Release PR `stage` → `main` (merge commit, no squash); it deploys the same commit to the GMHost VPS by SSH Compose. Direct push to `main` forbidden.

## Done

- [x] `deploy.yml` on `main` SSHs to the GMHost VPS and runs Compose. The Coolify webhook is gone. An empty secret no longer exits 0 and looks like a deploy
- [x] Push to `stage` runs CI and does not deploy a remote host
- [x] Merge `stage` → `main` deploys prod. No other pull requests: neither in `stage` nor in `main` except Release PR
- [ ] Required check "Typecheck (tsc --noEmit) and docs" on Release PR in `main`; push to `stage` remains direct and also runs CI

## Risks

- [ ] **Error in `main` immediately on prod** (ADR 0052): protection — don't merge Release PR until stage verified
