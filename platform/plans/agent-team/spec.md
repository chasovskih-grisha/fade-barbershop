# Agent team

Decisions for the build-team that writes this repository. Product assistants (ADR 0020) are a different system and stay in the `assistants` context.

## Seats

A seat is a craft. These ids are closed:

| Id | Writes product code | Picks tasks tagged | Run |
|---|---|---|---|
| `product-owner` | no | — | `discover`, daily |
| `content-editor` | no | — | `discover`, daily |
| `project-manager` | no | — | none in v1 |
| `conductor` | no | — | none in v1 |
| `qa` | test harness only | any task in `review` | `accept`, twice a day |
| `backend-developer` | yes | `backend` | `implement`, hourly |
| `frontend-developer` | yes | `frontend` | `implement`, hourly |
| `mobile-developer` | yes | `mobile` | `implement`, hourly |
| `designer` | yes | `design` | `implement`, hourly |
| `seo` | yes | `seo` | `implement`, hourly |
| `devops` | yes | `devops` | `implement`, hourly |

There is no `fullstack-developer` seat. There is no founder seat. The founder is the human. A task with an open founder decision stays `todo`.

`conductor` may edit `agents/` when a human asks. No scheduled job may create a seat, a domain, or an Antigravity sidecar.

## One backlog

Tasks stay in `backlog/tasks/` with status in `backlog/index/`. A seat's queue is the index filtered by its tag. A separate backlog per seat is not created.

A task whose tags include more than one of `backend`, `frontend`, `mobile`, `design`, `seo`, `devops` is not implementable. The discover run slices it into single-tag tasks (the existing `T-xxxxa` / `T-xxxxb` shape) and sets the parent to `split`. That slice is the one backlog change for that run.

## Runs

One run, one responsibility.

**discover** (`product-owner`, `content-editor`). Reads the repo. Writes no file under `apps/` or `packages/`. Outcome is nothing, or exactly one backlog change: a new sourced task, or one slice of a multi-tag task. A new task cites an acceptance criterion, an ADR, a screen spec, or a failing test that no open task already cites. Ready `todo` work for that area is finished before a new idea is filed. The 649 existing `todo` tasks are the queue.

**implement** (the six code seats). The scheduled command is `agent-preflight.mjs`. It exits without a model call when the worktree is dirty, a run marker is younger than 12 minutes, and the seat has neither a ready `todo` nor an `in_progress` task. A claim requires `## Implementation plan` in the task file: an owned product path, an owned test path, and a command that runs that test. The seat may have one `in_progress` row. `node scripts/agent-gate.mjs review` commits only when the diff changes an owned product file on a planned path by more than a comment, a blank file, or a one-line stub, and adds a test case to the planned test. The command writes `## Implementation notes` from that file list and sets `review`.

**accept** (`qa`). One run takes one step. `node scripts/agent-gate.mjs qa --task <id>` runs the planned test, then runs it again with the product files restored to the parent of the review commit. The second run must fail. It writes `## QA` and sets `qa` only when that holds. The push hook allows `todo` → `in_progress` → `review` → `qa` → `done`, and `review` → `todo`. A `qa` commit changes the task file and the index only. `done` is a later run: the `qa` commit must already be on `origin/stage` at the start of that run. A failed command is one new defect task. Accept does not implement the fix and does not touch an `in_progress` row.

## Owns

Product paths do not overlap. Backlog files are shared and are not part of `owns`.

| Seat | Domain | Owns |
|---|---|---|
| `backend-developer` | `identity` | `apps/api/src/identity` |
| `backend-developer` | `catalog` | `apps/api/src/catalog`, `apps/api/src/locations` |
| `backend-developer` | `scheduling` | `apps/api/src/scheduling`, `apps/api/src/booking`, `apps/api/src/appointment-party` |
| `backend-developer` | `commerce` | `apps/api/src/billing`, `apps/api/src/loyalty`, `apps/api/src/discounts`, `apps/api/src/gift-certificates`, `apps/api/src/memberships` |
| `backend-developer` | `relationship` | `apps/api/src/crm`, `apps/api/src/messaging`, `apps/api/src/notifications`, `apps/api/src/campaigns`, `apps/api/src/retention`, `apps/api/src/feedback`, `apps/api/src/support`, `apps/api/src/referrals`, `apps/api/src/reputation` |
| `backend-developer` | `content` | `apps/api/src/content`, `apps/api/src/portfolio` |
| `backend-developer` | `platform` | `apps/api/src/shared`, `apps/api/src/analytics`, `apps/api/src/haircut-ai`, `apps/api/src/onboarding`, `apps/api/src/realtime`, `apps/api/src/seed-admin.ts`, `apps/api/src/seed-customers.ts`, `apps/api/src/seed-customers.fakes.ts`, `packages/contracts`, `packages/domain-shared`, `packages/migration-framework` |
| `frontend-developer` | `web` | `apps/web`, except `apps/web/src/lib/seo`, `apps/web/src/app/sitemap.ts`, `apps/web/src/app/robots.ts` |
| `frontend-developer` | `admin` | `apps/admin` |
| `mobile-developer` | `mobile` | `apps/mobile` |
| `designer` | `design-system` | `packages/ui`, `packages/design-tokens`, `packages/brand-assets` |
| `seo` | `seo` | `apps/web/src/lib/seo`, `apps/web/src/app/sitemap.ts`, `apps/web/src/app/robots.ts` |
| `devops` | `infra` | `infra` |
| `qa` | `harness` | `packages/test-utils`, `apps/api/src/e2e` |

