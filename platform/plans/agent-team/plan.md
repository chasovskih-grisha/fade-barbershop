# Agent team Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a closed set of craft seats in the platform repo, each with one run type, and generate their Antigravity sidecars from those files.

**Architecture:** Seat ownership and run kind live in markdown under `platform/agents/`. A Node validator rejects overlapping product paths, unknown seats, and runs that do two jobs. A renderer turns each automation file into one Antigravity `sidecar.json`. The existing backlog stays the queue; seats filter it by tag.

**Tech Stack:** Markdown with YAML frontmatter, Node.js built-in test runner, existing `pnpm` scripts. No new dependency.

**Spec:** `platform/plans/agent-team/spec.md`

## Global Constraints

- Seat ids are exactly: `product-owner`, `content-editor`, `project-manager`, `conductor`, `qa`, `backend-developer`, `frontend-developer`, `mobile-developer`, `designer`, `seo`, `devops`.
- No `fullstack-developer` seat and no founder seat.
- Run `kind` is exactly `discover`, `implement`, or `accept`.
- Product `owns` paths are disjoint. Backlog paths are not `owns`.
- One run does one backlog task or exits. Discover writes nothing under `apps/` or `packages/`.
- Commits and pushes stay on `stage` (ADR 0052). Each automation uses a detached worktree at `~/.gemini/worktrees/fade-barber/platform/<automation>` and publishes with `git push origin HEAD:stage`. There is no `agents/LOCK`. Conventional Commits.
- Generated sidecars use model `flash_lite` and `CRON_TZ=Europe/Kiev`.
- Sidecar `args` are `CRON_TZ=Europe/Kiev <cron>`, the absolute `node` binary, `scripts/agent-preflight.mjs`, the automation id, then the prompt. Preflight starts `agentapi new-conversation --model=flash_lite`.
- `agents/**` in git is the source of truth. Antigravity prompts are rendered from it.
- Do not delete `~/.gemini/config/sidecars/fade-*` while implementing this plan. Cutover is a documented step the human runs after review.
- Platform documents are English. Code identifiers are English.

## Review Focus

- Two seats list the same product path: validator exits 1 and names both seats.
- A `discover` automation lists any path under `apps/` or `packages/` in a domain `owns`: validator exits 1.
- An automation `kind` outside `discover` | `implement` | `accept`: validator exits 1.
- A second claim while `agents/LOCK` exists: `claimLock` throws and does not overwrite the file.
- Renderer output for a seat omits a domain path, or includes another seat's path: fixture test fails.

---

### Task 1: Roster validator

**Files:**
- Create: `platform/scripts/validate-agents.mjs`
- Create: `platform/scripts/agent-lock.mjs`
- Create: `platform/scripts/validate-agents.spec.mjs`
- Modify: `platform/package.json` (add script `agents:validate`)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `validateAgents(root: string) -> { ok: boolean, errors: string[] }` from `scripts/validate-agents.mjs`
  - `claimLock(root: string, claim: { seat: string, taskId: string, at: string }) -> void` from `scripts/agent-lock.mjs`. Throws `LockHeldError` when `agents/LOCK` exists. Writes `seat`, `taskId`, and `at` as three lines.
  - `releaseLock(root: string) -> void`. Throws if the file is already absent.

- [ ] **Step 1: Write the failing test**

Create `scripts/validate-agents.spec.mjs` using `node:test` and a temp directory per case. Cover these assertions with one test each:

