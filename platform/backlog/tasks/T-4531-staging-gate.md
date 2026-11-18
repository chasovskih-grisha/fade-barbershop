# T-4531 · Staging: stage.fade.com.ua environment as mandatory gate before prod

- **Stage**: horizontal (before prod-deploy T-303; v1 launch gate) · **Tags**: infra, devops, security · **Complexity**: middle · **Dependencies**: T-002, T-300, ADR 0051 (hosting — decided), ADR 0052 (autodeploy branches — decided), T-303
- **StoryPoints**: 5

## What

Deferred by ADR 0051 (revision 2026-11-11) until the prod VPS is GMHost's 8 GB tariff. The 4 GB box holds prod only. Until then the gate before a Release PR is the local Docker stack (ADR 0018), not `stage.fade.com.ua`.

Separate staging environment on **`stage.fade.com.ua`**, which **necessarily precedes prod-deploy** once that tariff is rented:

- **Staging domain map** (prod mirror per ADR 0017, revision 2026-10-01 — host `book` removed): `stage.fade.com.ua` · `admin.stage.fade.com.ua` · `api.stage.fade.com.ua` · `shop.stage.fade.com.ua` · `media.stage.fade.com.ua`. DNS records, SSL (wildcard `*.stage.fade.com.ua` + apex), network mail. Cookie code that currently always sets `Domain=.fade.com.ua` — **T-4614d**; here remains check on live stage.
- **Deployment** per ADR 0052: commit goes directly to `stage` (no feature branches and feature PR), push deploys staging, Release PR `stage` → `main` deploys prod. Separate secrets and DB (not prod ones). DB migrations first on staging, on api start (T-4209).
- **CORS-allowlist staging** in monolith (`docs/architecture.md` §CORS; `CORS_ALLOWED_ORIGINS` += staging-origins).
- **Cookie-isolation staging**: `.com.ua` — public suffix (PSL), so `Domain=.fade.com.ua` (ADR 0017 §3) **reaches `stage.fade.com.ua` too** — staging session has no right to live on parent domain. Solution: staging profile sets session host-only cookie (without `Domain` attribute) — prod and staging never share session; check in test T-011 (interceptor of admin and client sessions).
- **Staging-prod parity**: same code version that goes to prod; production integrations (Checkbox, acquiring, SMS) — on test/mock providers per test cash register limit (V1-checkpoint 11.2); full test pass (T-132) executed on staging before prod.

## Why

Launch without staging = first prod-deploy tested in production: migration errors, CORS, cookie and SSL caught on live money and live clients. Earlier T-303 practiced "staging on final steps"; founder decision: **staging mandatory before prod**, separate gate task, not fragment of T-303.

## Requirements sources

- Founder decision 2026-09-25: `stage.fade.com.ua` mandatory before prod
- ADR 0051 (hosting stage/prod — one VPS + R2, cold DR), ADR 0052 (branches `stage`/`main`, autodeploy on push), ADR 0017 (domains and cookie), ADR 0018 (dev-environment), `docs/architecture.md` §CORS
- T-303 (deploy/domains/SSL — final steps), T-002 (CI-pipeline), T-300 (secrets), T-132 (test pass on production), T-011 (web-sessions)

## Done

- [ ] Staging domains + SSL work (`*.stage.fade.com.ua` + apex `stage.fade.com.ua`)
- [ ] Push to `stage` deploys staging, Release PR to `main` deploys prod (ADR 0052); DB/secrets staging separate; migrations first there
- [ ] CORS-allowlist staging validated (web/admin read api.stage; prod-origins not mixed)
- [ ] On live stage session host-only (code — T-4614d); prod and staging sessions don't intersect, admin isolated (ADR 0017 §3)
- [ ] Test pass T-132 executed on staging on same version that goes to prod
- [ ] Checklist v1 (11.x) contains item "staging deployed" — prod-deploy gate
- [ ] (with traffic growth) hot-standby Box2 added per ADR 0051 — DR from hot standby, not cold

## Risks

- [ ] **PSL-cookie**: without host-only staging profile staging shares client session with prod — check earlier than all (taking ADR 0017 warning as basis)
- [ ] **Drift staging ↔ prod**: staging class ≠ prod class healed by documentation/CI, not on-the-fly decision
