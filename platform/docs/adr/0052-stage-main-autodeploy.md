# ADR 0052: Deploy stage/prod — branches `stage` and `main`

- Status: accepted (**revision 2026-11-11**: Release PR merge automated — green CI + 12-hour soak; human veto = close the PR. Same day: prod is the Ukrainian VPS in ADR 0051; deploy is Compose over SSH; no Coolify; no remote stage until the 8 GB tariff)
- Date: 2026-09-29 (revision: 2026-11-11)
- Contexts: infra, devops; continuation of ADR 0051, T-303, T-4531

## Context

Hosting is decided in ADR 0051 (revision 2026-11-11): one GMHost VPS in Ukraine, prod only, Docker Compose and Caddy. Staging is the local Docker stack until that VPS is the 8 GB tariff. What this ADR decides is how code gets to prod. Separate tags, manual deploy confirmation and feature branches directly to prod are redundant for this team.

Only platform deploys: `apps/api`, `apps/web`, `apps/admin` from one commit. Mobile app to stores doesn't go through this pipeline.

## Decision

Two long-lived branches, and only them: `stage` and `main`. No other branches in repository. Push to `main` deploys prod. Push to `stage` runs CI and does not deploy a remote host. No separate "deploy" button. Prod gate — Release PR and green CI.

| Branch | Where | When |
|--------|-------|------|
| `stage` | local Docker (ADR 0018) | every push runs CI; no remote host until the 8 GB tariff (ADR 0051) |
| `main` | prod domains ADR 0017, the GMHost VPS | every push, immediately |

### Flow

1. Agent and human commit and push directly to `stage`. No separate working branch. No feature PR.
2. Push to `stage` runs CI. It does not deploy a remote host (ADR 0051): the check before a Release PR is the local Docker stack.
3. When stage suits — only pull request in repository: Release PR from `stage` to `main`. This is merge commit, no squash. Merge is automated (see revision 2026-11-11).
4. Push to `main` deploys same commit to prod.
5. Immediately after merge to `main`, merge `main` back to `stage`. Otherwise release merge commit is only in `main`, and next Release PR is noisy.

### Rules to keep branches from diverging

- Only `stage` gets into `main`. Don't merge direct push to `main` and any PR not from `stage`.
- Changes to `stage` come by direct commit. Don't open pull request to `stage`.
- Hotfix also committed to `stage`, then short Release PR to `main`.
- Don't squash Release PR. No squash merges: feature PRs, for which they were, cancelled.

### Who deploys

Prod is the single GMHost VPS (ADR 0051). After green CI, GitHub Actions on `main` SSHs to that VPS and runs Docker Compose for api, web, admin, Postgres, Redis and Caddy. Secrets live in the GitHub Environment `production`, not in git. `prisma migrate deploy` runs on api start against that database. There is one database, so the migration runs there; the local Docker stack is where it was already applied.

`.github/workflows/deploy.yml` still calls Coolify and exits 0 when the webhook secret is empty. T-4614c replaces that call with the SSH Compose deploy. Until then a green workflow is not a deploy.

## Consequences

- Prod doesn't get commit that wasn't on stage.
- No manual step between merge and server. Error in `main` immediately on prod; protection — don't merge Release PR until stage verified.
- After each release required reverse merge `main` → `stage`. Without it branches diverge by one commit.
- Revision 2026-11-11: the merge itself is also automated. The prod gate is now green CI plus a 12-hour soak instead of a manual merge; the human veto is closing the Release PR. Error in `main` still lands on prod immediately.

## Rejected

1. **Tags `v*` and manual prod confirmation** — extra step. Gate already exists: Release PR.
2. **Feature branches directly to `main`** — prod gets code that wasn't on stage.
3. **Separate deploy repository** — Actions already runs on push. A second repository is not needed. The 2026-09-29 text also rejected an SSH script because Coolify built the image; revision 2026-11-11 uses SSH Compose, because Coolify does not fit on the 4 GB VPS (ADR 0051).
4. **Feature branches and feature PR in `stage`** (revision 2026-10-17) — extra step. Agents commit directly to `stage`; only PR — release, `stage` → `main`.
5. **Manual Release PR merge** (revision 2026-11-11) — the 12-hour soak plus green CI already give the review window; a daily automation removes the human toil while keeping the veto (close the PR).

## Revision 2026-11-11: Release PR merge automated

Originally the Release PR merge was the manual, human step — the last "press the button" gate before prod. It is now automated, because the team wants verified `stage` changes to reach prod on a daily rhythm without a manual step, while keeping the human veto.

A daily automation merges the open Release PR only when **all** of these hold; otherwise the PR stays open and the run reports why:

- CI on the PR head is green — no failing, pending or cancelled checks;
- the PR is mergeable, with no conflicts;
- the PR has soaked for at least 12 hours since it was opened — the window for a human to review stage;
- the PR head is the current tip of `stage` — a stale PR is refreshed first, never merged.

The merge is always a merge commit, never squash. If a condition fails, or branch protection or a required review blocks the merge, the automation does not force it. Immediately after a successful merge it performs the reverse merge (flow step 5). The human veto is unchanged in spirit: closing or holding the Release PR stops the merge.