```js
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { validateAgents } from './validate-agents.mjs'
import { claimLock, LockHeldError } from './agent-lock.mjs'

test('overlapping owns names both seats', async () => {
  const root = await fixture({
    'agents/roles/frontend-developer/domains/web.md': domain('frontend-developer', 'web', 'frontend', ['apps/web']),
    'agents/roles/seo/domains/seo.md': domain('seo', 'seo', 'seo', ['apps/web']),
  })
  const result = validateAgents(root)
  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), /frontend-developer/)
  assert.match(result.errors.join('\n'), /seo/)
  await rm(root, { recursive: true })
})

test('discover seat must not own apps or packages', async () => {
  const root = await fixture({
    'agents/roles/product-owner/ROLE.md': role('product-owner', false),
    'agents/roles/product-owner/domains/backlog.md': domain('product-owner', 'backlog', '', ['apps/web']),
    'agents/roles/product-owner/automations/discover-backlog.md': automation('discover-backlog', 'discover', 'product-owner'),
  })
  const result = validateAgents(root)
  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), /discover/)
  await rm(root, { recursive: true })
})

test('kind must be discover, implement, or accept', async () => {
  const root = await fixture({
    'agents/roles/qa/automations/patrol.md': automation('patrol', 'patrol', 'qa'),
  })
  const result = validateAgents(root)
  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), /patrol/)
  await rm(root, { recursive: true })
})

test('second claim does not overwrite LOCK', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agents-'))
  await mkdir(join(root, 'agents'), { recursive: true })
  claimLock(root, { seat: 'backend-developer', taskId: 'T-010', at: '2026-11-16T07:05:00+02:00' })
  assert.throws(
    () => claimLock(root, { seat: 'frontend-developer', taskId: 'T-020', at: '2026-11-16T07:10:00+02:00' }),
    LockHeldError,
  )
  await rm(root, { recursive: true })
})
test('except keeps a carved-out path from counting as overlap', async () => {
  const root = await fixture({
    'agents/roles/frontend-developer/ROLE.md': role('frontend-developer', true),
    'agents/roles/seo/ROLE.md': role('seo', true),
    'agents/roles/frontend-developer/domains/web.md': domain('frontend-developer', 'web', 'frontend', ['apps/web'], ['apps/web/src/lib/seo']),
    'agents/roles/seo/domains/seo.md': domain('seo', 'seo', 'seo', ['apps/web/src/lib/seo']),
  })
  const result = validateAgents(root)
  assert.equal(result.ok, true, result.errors.join('\n'))
  await rm(root, { recursive: true })
})
```

Helpers `fixture`, `role`, `domain`, and `automation` live in the same spec file. `domain` writes frontmatter keys `seat`, `domain`, `tag`, `owns`, and an optional `except` list as its fifth argument. The overlap test calls it without `except`. `automation` writes `name`, `kind`, `seat`, `cron: "0 7 * * *"`, `model: flash_lite`, `skills: [discover-task]`.

- [ ] **Step 2: Run the test to verify it fails**

Run from `platform/`: `node --test scripts/validate-agents.spec.mjs`

Expected: FAIL. `validate-agents.mjs` and `agent-lock.mjs` cannot be imported. The file has 5 tests.

- [ ] **Step 3: Implement `validateAgents` and `claimLock`**

`validateAgents` walks `agents/roles/*`. It reports one error string per violation:

- `ROLE.md` `name` is not in the closed seat list, or does not match the directory.
- `writes_product` is missing.
- Domain `owns` entries that are equal, or where one path is a prefix of another followed by `/`, across any seats, unless the longer path is listed in the shorter path's `except`. Error text includes both seat ids and both paths. A path in `except` that no other seat owns is an error.
- A seat with `writes_product: false` that has any `owns` path starting with `apps/` or `packages/`. Exception: seat `qa` may own only `packages/test-utils` and `apps/api/src/e2e`.
- Automation `kind` not in `discover`, `implement`, `accept`.
- Automation `seat` different from the parent role directory.
- `discover` on a seat whose domains include an `apps/` or `packages/` path.
- `implement` on a seat with `writes_product: false`.
- `accept` whose seat is not `qa`.
- `SKILL.md` whose frontmatter `name` differs from its parent directory.
- Unknown seat id anywhere. A missing seat is not an error: the closed list is a membership check. The full tree is what Task 2 commits.

`claimLock` writes `agents/LOCK` with `wx` so the second caller gets `LockHeldError`. `releaseLock` unlinks it and throws `LockAbsentError` if it was already gone. Do not import either module from application code.

- [ ] **Step 4: Run the test to verify it passes**

Run from `platform/`: `node --test scripts/validate-agents.spec.mjs`

Expected: PASS, 5 tests.

- [ ] **Step 5: Register the script**

Add to `package.json` scripts: `"agents:validate": "node scripts/validate-agents.mjs"`.

The CLI calls `validateAgents(process.cwd())`, prints each error, and exits 1 when `ok` is false. With no `agents/` directory it exits 1 with `agents/ is missing`.

- [ ] **Step 6: Commit**

```bash
git add scripts/validate-agents.mjs scripts/validate-agents.spec.mjs scripts/agent-lock.mjs package.json
git commit -m "$(cat <<'EOF'
feat(agents): reject overlapping seats and a second lock

EOF
)"
```

### Task 2: Seat files

**Files:**
- Create: `platform/agents/README.md`
- Create: `platform/agents/roles/<seat>/ROLE.md` for each id in the spec table
- Create: `platform/agents/roles/<seat>/domains/<domain>.md` for each row of the Owns table
- Modify: `platform/AGENTS.md` (add one paragraph after the title)

