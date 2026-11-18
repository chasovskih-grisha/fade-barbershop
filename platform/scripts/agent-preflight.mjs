import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseFrontmatter } from './validate-agents.mjs';
import { classifyOpenReviews, loadRows, readyTodos, SEAT_TAG, withdrawTask } from './agent-gate.mjs';

export const BUSY_MS = 12 * 60 * 1000;

const productFile = (file) => !file.startsWith('backlog/') && !file.startsWith('agents/');

/** What to do with commits this worktree has and origin/stage does not. */
export function planSync(uniqueFiles) {
  if (!uniqueFiles || uniqueFiles.length === 0) return 'reset-if-behind';
  if (uniqueFiles.some(productFile)) return 'publish';
  return 'discard';
}

/** Whether this start should call the model. */
export function planStart({
  kind,
  eligible = 0,
  inProgress = 0,
  realReviews = 0,
  statusOnlyReviews = 0,
  qaReady = 0,
}) {
  if (kind === 'implement' && eligible === 0 && inProgress === 0) {
    return { action: 'skip', reason: 'no ready todo' };
  }
  if (kind === 'accept' && statusOnlyReviews > 0 && realReviews === 0 && qaReady === 0) {
    return { action: 'withdraw' };
  }
  if (kind === 'accept' && statusOnlyReviews > 0) return { action: 'withdraw-and-start' };
  if (kind === 'accept' && realReviews === 0 && qaReady === 0) return { action: 'skip', reason: 'no review row' };
  return { action: 'start' };
}

export function runPreflight(io) {
  if (io.dirty()) return io.finish(0, 'worktree is dirty');
  const age = io.markerAge();
  if (age != null && age < BUSY_MS) return io.finish(0, 'this seat is still in a run');
  if (!io.fetch()) return io.finish(0, 'fetch failed');
  const sync = planSync(io.uniqueFiles());
  if (sync === 'discard') io.resetHard();
  if (sync === 'reset-if-behind' && io.behind()) io.resetHard();
  if (sync === 'publish' && !io.publish()) return io.finish(0, 'push rejected');
  const automation = io.automation();
  const queue = io.queue(automation);
  const plan = planStart({ kind: automation.kind, ...queue });
  if (plan.action === 'withdraw' || plan.action === 'withdraw-and-start') {
    io.withdraw(queue.statusOnlyIds ?? []);
    if (plan.action === 'withdraw') return io.finish(0, 'withdrew status-only reviews');
  }
  if (plan.action === 'skip') return io.finish(0, plan.reason);
  io.mark();
  return io.start();
}

function git(root, args, { allowFail = false } = {}) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  if (result.status !== 0 && !allowFail) {
    throw new Error((result.stderr || result.stdout || `git ${args[0]} failed`).trim());
  }
  return result;
}

export function loadAutomation(root, id) {
  const roles = join(root, 'agents', 'roles');
  for (const seat of readdirSync(roles)) {
    const dir = join(roles, seat, 'automations');
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
      const automation = parseFrontmatter(readFileSync(join(dir, file), 'utf8'));
      if (automation.name === id) return automation;
    }
  }
  throw new Error(`unknown automation ${id}`);
}

function reviewSplit(root) {
  const split = classifyOpenReviews(root);
  return { real: split.real, statusOnly: split.statusOnly };
}

export function createIo(root, id, prompt) {
  const marker = join(root, '.agent-run');
  return {
    dirty: () => git(root, ['status', '--porcelain', '-uall']).stdout.trim().length > 0,
    markerAge: () => (existsSync(marker) ? Date.now() - statSync(marker).mtimeMs : null),
    fetch: () => git(root, ['fetch', 'origin', 'stage'], { allowFail: true }).status === 0,
    uniqueFiles: () => {
      const diff = git(root, ['diff', '--name-only', 'origin/stage...HEAD'], { allowFail: true });
      return diff.status === 0 ? diff.stdout.split('\n').filter(Boolean) : [];
    },
    behind: () => {
      const count = git(root, ['rev-list', '--count', 'HEAD..origin/stage'], { allowFail: true });
      return count.status === 0 && Number(count.stdout.trim()) > 0;
    },
    resetHard: () => {
      git(root, ['reset', '--hard', 'origin/stage']);
    },
    publish: () => {
      const ancestor = git(root, ['merge-base', '--is-ancestor', 'origin/stage', 'HEAD'], {
        allowFail: true,
      });
      if (ancestor.status !== 0) {
        const rebase = git(root, ['rebase', 'origin/stage'], { allowFail: true });
        if (rebase.status !== 0) {
          git(root, ['rebase', '--abort'], { allowFail: true });
          return false;
        }
      }
      return git(root, ['push', 'origin', 'HEAD:stage'], { allowFail: true }).status === 0;
    },
    automation: () => loadAutomation(root, id),
    queue: (automation) => {
      if (automation.kind === 'implement') {
        const tag = SEAT_TAG[automation.seat];
        const inProgress = loadRows(root).filter(
          (row) => row.status === 'in_progress' && row.tags.includes(tag)
        ).length;
        return { eligible: readyTodos(root, automation.seat).length, inProgress };
      }
      if (automation.kind === 'accept') {
        const split = reviewSplit(root);
        const qaReady = loadRows(root).filter((row) => row.status === 'qa').length;
        return {
          realReviews: split.real.length,
          statusOnlyReviews: split.statusOnly.length,
          statusOnlyIds: split.statusOnly,
          qaReady,
        };
      }
      return {};
    },
    withdraw: (ids) => {
      for (const taskId of ids) withdrawTask(root, taskId, { push: true });
    },
    mark: () => {
      const tip = git(root, ['rev-parse', 'origin/stage'], { allowFail: true });
      writeFileSync(marker, `${tip.status === 0 ? tip.stdout.trim() : ''}\n`);
    },
    start: () => {
      const result = spawnSync('agentapi', ['new-conversation', '--model=flash_lite', '--', prompt], {
        cwd: root,
        stdio: 'inherit',
      });
      return result.status ?? 1;
    },
    finish: (code, reason) => {
      if (reason) console.log(reason);
      return code;
    },
  };
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const id = process.argv[2];
  const prompt = process.argv[3] ?? '';
  if (!id) {
    console.error('use: agent-preflight.mjs <automation-id> <prompt>');
    process.exit(1);
  }
  process.exit(runPreflight(createIo(root, id, prompt)));
}