`seo` does not edit page components. A metadata change inside `page.tsx` is a `frontend` task. `content-editor` files tasks tagged `content` and writes the copy in the task body; the tagged craft applies it. `qa`'s harness paths are the only product paths an accept run may edit, and only when the accepted task is tagged `qa`.

Seed files `apps/api/src/seed-*.ts` belong to `backend-developer` / `platform`.

## Layout

```
platform/agents/README.md
platform/agents/skills/<name>/SKILL.md
platform/agents/roles/<seat>/ROLE.md
platform/agents/roles/<seat>/domains/<domain>.md
platform/agents/roles/<seat>/automations/<name>.md
```

`SKILL.md` frontmatter: `name` (equals the directory), `description`.

`ROLE.md` frontmatter: `name`, `writes_product` (`true` or `false`).

Domain file frontmatter: `seat`, `domain`, `tag`, `owns` (list of repo-relative paths), optional `except` (paths carved out of an `owns` directory for another seat). `apps/web` lists the three seo paths in `except`. Those three are `seo`'s `owns`.

Automation frontmatter:

```yaml
name: implement-backend
kind: implement          # discover | implement | accept
seat: backend-developer
cron: "0,15,30,45 * * * *"  # CRON_TZ=Europe/Kiev, minute hour day month weekday
model: flash_lite
skills: [claim-task, implement-task]
```

`owns` is not repeated on the automation. The renderer joins the seat's domain files.

## Schedules

Timezone `Europe/Kiev`. Model Flash Lite, CLI tier `flash_lite`. Each automation has a detached worktree at `~/.gemini/worktrees/fade-barber/platform/<automation>`, created from `origin/stage`, and its Antigravity project folder is that path. Publish with `git push origin HEAD:stage`. Sidecar `args` are `CRON_TZ=Europe/Kiev <cron>`, the absolute `node` binary, `scripts/agent-preflight.mjs` inside that worktree, the automation id, then the prompt. Preflight starts `agentapi new-conversation --model=flash_lite` only when there is something to do. `hooks/pre-push` runs `agent-gate.mjs verify-range` for pushes to `stage`. `--install` copies that hook into the repo's git hooks directory and each worktree's.

| Automation | Cron |
|---|---|
| `discover-backlog` | `14 7,11,15,19 * * *` |
| `discover-copy` | `16 7,11,15,19 * * *` |
| `accept-review` | `12,27,42,57 * * * *` |
| `implement-backend` | `0,15,30,45 * * * *` |
| `implement-frontend` | `2,17,32,47 * * * *` |
| `implement-mobile` | `4,19,34,49 * * * *` |
| `implement-design` | `6,21,36,51 * * * *` |
| `implement-seo` | `8,23,38,53 * * * *` |
| `implement-devops` | `10,25,40,55 * * * *` |

## Antigravity

`agents/**` in git is the source of truth. `scripts/render-antigravity-sidecars.mjs` writes `sidecar.json` files from the automation markdown. Prompts edited only inside Antigravity are drift. The 37 existing `fade-*` sidecars are removed at cutover, after the new sidecars exist. `ade-automation-conductor` stays removed.

## How it is used

A human reads `agents/README.md` and runs `pnpm agents:validate`.

Antigravity runs the schedules above. Discover may add one sourced task at each of its four daytime starts. Each code seat takes one ready task four times an hour, or exits. Qa accepts or returns one reviewed task four times an hour. A start that finds its own worktree dirty exits, so one seat does not run two tasks at once. The founder reads the journal and answers blocked decisions. Adding a seat means a new `ROLE.md`, domains, one automation, a green validator, and a re-render. Nobody creates a sidecar by hand.