**Interfaces:**
- Consumes: `validateAgents` from Task 1
- Produces: the directory tree Task 4's automations and Task 5's renderer read. Domain frontmatter keys are `seat`, `domain`, `tag`, `owns`, and `except` on `frontend-developer` / `web` only.

- [ ] **Step 1: Write the seat and domain files from the spec**

Copy each Owns row into `agents/roles/<seat>/domains/<domain>.md` with that frontmatter and a one-paragraph body: what the domain is, and the handoff (a change outside `owns` becomes a backlog task, then the run stops).

`ROLE.md` for each seat: frontmatter `name` and `writes_product`, then who claims work, which tag, and which run kind. `project-manager` and `conductor` have `writes_product: false`, no domain files, and no automation files. Say in the conductor body that a scheduled job must not create seats or sidecars. Say in the project-manager body that v1 ordering is the implement skill's milestone rule, not a person.

`content-editor` and `product-owner`: `writes_product: false`, no domain `owns`.

`agents/README.md` states the three runs, the lock, the closed seat list, and points at this spec's "How it is used" in the language of the spec (do not invent a fourth run).

- [ ] **Step 2: Point the repo guide at the roster**

In `platform/AGENTS.md`, after the title, add: the build-team roster is `agents/README.md`; product assistants stay the `assistants` context (ADR 0020).

- [ ] **Step 3: Run the validator**

Run from `platform/`: `pnpm agents:validate`

Expected: exit 0. Overlap and discover-owns errors are absent. `project-manager` and `conductor` produce no "missing automation" error because the validator does not require an automation file.

- [ ] **Step 4: Commit**

```bash
git add agents AGENTS.md
git commit -m "$(cat <<'EOF'
docs(agents): add the closed seat roster and path ownership

EOF
)"
```

### Task 3: Shared skills

**Files:**
- Create: `platform/agents/skills/discover-task/SKILL.md`
- Create: `platform/agents/skills/claim-task/SKILL.md`
- Create: `platform/agents/skills/implement-task/SKILL.md`
- Create: `platform/agents/skills/accept-task/SKILL.md`

**Interfaces:**
- Consumes: lock behavior from `scripts/agent-lock.mjs` (the skill tells the agent to run it; the skill does not reimplement the check)
- Produces: skill names the automation frontmatter lists: `discover-task`, `claim-task`, `implement-task`, `accept-task`

- [ ] **Step 1: Write the four skills**

Frontmatter `name` equals the directory. `description` is one sentence that says when to load it.

`discover-task`: search open tasks before writing. If a multi-tag task is implementable aside from its tags, slice that one task and stop. Otherwise file at most one task that cites an AC, ADR, screen spec, or failing test with no open task. Ready `todo` work for the same tag means write nothing. Do not edit `apps/` or `packages/`.

`claim-task`: `git pull` on `stage`. If `git status --porcelain` is non-empty, stop. If `agents/LOCK` exists, stop. Otherwise run `claimLock` for this seat and the chosen task id, set that index row to `in_progress`, commit that lock and the index line, and stop if the push is rejected.

`implement-task`: load only after `claim-task` succeeded for this run. Edit paths inside the seat's domain `owns` for the task's tag. Skip a task with two craft tags. Prove the Done list. Last commit sets `review`, appends one journal paragraph, and `releaseLock`. Leave the lock in place when checks fail.

`accept-task`: oldest `review` row. Re-run the Done checks. Set `done`, or add one defect task for the owning seat and leave the original `review`. Edit product files only under `packages/test-utils` or `apps/api/src/e2e`, and only for a task tagged `qa`.

- [ ] **Step 2: Run the validator**

Run from `platform/`: `pnpm agents:validate`

Expected: exit 0. Each skill `name` matches its directory.

- [ ] **Step 3: Commit**

```bash
git add agents/skills
git commit -m "$(cat <<'EOF'
docs(agents): add discover, claim, implement, and accept skills

EOF
)"
```

### Task 4: Automations

**Files:**
- Create: the nine automation files named in the spec schedule table, under `agents/roles/<seat>/automations/`

**Interfaces:**
- Consumes: skill names from Task 3; seat ids and domains from Task 2
- Produces: automation frontmatter keys `name`, `kind`, `seat`, `cron`, `model`, `skills` for the renderer

- [ ] **Step 1: Write the nine automation files**

Use the cron strings from the spec schedule table verbatim. `model: flash_lite`.

| File | kind | skills |
|---|---|---|
| `product-owner/automations/discover-backlog.md` | `discover` | `[discover-task]` |
| `content-editor/automations/discover-copy.md` | `discover` | `[discover-task]` |
| `qa/automations/accept-review.md` | `accept` | `[accept-task]` |
| `backend-developer/automations/implement-backend.md` | `implement` | `[claim-task, implement-task]` |
| `frontend-developer/automations/implement-frontend.md` | `implement` | `[claim-task, implement-task]` |
| `mobile-developer/automations/implement-mobile.md` | `implement` | `[claim-task, implement-task]` |
| `designer/automations/implement-design.md` | `implement` | `[claim-task, implement-task]` |
| `seo/automations/implement-seo.md` | `implement` | `[claim-task, implement-task]` |
| `devops/automations/implement-devops.md` | `implement` | `[claim-task, implement-task]` |

The body of each file is the seat's run rule from the spec, plus "load the listed skills before editing anything." No second responsibility in the same file.

- [ ] **Step 2: Run the validator**

Run from `platform/`: `pnpm agents:validate`

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add agents/roles
git commit -m "$(cat <<'EOF'
docs(agents): schedule one run kind per seat

EOF
)"
```

### Task 5: Antigravity renderer and cutover list

**Files:**
- Create: `platform/scripts/render-antigravity-sidecars.mjs`
- Create: `platform/scripts/render-antigravity-sidecars.spec.mjs`
- Create: `platform/agents/CUTOVER.md`
- Modify: `platform/package.json` (add script `agents:render`)

**Interfaces:**
- Consumes: automation and domain frontmatter from Tasks 2 and 4
- Produces:
  - `renderSidecars(root: string) -> Array<{ id: string, json: object }>`
  - CLI writes each object to `agents/.rendered/<id>/sidecar.json` and prints the paths. `agents/.rendered/` is gitignored.

- [ ] **Step 1: Write the failing test**

```js
test('backend sidecar owns scheduling and not apps/web', async () => {
  const root = await realPlatformRoot()
  const rendered = renderSidecars(root)
  const backend = rendered.find((entry) => entry.id === 'implement-backend')
  const prompt = backend.json.args.at(-1)
  assert.match(prompt, /apps\/api\/src\/scheduling/)
  assert.doesNotMatch(prompt, /apps\/web/)
  assert.equal(backend.json.args[0], 'CRON_TZ=Europe/Kiev 0,15,30,45 * * * *')
  assert.equal(backend.json.args[2], 'new-conversation')
  assert.equal(backend.json.args[3], '--model=flash_lite')
  assert.equal(rendered.length, 9)
})
```

`sidecar.json` shape matches the live Antigravity files: `{ builtin: "schedule", restart_policy: "always", display_name, description, args }`. `args` is `[cronLine, node, "<worktree>/scripts/agent-preflight.mjs", automationId, prompt]`. `cronLine` is `CRON_TZ=Europe/Kiev ` plus the automation's `cron`. Preflight starts `agentapi new-conversation --model=flash_lite`. The prompt lists every `owns` path of that seat and the skill names, and states the single run kind.

- [ ] **Step 2: Run the test to verify it fails**

Run from `platform/`: `node --test scripts/render-antigravity-sidecars.spec.mjs`

Expected: FAIL. Module missing.

- [ ] **Step 3: Implement `renderSidecars`**

Read the nine automation files and the domain files. One sidecar per automation. `id` is the automation `name`. Description is the first body paragraph. Do not read `~/.gemini`.

- [ ] **Step 4: Run the test to verify it passes**

Run from `platform/`: `node --test scripts/render-antigravity-sidecars.spec.mjs`

Expected: PASS.

- [ ] **Step 5: Write the cutover note**

`agents/CUTOVER.md` lists the 37 directory names under `~/.gemini/config/sidecars/` that start with `fade-`, says to render with `pnpm agents:render`, copy `agents/.rendered/*` over those sidecars only after the new nine exist, and then remove the `fade-*` directories. It names `ade-automation-conductor` as already retired. It tells the reader not to edit prompts inside Antigravity.

Add `agents/.rendered/` to `platform/.gitignore`.

Add `"agents:render": "node scripts/render-antigravity-sidecars.mjs"` to `package.json` scripts.

- [ ] **Step 6: Commit**

```bash
git add scripts/render-antigravity-sidecars.mjs scripts/render-antigravity-sidecars.spec.mjs agents/CUTOVER.md package.json .gitignore
git commit -m "$(cat <<'EOF'
feat(agents): render Antigravity sidecars from the roster

EOF
)"
```

## Self-review

- Spec seats, owns, three run kinds, lock, schedules, renderer, and cutover each have a task.
- `project-manager` and `conductor` have role files and no automation, matching "none in v1".
- Review Focus items are the four validator tests plus the renderer fixture test.
- The plan does not rewrite the 37 Antigravity prompts and does not edit `backlog/` task files.
